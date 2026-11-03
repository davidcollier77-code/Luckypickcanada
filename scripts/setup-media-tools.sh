#!/usr/bin/env bash
# setup-media-tools.sh — provision the Freebuff workspace's video and audio
# inspection stack WITHOUT root and WITHOUT changing sandbox security settings.
#
# Why this exists: the workspace can already drive Chromium (see
# scripts/setup-chromium-libs.sh), but a recording could not be reviewed: there
# was no FFmpeg/FFprobe for frame extraction or stream inspection, and no audio
# model that actually understands speech or sound content. This script
# provisions all of it at user level, under $HOME, which is durable in this
# workspace, so the capability survives archive/restore.
#
# It does not run `sudo`, does not change `no-new-privileges`, does not pass
# sandbox-weakening flags to anything, and does not touch the repository's
# dependency graph (so the production build is unaffected).
#
# Usage:
#   scripts/setup-media-tools.sh            # provision (idempotent)
#   scripts/setup-media-tools.sh --check     # verify only, provision nothing
#   eval "$(scripts/setup-media-tools.sh --env)"   # export PATH/model variables
#
# Environment overrides:
#   MEDIA_TOOLS_PREFIX   tool root                (default ~/.local/media-tools)
#   MEDIA_TOOLS_BIN      symlink directory        (default ~/.local/bin)
#   FFMPEG_URL           FFmpeg static build URL
#   VOSK_MODEL_URL       Vosk speech model zip URL
#   AUDIOSET_MODEL       Hugging Face AudioSet classifier
#
# What gets installed:
#   ffmpeg, ffprobe      static build -> $MEDIA_TOOLS_PREFIX/ffmpeg
#   python venv          vosk (speech), soundfile/numpy (audio I/O),
#                        torch (CPU) + transformers (AudioSet audio events)
#   Vosk model           $MEDIA_TOOLS_PREFIX/models/vosk-model-small-en-us-0.15
#   AudioSet model       cached by transformers under $HOME/.cache/huggingface
#
# The audio review itself is scripts/inspect-media.py.

set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
PREFIX="${MEDIA_TOOLS_PREFIX:-$HOME/.local/media-tools}"
BIN_DIR="${MEDIA_TOOLS_BIN:-$HOME/.local/bin}"
FFMPEG_URL="${FFMPEG_URL:-https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz}"
VOSK_MODEL_URL="${VOSK_MODEL_URL:-https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip}"
VOSK_MODEL_NAME="vosk-model-small-en-us-0.15"
AUDIOSET_MODEL="${AUDIOSET_MODEL:-MIT/ast-finetuned-audioset-10-10-0.4593}"
VENV="$PREFIX/venv"
PYTHON="$VENV/bin/python"

print_env() {
  printf 'export PATH="%s:%s:$PATH"\n' "$BIN_DIR" "$VENV/bin"
  printf 'export MEDIA_TOOLS_PREFIX="%s"\n' "$PREFIX"
  printf 'export VOSK_MODEL_DIR="%s/models/%s"\n' "$PREFIX" "$VOSK_MODEL_NAME"
  printf 'export AUDIOSET_MODEL="%s"\n' "$AUDIOSET_MODEL"
}

have_ffmpeg() {
  [[ -x "$PREFIX/ffmpeg/ffmpeg" && -x "$PREFIX/ffmpeg/ffprobe" ]]
}

have_python_stack() {
  [[ -x "$PYTHON" ]] || return 1
  "$PYTHON" - <<'PY' >/dev/null 2>&1
import numpy, soundfile, vosk, torch, transformers
PY
}

have_models() {
  [[ -d "$PREFIX/models/$VOSK_MODEL_NAME" ]] || return 1
  "$PYTHON" - <<PY >/dev/null 2>&1
from transformers import AutoConfig
AutoConfig.from_pretrained("$AUDIOSET_MODEL")
PY
}

check() {
  local status=0

  if have_ffmpeg; then
    printf 'PASS ffmpeg %s\n' "$("$PREFIX/ffmpeg/ffmpeg" -version 2>/dev/null | head -1 | cut -d' ' -f3)"
    printf 'PASS ffprobe %s\n' "$("$PREFIX/ffmpeg/ffprobe" -version 2>/dev/null | head -1 | cut -d' ' -f3)"
  else
    echo 'FAIL ffmpeg/ffprobe are not provisioned' >&2
    status=1
  fi

  if have_python_stack; then
    printf 'PASS python audio stack (%s)\n' "$("$PYTHON" -c 'import torch, transformers; print("torch", torch.__version__, "transformers", transformers.__version__)')"
  else
    echo 'FAIL python audio stack (vosk, soundfile, numpy, torch, transformers) is incomplete' >&2
    status=1
  fi

  if have_models; then
    echo "PASS speech model $PREFIX/models/$VOSK_MODEL_NAME"
    echo "PASS audio-event model $AUDIOSET_MODEL"
  else
    echo 'FAIL speech or audio-event model is missing' >&2
    status=1
  fi

  if [[ -x "$ROOT_DIR/scripts/setup-chromium-libs.sh" ]]; then
    if "$ROOT_DIR/scripts/setup-chromium-libs.sh" --check >/dev/null 2>&1; then
      echo 'PASS Chromium runtime libraries (reused from scripts/setup-chromium-libs.sh)'
    else
      echo 'WARN Chromium libraries are not provisioned; run scripts/setup-chromium-libs.sh'
    fi
  fi

  if [[ $status -eq 0 ]]; then
    printf 'PASS media inspection stack ready (%s)\n' "$(du -sh "$PREFIX" 2>/dev/null | cut -f1)"
  fi
  return "$status"
}

case "${1:-}" in
  --env)
    print_env
    exit 0
    ;;
  --check)
    check
    exit $?
    ;;
  "")
    ;;
  *)
    echo "Unknown argument: $1" >&2
    exit 2
    ;;
esac

command -v python3 >/dev/null || { echo 'python3 is required' >&2; exit 1; }
command -v curl >/dev/null || { echo 'curl is required' >&2; exit 1; }

mkdir -p "$PREFIX" "$PREFIX/models" "$BIN_DIR"

if have_ffmpeg; then
  echo "==> FFmpeg already provisioned in $PREFIX/ffmpeg"
else
  echo "==> Downloading FFmpeg static build"
  tmpdir="$(mktemp -d)"
  trap 'rm -rf "$tmpdir"' EXIT
  curl -sSL --fail --max-time 600 -o "$tmpdir/ffmpeg.tar.xz" "$FFMPEG_URL"
  tar -xJf "$tmpdir/ffmpeg.tar.xz" -C "$tmpdir"
  src="$(find "$tmpdir" -maxdepth 1 -type d -name 'ffmpeg-*-static' | head -1)"
  [[ -n "$src" ]] || { echo 'FFmpeg archive layout was not recognised' >&2; exit 1; }
  mkdir -p "$PREFIX/ffmpeg"
  cp "$src/ffmpeg" "$src/ffprobe" "$PREFIX/ffmpeg/"
  [[ -f "$src/README.txt" ]] && cp "$src/README.txt" "$PREFIX/ffmpeg/"
  trap - EXIT
fi

ln -sf "$PREFIX/ffmpeg/ffmpeg" "$BIN_DIR/ffmpeg"
ln -sf "$PREFIX/ffmpeg/ffprobe" "$BIN_DIR/ffprobe"

if have_python_stack; then
  echo "==> Python audio stack already provisioned in $VENV"
else
  echo "==> Creating the private Python environment in $VENV"
  [[ -x "$PYTHON" ]] || python3 -m venv "$VENV"
  "$VENV/bin/pip" install --quiet --upgrade pip
  echo "==> Installing speech and audio-event tooling (this downloads PyTorch, CPU build)"
  "$VENV/bin/pip" install --quiet vosk soundfile numpy
  "$VENV/bin/pip" install --quiet --index-url https://download.pytorch.org/whl/cpu torch
  "$VENV/bin/pip" install --quiet transformers
fi

if [[ -d "$PREFIX/models/$VOSK_MODEL_NAME" ]]; then
  echo "==> Speech model already present"
else
  echo "==> Downloading the Vosk speech model"
  tmpzip="$(mktemp -d)/model.zip"
  curl -sSL --fail --max-time 600 -o "$tmpzip" "$VOSK_MODEL_URL"
  (cd "$PREFIX/models" && unzip -q -o "$tmpzip")
fi

echo "==> Warming the audio-event model cache (first run downloads it)"
"$PYTHON" - <<PY
from transformers import AutoFeatureExtractor, AutoModelForAudioClassification
name = "$AUDIOSET_MODEL"
AutoFeatureExtractor.from_pretrained(name)
AutoModelForAudioClassification.from_pretrained(name)
PY

echo
check
echo
echo "Environment for this shell:"
print_env
echo
echo "Inspect a recording:"
echo "  $PYTHON $ROOT_DIR/scripts/inspect-media.py review <file>"
