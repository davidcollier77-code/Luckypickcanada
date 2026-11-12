'use client';

import { useState } from 'react';
import {
  buildPreviewUrl,
  getPreviewPresets,
  isPreviewEnabled,
} from '../lib/crystal-ball-preview';
import { getLocalMoment } from '../lib/local-time';

const PANEL_STYLE = {
  position: 'fixed',
  left: 'clamp(12px, 3vw, 24px)',
  bottom: 'clamp(12px, 3vw, 24px)',
  zIndex: 80,
  width: 'min(360px, calc(100vw - 24px))',
  maxHeight: 'min(82vh, 640px)',
  overflow: 'auto',
  padding: '12px 14px',
  border: '1px solid rgba(212, 175, 55, 0.7)',
  borderRadius: '14px',
  background: 'rgba(10, 17, 33, 0.97)',
  color: '#f8fafc',
  boxShadow: '0 18px 50px rgba(0, 0, 0, 0.5)',
  fontFamily: 'inherit',
  fontSize: '13px',
  lineHeight: 1.45,
};

const INPUT_STYLE = {
  width: '100%',
  marginTop: '2px',
  padding: '6px 8px',
  border: '1px solid rgba(148, 163, 184, 0.55)',
  borderRadius: '8px',
  background: '#0b1220',
  color: '#f8fafc',
  font: 'inherit',
};

const BUTTON_STYLE = {
  padding: '6px 10px',
  border: '1px solid rgba(212, 175, 55, 0.75)',
  borderRadius: '8px',
  background: 'rgba(212, 175, 55, 0.16)',
  color: '#fef3c7',
  font: 'inherit',
  cursor: 'pointer',
};

const QUIET_BUTTON_STYLE = {
  ...BUTTON_STYLE,
  borderColor: 'rgba(148, 163, 184, 0.5)',
  background: 'rgba(148, 163, 184, 0.12)',
  color: '#e2e8f0',
};

const LABEL_STYLE = {
  display: 'block',
  marginTop: '10px',
  color: '#cbd5e1',
  fontSize: '12px',
  fontWeight: 600,
};

const QUICK_TIMES = [
  { label: 'Morning 08:00', time: '08:00' },
  { label: 'Afternoon 15:00', time: '15:00' },
  { label: 'Evening 20:00', time: '20:00' },
  { label: 'Late night 23:30', time: '23:30' },
];

/**
 * Development-only controls for the Crystal Ball date preview. The component
 * only ever renders on the preview route; production builds return 404 there.
 */
export default function CrystalBallPreviewControls({ preview }) {
  if (!isPreviewEnabled() || !preview?.active) return null;

  return <PreviewControls preview={preview} />;
}

function PreviewControls({ preview }) {
  const realMoment = getLocalMoment();
  const [dateKey, setDateKey] = useState(preview.localDate);
  const [time, setTime] = useState(preview.localTime);
  const presets = getPreviewPresets(Number(dateKey.slice(0, 4)) || realMoment.year);
  const groups = [...new Set(presets.map((preset) => preset.group))];

  const go = (nextDate = dateKey, nextTime = time) => {
    window.location.assign(buildPreviewUrl(nextDate, nextTime));
  };

  return (
    <details open style={PANEL_STYLE}>
      <summary
        style={{
          cursor: 'pointer',
          color: '#fcd34d',
          fontSize: '12px',
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        Dev · Date preview
      </summary>

      <p style={{ margin: '8px 0 0', color: '#cbd5e1' }}>
        Preview any local date without changing the system clock. The daily allowance is bypassed.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          go();
        }}
      >
        <label style={LABEL_STYLE} htmlFor="crystal-preview-date">
          Local date
        </label>
        <input
          id="crystal-preview-date"
          type="date"
          min="2000-01-01"
          max="2100-12-31"
          value={dateKey}
          onChange={(event) => setDateKey(event.target.value)}
          style={INPUT_STYLE}
        />

        <label style={LABEL_STYLE} htmlFor="crystal-preview-time">
          Local time
        </label>
        <input
          id="crystal-preview-time"
          type="time"
          step="60"
          value={time}
          onChange={(event) => setTime(event.target.value)}
          style={INPUT_STYLE}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
          <button type="submit" style={BUTTON_STYLE} disabled={!dateKey}>
            Preview date
          </button>
          <button
            type="button"
            style={QUIET_BUTTON_STYLE}
            onClick={() => go(realMoment.dateKey, realMoment.localTime)}
          >
            Use today
          </button>
          <button
            type="button"
            style={QUIET_BUTTON_STYLE}
            onClick={() => window.location.reload()}
          >
            Reset reading
          </button>
        </div>
      </form>

      <label style={LABEL_STYLE} htmlFor="crystal-preview-preset">
        Jump to an occasion
      </label>
      <select
        id="crystal-preview-preset"
        value=""
        onChange={(event) => {
          if (event.target.value) go(event.target.value, time);
        }}
        style={INPUT_STYLE}
      >
        <option value="">Choose an occasion…</option>
        {groups.map((group) => (
          <optgroup key={group} label={group}>
            {presets
              .filter((preset) => preset.group === group)
              .map((preset) => (
                <option key={`${preset.id}-${preset.dateKey}`} value={preset.dateKey}>
                  {preset.label} — {preset.dateKey}
                </option>
              ))}
          </optgroup>
        ))}
      </select>

      <div style={{ marginTop: '10px' }}>
        <span style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: 600 }}>Time of day</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
          {QUICK_TIMES.map((quick) => (
            <button
              key={quick.time}
              type="button"
              style={QUIET_BUTTON_STYLE}
              onClick={() => go(dateKey, quick.time)}
            >
              {quick.label}
            </button>
          ))}
        </div>
      </div>

      <div
        aria-live="polite"
        style={{
          marginTop: '12px',
          paddingTop: '10px',
          borderTop: '1px solid rgba(148, 163, 184, 0.3)',
          color: '#e2e8f0',
          fontSize: '12px',
        }}
      >
        <strong style={{ color: '#fcd34d' }}>Previewing</strong> {preview.weekday},{' '}
        {preview.localDate} at {preview.localTime} ({preview.timeZone})
        <br />
        <span style={{ color: '#94a3b8' }}>
          Real clock: {realMoment.weekday}, {realMoment.dateKey} at {realMoment.localTime}
        </span>
      </div>
    </details>
  );
}
