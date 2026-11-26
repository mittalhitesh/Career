import { useEffect, useState } from 'react';
import styles from './AsciiPrimitives.module.css';

/**
 * AsciiBox: Renders a 1px bordered container with crisp ┌ ┐ └ ┘ corner glyphs
 * positioned in the corners so they never wrap on narrow mobile viewports.
 */
export function AsciiBox({ children, className = '', title, as: Tag = 'div', ...rest }) {
  return (
    <Tag className={`${styles.box} ${className}`.trim()} {...rest}>
      <span className={`${styles.corner} ${styles.tl}`} aria-hidden="true">┌</span>
      <span className={`${styles.corner} ${styles.tr}`} aria-hidden="true">┐</span>
      <span className={`${styles.corner} ${styles.bl}`} aria-hidden="true">└</span>
      <span className={`${styles.corner} ${styles.br}`} aria-hidden="true">┘</span>
      {title && <div className={styles.boxTitle}>{title}</div>}
      <div className={styles.boxInner}>{children}</div>
    </Tag>
  );
}

/**
 * AsciiDivider: Renders `── Label ──────` cleanly across any container width.
 */
export function AsciiDivider({ label, className = '' }) {
  return (
    <div className={`${styles.divider} ${className}`.trim()} role="separator" aria-label={label || undefined}>
      <span className={styles.dividerEdge} aria-hidden="true">──</span>
      {label && <span className={styles.dividerLabel}>{label}</span>}
      <span className={styles.dividerFill} aria-hidden="true" />
    </div>
  );
}

const SPINNER_FRAMES = ['|', '/', '-', '\\'];

/**
 * AsciiSpinner: Cycles | / - \ frames with polite aria-live announcement.
 */
export function AsciiSpinner({ label = 'Thinking', className = '' }) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) return undefined;

    const timer = window.setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % SPINNER_FRAMES.length);
    }, 140);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <span className={`${styles.spinner} ${className}`.trim()} aria-live="polite">
      <span className={styles.spinnerGlyph} aria-hidden="true">
        {SPINNER_FRAMES[frameIndex]}
      </span>
      {label && <span>{label}</span>}
    </span>
  );
}

/**
 * AsciiProgressBar: Renders `[██████░░░░] 60%` with accessible role="progressbar".
 */
export function AsciiProgressBar({ value = 0, max = 100, segments = 10, label, className = '' }) {
  const safeMax = max > 0 ? max : 100;
  const clamped = Math.max(0, Math.min(value, safeMax));
  const pct = Math.round((clamped / safeMax) * 100);
  const filledCount = Math.round((clamped / safeMax) * segments);
  const emptyCount = Math.max(0, segments - filledCount);
  const bar = `[${'█'.repeat(filledCount)}${'░'.repeat(emptyCount)}] ${pct}%`;

  return (
    <div
      className={`${styles.progress} ${className}`.trim()}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `Progress ${pct}%`}
    >
      <code className={styles.progressText}>{bar}</code>
    </div>
  );
}
