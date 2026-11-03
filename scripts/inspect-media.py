#!/usr/bin/env python3
"""Inspect video frames and audio content of a recording.

This is the review half of the media capability provisioned by
``scripts/setup-media-tools.sh``. It reports what is actually in a recording
rather than only metadata:

* ``probe``      stream and format facts from FFprobe.
* ``frames``     decoded video frames, extracted as PNG with their timestamps.
* ``transcribe`` speech understood by the Vosk recogniser, with word timings.
* ``events``     non-speech sound content labelled by the AudioSet classifier
                 (MIT/ast-finetuned-audioset), per window and overall.
* ``audio``      probe + transcript + sound events for any audio or video file.
* ``review``     frames + audio review for a video recording.

Audio is always decoded with FFmpeg to 16 kHz mono PCM first, so any container
the static FFmpeg build can read works, including the audio track of a screen
recording. Nothing here claims to "hear" anything: the transcript comes from a
speech model and the sound labels come from an audio-event model.

Examples
--------
    python scripts/inspect-media.py review recording.webm --out artifacts/media-inspection
    python scripts/inspect-media.py transcribe public/sounds/confetti-pop.wav
    python scripts/inspect-media.py events recording.webm --top 5
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

SAMPLE_RATE = 16000
AUDIOSET_MODEL = os.environ.get(
    "AUDIOSET_MODEL", "MIT/ast-finetuned-audioset-10-10-0.4593"
)
VOSK_MODEL_DIR = os.environ.get(
    "VOSK_MODEL_DIR",
    str(Path.home() / ".local/media-tools/models/vosk-model-small-en-us-0.15"),
)
WINDOW_SECONDS = 10.0


def tool(name: str) -> str:
    found = shutil.which(name)
    if found:
        return found
    fallback = Path.home() / ".local/media-tools/ffmpeg" / name
    if fallback.exists():
        return str(fallback)
    raise SystemExit(
        f"{name} was not found. Run scripts/setup-media-tools.sh to provision FFmpeg."
    )


def run(cmd: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True)


def probe(path: Path) -> dict:
    result = run(
        [
            tool("ffprobe"),
            "-v",
            "error",
            "-show_streams",
            "-show_format",
            "-of",
            "json",
            str(path),
        ]
    )
    if result.returncode != 0:
        raise SystemExit(f"ffprobe failed: {result.stderr.strip()}")
    data = json.loads(result.stdout)
    streams = []
    for stream in data.get("streams", []):
        streams.append(
            {
                "index": stream.get("index"),
                "type": stream.get("codec_type"),
                "codec": stream.get("codec_name"),
                "width": stream.get("width"),
                "height": stream.get("height"),
                "channels": stream.get("channels"),
                "sample_rate": stream.get("sample_rate"),
                "duration": stream.get("duration"),
                "avg_frame_rate": stream.get("avg_frame_rate"),
            }
        )
    fmt = data.get("format", {})
    return {
        "path": str(path),
        "duration_seconds": float(fmt.get("duration") or 0.0),
        "size_bytes": int(fmt.get("size") or 0),
        "format": fmt.get("format_name"),
        "streams": streams,
        "has_video": any(s["type"] == "video" for s in streams),
        "has_audio": any(s["type"] == "audio" for s in streams),
    }


def extract_frames(path: Path, out_dir: Path, count: int, duration: float) -> list[dict]:
    out_dir.mkdir(parents=True, exist_ok=True)
    frames = []
    for index in range(count):
        # Spread the samples across the recording, inset from both ends.
        position = duration * (index + 1) / (count + 1)
        target = out_dir / f"frame-{index + 1:02d}-{position:05.2f}s.png"
        result = run(
            [
                tool("ffmpeg"),
                "-hide_banner",
                "-loglevel",
                "error",
                "-ss",
                f"{position:.3f}",
                "-i",
                str(path),
                "-frames:v",
                "1",
                "-y",
                str(target),
            ]
        )
        if result.returncode != 0 or not target.exists():
            raise SystemExit(
                f"frame extraction failed at {position:.2f}s: {result.stderr.strip()}"
            )
        frames.append({"time_seconds": round(position, 3), "file": str(target)})
    return frames


def decode_wav(path: Path, workdir: Path) -> Path:
    target = workdir / "audio-16k-mono.wav"
    result = run(
        [
            tool("ffmpeg"),
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(path),
            "-vn",
            "-ac",
            "1",
            "-ar",
            str(SAMPLE_RATE),
            "-acodec",
            "pcm_s16le",
            "-y",
            str(target),
        ]
    )
    if result.returncode != 0:
        raise SystemExit(f"audio decode failed: {result.stderr.strip()}")
    return target


def read_pcm(wav_path: Path) -> tuple[bytes, float]:
    with wave.open(str(wav_path), "rb") as handle:
        frames = handle.readframes(handle.getnframes())
        duration = handle.getnframes() / float(handle.getframerate() or SAMPLE_RATE)
    return frames, duration


def transcribe(wav_path: Path) -> dict:
    from vosk import KaldiRecognizer, Model, SetLogLevel

    if not Path(VOSK_MODEL_DIR).is_dir():
        return {
            "available": False,
            "reason": f"speech model not found at {VOSK_MODEL_DIR}; run scripts/setup-media-tools.sh",
            "text": "",
            "words": [],
        }

    SetLogLevel(-1)
    model = Model(VOSK_MODEL_DIR)
    recogniser = KaldiRecognizer(model, SAMPLE_RATE)
    recogniser.SetWords(True)

    with wave.open(str(wav_path), "rb") as handle:
        words: list[dict] = []
        while True:
            chunk = handle.readframes(4000)
            if not chunk:
                break
            if recogniser.AcceptWaveform(chunk):
                words.extend(json.loads(recogniser.Result()).get("result", []))
        words.extend(json.loads(recogniser.FinalResult()).get("result", []))

    text = " ".join(word["word"] for word in words).strip()
    return {
        "available": True,
        "model": Path(VOSK_MODEL_DIR).name,
        "text": text,
        "words": [
            {"word": w["word"], "start": w["start"], "end": w["end"]} for w in words
        ],
    }


def load_audio_samples(wav_path: Path):
    import numpy as np
    import soundfile as sf

    samples, rate = sf.read(str(wav_path), dtype="float32")
    if samples.ndim > 1:
        samples = samples.mean(axis=1)
    if rate != SAMPLE_RATE:
        raise SystemExit(f"unexpected sample rate {rate}; expected {SAMPLE_RATE}")
    return np.asarray(samples), rate


def classify_events(wav_path: Path, top: int) -> dict:
    try:
        import torch
        from transformers import AutoFeatureExtractor, AutoModelForAudioClassification
    except ImportError as error:  # pragma: no cover - reported, not raised
        return {
            "available": False,
            "reason": f"audio-event stack missing ({error}); run scripts/setup-media-tools.sh",
            "windows": [],
            "top": [],
        }

    samples, rate = load_audio_samples(wav_path)
    feature_extractor = AutoFeatureExtractor.from_pretrained(AUDIOSET_MODEL)
    model = AutoModelForAudioClassification.from_pretrained(AUDIOSET_MODEL)
    labels = model.config.id2label

    def score(chunk) -> list[dict]:
        if len(chunk) < rate * 0.1:
            return []
        inputs = feature_extractor(chunk, sampling_rate=rate, return_tensors="pt")
        with torch.no_grad():
            logits = model(**inputs).logits
        probabilities = torch.sigmoid(logits)[0]
        values, indices = torch.topk(probabilities, k=min(top, probabilities.shape[0]))
        return [
            {"label": labels[int(index)], "score": round(float(value), 4)}
            for value, index in zip(values, indices)
        ]

    window_size = int(rate * WINDOW_SECONDS)
    windows = []
    for start in range(0, max(len(samples), 1), window_size):
        chunk = samples[start : start + window_size]
        ranked = score(chunk)
        if not ranked:
            continue
        windows.append(
            {
                "start_seconds": round(start / rate, 2),
                "end_seconds": round(min(len(samples), start + window_size) / rate, 2),
                "top": ranked,
            }
        )

    overall = score(samples[: int(rate * 60)]) if len(samples) else []
    return {
        "available": True,
        "model": AUDIOSET_MODEL,
        "windows": windows,
        "top": overall,
    }


def audio_review(path: Path) -> dict:
    with tempfile.TemporaryDirectory() as tmp:
        wav_path = decode_wav(path, Path(tmp))
        _pcm, duration = read_pcm(wav_path)
        return {
            "duration_seconds": round(duration, 3),
            "speech": transcribe(wav_path),
            "sound_events": classify_events(wav_path, top=5),
        }


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def describe(report: dict) -> str:
    lines = [f"Recording: {report['probe']['path']}", ""]
    lines.append(
        "Streams: "
        + ", ".join(
            f"{s['type']}:{s['codec']}"
            + (f" {s['width']}x{s['height']}" if s.get("width") else "")
            + (f" {s['sample_rate']}Hz/{s['channels']}ch" if s.get("sample_rate") else "")
            for s in report["probe"]["streams"]
        )
    )
    lines.append(f"Duration: {report['probe']['duration_seconds']:.2f}s")
    if report.get("frames"):
        lines.append("")
        lines.append(f"Frames written: {len(report['frames'])}")
        for frame in report["frames"]:
            lines.append(f"  {frame['time_seconds']:>6.2f}s -> {frame['file']}")
    speech = report.get("audio", {}).get("speech", {})
    if speech:
        lines.append("")
        if speech.get("available"):
            lines.append(
                f"Speech ({speech['model']}): {speech['text'] or '(no speech recognised)'}"
            )
            if speech.get("words"):
                lines.append(
                    "  first words: "
                    + ", ".join(
                        f"{w['word']}@{w['start']:.2f}s" for w in speech["words"][:8]
                    )
                )
        else:
            lines.append(f"Speech: unavailable — {speech.get('reason')}")
    events = report.get("audio", {}).get("sound_events", {})
    if events:
        lines.append("")
        if events.get("available"):
            lines.append(f"Sound events ({events['model']}):")
            for item in events.get("top", []):
                lines.append(f"  {item['score']:.3f}  {item['label']}")
            for window in events.get("windows", []):
                labels = ", ".join(
                    f"{i['label']}({i['score']:.2f})" for i in window["top"][:3]
                )
                lines.append(
                    f"  {window['start_seconds']:>5.2f}-{window['end_seconds']:>5.2f}s: {labels}"
                )
        else:
            lines.append(f"Sound events: unavailable — {events.get('reason')}")
    return "\n".join(lines)


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "command", choices=["probe", "frames", "transcribe", "events", "audio", "review"]
    )
    parser.add_argument("path", type=Path)
    parser.add_argument("--out", type=Path, default=Path("artifacts/media-inspection"))
    parser.add_argument("--frames", type=int, default=4)
    parser.add_argument("--top", type=int, default=5)
    parser.add_argument(
        "--json", action="store_true", help="print the JSON report instead of a summary"
    )
    args = parser.parse_args(argv)

    path = args.path
    if not path.exists():
        raise SystemExit(f"file not found: {path}")

    probe_report = probe(path)

    if args.command == "probe":
        print(json.dumps(probe_report, indent=2))
        return 0

    if args.command == "frames":
        frames = extract_frames(
            path,
            args.out / f"{path.stem}-frames",
            args.frames,
            probe_report["duration_seconds"],
        )
        print(json.dumps(frames, indent=2))
        return 0

    if args.command == "transcribe":
        with tempfile.TemporaryDirectory() as tmp:
            result = transcribe(decode_wav(path, Path(tmp)))
        print(json.dumps(result, indent=2))
        return 0

    if args.command == "events":
        with tempfile.TemporaryDirectory() as tmp:
            result = classify_events(decode_wav(path, Path(tmp)), top=args.top)
        print(json.dumps(result, indent=2))
        return 0

    report: dict = {"probe": probe_report}
    if args.command == "audio":
        result = audio_review(path)
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print(json.dumps(result, indent=2))
        return 0

    if args.command == "review" and probe_report["has_video"]:
        report["frames"] = extract_frames(
            path,
            args.out / f"{path.stem}-frames",
            args.frames,
            probe_report["duration_seconds"],
        )
    if probe_report["has_audio"]:
        report["audio"] = audio_review(path)

    write_json(args.out / f"{path.stem}-review.json", report)
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print(describe(report))
        print()
        print(f"JSON report: {args.out / f'{path.stem}-review.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
