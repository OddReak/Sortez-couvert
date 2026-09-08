import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { selectConditions } from '@/features/weather/useWeather';
import { createHaptics, playSoundTick } from '@/shared/lib/haptics';
import { formatClock, formatDayTime, nowSeconds } from '@/shared/lib/time';
import { formatTemp } from '@/shared/lib/units';
import type { WeatherSnapshot } from '@/shared/types/domain';

import { AngleAccumulator, pointerAngle } from './angle';
import {
  followNow,
  getCursorEpoch,
  isFollowingNow,
  setCursorEpoch,
  setScrubbing,
  subscribeFast,
} from './cursor';
import {
  RANGE_FUTURE_SECONDS,
  RANGE_PAST_SECONDS,
  angleToSeconds,
  clampEpoch,
  graduations,
  secondsToAngle,
} from './geometry';
import { pulseGraduation } from './haptic-pulse';
import { approach, decayVelocity, snapTarget } from './physics';
import { useCursorEpoch } from './useCursor';

const RING_R = 120;
const HIT_WIDTH = 60; // > 44 pt (brief §8.1)
const RAD_TO_DEG = 180 / Math.PI;

export function TimeRing({
  snapshot,
  soundTick,
}: {
  snapshot: WeatherSnapshot;
  soundTick: boolean;
}) {
  const haptics = useMemo(() => createHaptics(), []);
  // « Maintenant » de référence, capté au montage (dérive négligeable sur une
  // session ; `followNow()` recale sur l'instant réel).
  const nowEpoch = useMemo(() => nowSeconds(), []);
  const tz = snapshot.place.timezone;

  const svgRef = useRef<SVGSVGElement>(null);
  const rotorRef = useRef<SVGGElement>(null);
  const acc = useRef(new AngleAccumulator());
  const rafId = useRef<number | null>(null);
  const drag = useRef({
    active: false,
    pointerId: -1,
    startEpoch: nowEpoch,
    velocity: 0,
    lastMoveMs: 0,
    lastTapMs: 0,
  });
  const lastHour = useRef(Math.round(getCursorEpoch() / 3600));
  const windowCenter = useRef(getCursorEpoch());

  const [windowVersion, setWindowVersion] = useState(0);
  const [announce, setAnnounce] = useState('');
  const announceTimer = useRef<number | null>(null);

  const ariaEpoch = useCursorEpoch();

  const grads = useMemo(
    () => graduations(windowCenter.current, nowEpoch, 7),
    // regénéré via windowVersion (rare)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [windowVersion, nowEpoch],
  );

  const scheduleAnnounce = useCallback(() => {
    if (announceTimer.current !== null) {
      window.clearTimeout(announceTimer.current);
    }
    announceTimer.current = window.setTimeout(() => {
      const epoch = getCursorEpoch();
      const c = selectConditions(
        snapshot,
        isFollowingNow() ? null : epoch,
        nowSeconds(),
      );
      const when = isFollowingNow()
        ? formatClock(epoch, tz)
        : formatDayTime(epoch, tz);
      setAnnounce(
        `${when}, ${formatTemp(c.step.temp)}, ${c.step.phrase ?? ''}`.trim(),
      );
    }, 500);
  }, [snapshot, tz]);

  const syncRotor = useCallback(() => {
    const epoch = getCursorEpoch();

    if (Math.abs(epoch - windowCenter.current) > 3.5 * 3600) {
      windowCenter.current = Math.round(epoch / 3600) * 3600;
      setWindowVersion((v) => v + 1);
    }

    const deg = -secondsToAngle(epoch - windowCenter.current) * RAD_TO_DEG;
    rotorRef.current?.setAttribute('transform', `rotate(${deg.toFixed(3)})`);

    const hour = Math.round(epoch / 3600);
    if (hour !== lastHour.current) {
      lastHour.current = hour;
      haptics.tick();
      if (soundTick) playSoundTick();
      pulseGraduation(
        rotorRef.current?.querySelector<SVGElement>(
          `[data-hour="${String(hour)}"]`,
        ) ?? null,
      );
    }
  }, [haptics, soundTick]);

  const stopLoop = useCallback(() => {
    if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    rafId.current = null;
  }, []);

  const settle = useCallback(
    (target: number) => {
      if (target === nowEpoch) followNow();
      else setCursorEpoch(target, false);
      setScrubbing(false);
      scheduleAnnounce();
    },
    [nowEpoch, scheduleAnnounce],
  );

  const loop = useCallback(() => {
    const d = drag.current;
    let keepGoing = false;

    if (!d.active) {
      if (d.velocity !== 0) {
        d.velocity = decayVelocity(d.velocity);
        const from = getCursorEpoch();
        const next = clampEpoch(from + d.velocity, nowEpoch);
        if (next === from) d.velocity = 0;
        setCursorEpoch(next, true);
        keepGoing = d.velocity !== 0;
        if (!keepGoing) {
          const t = snapTarget(next, nowEpoch);
          if (t === next) settle(t);
          else keepGoing = true;
        }
      } else {
        const epoch = getCursorEpoch();
        const target = snapTarget(epoch, nowEpoch);
        if (epoch === target) {
          settle(target);
        } else {
          const next = approach(epoch, target, 0.22);
          setCursorEpoch(next, next !== target);
          if (next === target) settle(target);
          else keepGoing = true;
        }
      }
    }

    syncRotor();

    if (keepGoing || d.active) {
      rafId.current = requestAnimationFrame(loop);
    } else {
      stopLoop();
    }
  }, [nowEpoch, settle, syncRotor, stopLoop]);

  const startLoop = useCallback(() => {
    rafId.current ??= requestAnimationFrame(loop);
  }, [loop]);

  useEffect(() => {
    const unsub = subscribeFast(startLoop);
    syncRotor();
    return () => {
      unsub();
      stopLoop();
      if (announceTimer.current !== null) {
        window.clearTimeout(announceTimer.current);
      }
    };
  }, [startLoop, syncRotor, stopLoop]);

  // ── Gestes — Pointer Events uniquement (brief §8.2) ──────────────────────
  const center = (): { cx: number; cy: number } => {
    const rect = svgRef.current?.getBoundingClientRect();
    return rect
      ? { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 }
      : { cx: 0, cy: 0 };
  };

  const onPointerDown = (e: React.PointerEvent<SVGCircleElement>): void => {
    const d = drag.current;
    const t = performance.now();

    if (t - d.lastTapMs < 280) {
      d.lastTapMs = 0;
      d.active = false;
      d.velocity = 0;
      followNow();
      startLoop();
      scheduleAnnounce();
      return;
    }
    d.lastTapMs = t;

    e.currentTarget.setPointerCapture(e.pointerId);
    const { cx, cy } = center();
    d.active = true;
    d.pointerId = e.pointerId;
    d.velocity = 0;
    d.startEpoch = getCursorEpoch();
    d.lastMoveMs = t;
    acc.current.reset(pointerAngle(e.clientX, e.clientY, cx, cy));
    setScrubbing(true);
    startLoop();
  };

  const onPointerMove = (e: React.PointerEvent<SVGCircleElement>): void => {
    const d = drag.current;
    if (!d.active || e.pointerId !== d.pointerId) return;

    const { cx, cy } = center();
    const deltaRad = acc.current.push(
      pointerAngle(e.clientX, e.clientY, cx, cy),
    );
    const deltaSec = angleToSeconds(deltaRad);

    const t = performance.now();
    const dt = Math.max(1, t - d.lastMoveMs);
    d.lastMoveMs = t;
    d.velocity = d.velocity * 0.7 + (deltaSec / dt) * 16.67 * 0.3;

    setCursorEpoch(
      clampEpoch(d.startEpoch + angleToSeconds(acc.current.total), nowEpoch),
      true,
    );
  };

  const endDrag = (e: React.PointerEvent<SVGCircleElement>): void => {
    const d = drag.current;
    if (e.pointerId !== d.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* déjà relâché */
    }
    d.active = false;
    if (Math.abs(d.velocity) < 60) d.velocity = 0;
    startLoop();
    scheduleAnnounce();
  };

  // ── Clavier (brief §8.6) ────────────────────────────────────────────────
  const onKeyDown = (e: React.KeyboardEvent): void => {
    const step = e.shiftKey ? 6 * 3600 : 3600;
    const cur = getCursorEpoch();
    let handled = true;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        setCursorEpoch(clampEpoch(cur + step, nowEpoch), false);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        setCursorEpoch(clampEpoch(cur - step, nowEpoch), false);
        break;
      case 'PageUp':
        setCursorEpoch(clampEpoch(cur + 24 * 3600, nowEpoch), false);
        break;
      case 'PageDown':
        setCursorEpoch(clampEpoch(cur - 24 * 3600, nowEpoch), false);
        break;
      case 'Home':
        followNow();
        break;
      default:
        handled = false;
    }
    if (handled) {
      e.preventDefault();
      startLoop();
      scheduleAnnounce();
    }
  };

  return (
    <svg
      ref={svgRef}
      viewBox="-150 -150 300 300"
      className="pointer-events-none absolute inset-0 h-full w-full touch-none"
    >
      <defs>
        <clipPath id="terra-ring-clip">
          <circle cx="0" cy="0" r={RING_R + 22} />
        </clipPath>
      </defs>

      <circle
        cx="0"
        cy="0"
        r={RING_R}
        fill="none"
        stroke="var(--app-hairline)"
        strokeWidth="1.5"
      />
      <path
        d={`M -7 ${-RING_R - 11} L 7 ${-RING_R - 11} L 0 ${-RING_R - 2} Z`}
        fill="var(--app-live)"
      />

      <g ref={rotorRef} clipPath="url(#terra-ring-clip)">
        {grads.map((g) => {
          const inner = RING_R - (g.major ? 12 : 6);
          const sin = Math.sin(g.angle);
          const cos = Math.cos(g.angle);
          return (
            <line
              key={g.epoch}
              data-hour={Math.round(g.epoch / 3600)}
              x1={sin * RING_R}
              y1={-cos * RING_R}
              x2={sin * inner}
              y2={-cos * inner}
              stroke="var(--app-ink-faint)"
              strokeWidth={g.major ? 2 : 1}
              strokeLinecap="round"
            />
          );
        })}

        {/* Repère « maintenant » — orbite avec le rotor (brief §8.1). */}
        {(() => {
          const a = secondsToAngle(nowEpoch - windowCenter.current);
          const sin = Math.sin(a);
          const cos = Math.cos(a);
          return (
            <>
              <line
                x1={sin * (RING_R + 6)}
                y1={-cos * (RING_R + 6)}
                x2={sin * (RING_R - 14)}
                y2={-cos * (RING_R - 14)}
                stroke="var(--app-live)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle
                cx={sin * (RING_R + 10)}
                cy={-cos * (RING_R + 10)}
                r="3"
                fill="var(--app-live)"
              />
            </>
          );
        })()}
      </g>

      <circle
        cx="0"
        cy="0"
        r={RING_R}
        fill="none"
        stroke="transparent"
        strokeWidth={HIT_WIDTH}
        style={{ pointerEvents: 'stroke', cursor: 'grab' }}
        role="slider"
        tabIndex={0}
        aria-label="Heure affichée — tournez la bague ou utilisez les flèches"
        aria-valuemin={nowEpoch - RANGE_PAST_SECONDS}
        aria-valuemax={nowEpoch + RANGE_FUTURE_SECONDS}
        aria-valuenow={Math.round(ariaEpoch)}
        aria-valuetext={announce || formatDayTime(ariaEpoch, tz)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
      />

      <foreignObject x="-150" y="-150" width="1" height="1">
        <span aria-live="polite" className="sr-only">
          {announce}
        </span>
      </foreignObject>
    </svg>
  );
}
