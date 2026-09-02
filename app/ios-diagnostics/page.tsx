"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Snapshot {
  at: string;
  reason: string;
  userAgent: string;
  standalone: boolean;
  viewportMeta: string | null;
  htmlFontSize: string;
  bodyFontSize: string;
  textSizeAdjust: string;
  webkitTextSizeAdjust: string;
  devicePixelRatio: number;
  innerWidth: number;
  innerHeight: number;
  clientWidth: number;
  clientHeight: number;
  scrollWidth: number;
  visualViewport: {
    width: number;
    height: number;
    scale: number;
    offsetLeft: number;
    offsetTop: number;
  } | null;
  activeElement: {
    tag: string;
    id: string;
    type: string | null;
    fontSize: string;
    lineHeight: string;
    fontFamily: string;
    rect: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  } | null;
}

const SNAPSHOT_LIMIT = 80;

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}

function readSnapshot(reason: string): Snapshot {
  const htmlStyle = getComputedStyle(document.documentElement);
  const bodyStyle = getComputedStyle(document.body);
  const active =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const activeStyle = active ? getComputedStyle(active) : null;
  const activeRect = active?.getBoundingClientRect();
  const visualViewport = window.visualViewport;
  const iosNavigator = navigator as Navigator & { standalone?: boolean };

  return {
    at: new Date().toISOString(),
    reason,
    userAgent: navigator.userAgent,
    standalone: iosNavigator.standalone === true,
    viewportMeta:
      document
        .querySelector<HTMLMetaElement>('meta[name="viewport"]')
        ?.getAttribute("content") ?? null,
    htmlFontSize: htmlStyle.fontSize,
    bodyFontSize: bodyStyle.fontSize,
    textSizeAdjust: htmlStyle.getPropertyValue("text-size-adjust") || "(empty)",
    webkitTextSizeAdjust:
      htmlStyle.getPropertyValue("-webkit-text-size-adjust") || "(empty)",
    devicePixelRatio: window.devicePixelRatio,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    clientWidth: document.documentElement.clientWidth,
    clientHeight: document.documentElement.clientHeight,
    scrollWidth: document.documentElement.scrollWidth,
    visualViewport: visualViewport
      ? {
          width: round(visualViewport.width),
          height: round(visualViewport.height),
          scale: round(visualViewport.scale),
          offsetLeft: round(visualViewport.offsetLeft),
          offsetTop: round(visualViewport.offsetTop),
        }
      : null,
    activeElement:
      active && activeStyle && activeRect
        ? {
            tag: active.tagName.toLowerCase(),
            id: active.id,
            type: active instanceof HTMLInputElement ? active.type : null,
            fontSize: activeStyle.fontSize,
            lineHeight: activeStyle.lineHeight,
            fontFamily: activeStyle.fontFamily,
            rect: {
              x: round(activeRect.x),
              y: round(activeRect.y),
              width: round(activeRect.width),
              height: round(activeRect.height),
            },
          }
        : null,
  };
}

export default function IOSDiagnosticsPage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [copyLabel, setCopyLabel] = useState("Copier le rapport");
  const programmaticInputRef = useRef<HTMLInputElement>(null);
  const timersRef = useRef<number[]>([]);

  const record = useCallback((reason: string) => {
    setSnapshots((current) => [readSnapshot(reason), ...current].slice(0, SNAPSHOT_LIMIT));
  }, []);

  const recordBurst = useCallback(
    (reason: string) => {
      [0, 80, 250, 600].forEach((delay) => {
        const timer = window.setTimeout(
          () => record(`${reason} +${delay}ms`),
          delay,
        );
        timersRef.current.push(timer);
      });
    },
    [record],
  );

  useEffect(() => {
    const timers = timersRef.current;
    const mountTimer = window.setTimeout(() => record("mount"), 0);
    timers.push(mountTimer);

    void document.fonts.ready.then(() => {
      const fontsTimer = window.setTimeout(() => record("fonts-ready"), 0);
      timers.push(fontsTimer);
    });

    const onFocusIn = () => recordBurst("focusin");
    const onFocusOut = () => recordBurst("focusout");
    const onWindowResize = () => record("window-resize");
    const onVisualResize = () => record("visualViewport-resize");
    const onVisualScroll = () => record("visualViewport-scroll");

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    window.addEventListener("resize", onWindowResize);
    window.visualViewport?.addEventListener("resize", onVisualResize);
    window.visualViewport?.addEventListener("scroll", onVisualScroll);

    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("resize", onWindowResize);
      window.visualViewport?.removeEventListener("resize", onVisualResize);
      window.visualViewport?.removeEventListener("scroll", onVisualScroll);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [record, recordBurst]);

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(
          {
            route: "/ios-diagnostics",
            generatedAt: new Date().toISOString(),
            snapshots: [...snapshots].reverse(),
          },
          null,
          2,
        ),
      );
      setCopyLabel("Copié");
      window.setTimeout(() => setCopyLabel("Copier le rapport"), 1200);
    } catch {
      setCopyLabel("Échec de copie");
    }
  };

  const latest = snapshots[0];
  const fieldClass =
    "w-full rounded-lg border border-line bg-paper px-3 py-2 text-ink outline-none focus:border-brass";

  return (
    <main className="mx-auto max-w-app px-page py-6 text-ink">
      <section className="rounded-card border border-brass bg-surface-muted p-4">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-brass">
          Diagnostic temporaire iOS/WebKit
        </p>
        <h1 className="mt-2 font-display text-2xl font-medium">
          Viewport, police et focus
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          Cette page ne modifie pas le comportement de l’application. Elle mesure ce
          que WebKit fait réellement au focus.
        </p>
      </section>

      <section className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => record("manual")}
          className="rounded-lg border border-line px-3 py-2 text-sm"
        >
          Prendre un snapshot
        </button>
        <button
          type="button"
          onClick={() => void copyReport()}
          className="rounded-lg border border-line px-3 py-2 text-sm"
        >
          {copyLabel}
        </button>
        <button
          type="button"
          onClick={() => setSnapshots([])}
          className="rounded-lg border border-line px-3 py-2 text-sm"
        >
          Effacer le journal
        </button>
      </section>

      <section className="mt-6 rounded-card border border-line p-4">
        <h2 className="font-display text-lg font-medium">État courant</h2>
        {latest ? (
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-xs leading-5">
            <dt>reason</dt>
            <dd>{latest.reason}</dd>
            <dt>standalone</dt>
            <dd>{String(latest.standalone)}</dd>
            <dt>html font</dt>
            <dd>{latest.htmlFontSize}</dd>
            <dt>body font</dt>
            <dd>{latest.bodyFontSize}</dd>
            <dt>text adjust</dt>
            <dd>{latest.textSizeAdjust}</dd>
            <dt>-webkit adjust</dt>
            <dd>{latest.webkitTextSizeAdjust}</dd>
            <dt>inner</dt>
            <dd>{latest.innerWidth} × {latest.innerHeight}</dd>
            <dt>client</dt>
            <dd>{latest.clientWidth} × {latest.clientHeight}</dd>
            <dt>scroll width</dt>
            <dd>{latest.scrollWidth}</dd>
            <dt>DPR</dt>
            <dd>{latest.devicePixelRatio}</dd>
            <dt>VV scale</dt>
            <dd>{latest.visualViewport?.scale ?? "n/a"}</dd>
            <dt>VV size</dt>
            <dd>
              {latest.visualViewport
                ? `${latest.visualViewport.width} × ${latest.visualViewport.height}`
                : "n/a"}
            </dd>
            <dt>active</dt>
            <dd>
              {latest.activeElement
                ? `${latest.activeElement.tag}#${latest.activeElement.id || "(no-id)"}`
                : "none"}
            </dd>
            <dt>active font</dt>
            <dd>{latest.activeElement?.fontSize ?? "n/a"}</dd>
          </dl>
        ) : null}
      </section>

      <section className="mt-6 rounded-card border border-line p-4">
        <h2 className="font-display text-lg font-medium">Tests de focus</h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          Reviens au zoom normal avant chaque essai. Le journal capture plusieurs
          instants après chaque focus.
        </p>
        <div className="mt-4 space-y-5">
          <label className="block text-sm">
            <span className="mb-1 block text-ink-muted">Input 14px explicite</span>
            <input
              id="diagnostic-input-14"
              className={fieldClass}
              style={{ fontSize: "14px" }}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-ink-muted">Input 16px explicite</span>
            <input
              id="diagnostic-input-16"
              ref={programmaticInputRef}
              className={fieldClass}
              style={{ fontSize: "16px" }}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-ink-muted">Input 1rem explicite</span>
            <input
              id="diagnostic-input-1rem"
              className={fieldClass}
              style={{ fontSize: "1rem" }}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-ink-muted">Input .book-form-control</span>
            <input
              id="diagnostic-input-book-form"
              className={`book-form-control ${fieldClass}`}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-ink-muted">Textarea .book-form-control</span>
            <textarea
              id="diagnostic-textarea-book-form"
              rows={3}
              className={`book-form-control ${fieldClass}`}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-ink-muted">Select text-base</span>
            <select
              id="diagnostic-select-base"
              className={`${fieldClass} text-base`}
              defaultValue="one"
            >
              <option value="one">Option une</option>
              <option value="two">Option deux</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={() => {
            programmaticInputRef.current?.focus();
            recordBurst("programmatic-focus");
          }}
          className="mt-5 rounded-lg border border-line px-3 py-2 text-sm"
        >
          Focuser le champ 16px par JavaScript
        </button>
      </section>

      <section className="mt-6 rounded-card border border-line p-4">
        <h2 className="font-display text-lg font-medium">Journal</h2>
        <p className="mt-2 text-sm text-ink-muted">
          {snapshots.length} snapshot(s), le plus récent en premier.
        </p>
        <div className="mt-3 max-h-[50vh] overflow-auto rounded-lg bg-surface-muted p-3">
          <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-5 text-ink">
            {JSON.stringify(snapshots.slice(0, 16), null, 2)}
          </pre>
        </div>
      </section>
    </main>
  );
}
