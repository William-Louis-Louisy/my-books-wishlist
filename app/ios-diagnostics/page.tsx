"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ViewportSnapshot {
  at: string;
  reason: string;
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
  standalone: boolean;
  viewportMeta: string | null;
  htmlFontSize: string;
  bodyFontSize: string;
  textSizeAdjust: string;
  webkitTextSizeAdjust: string;
  bodyFontFamily: string;
  fontsStatus: FontFaceSetLoadStatus;
  devicePixelRatio: number;
  innerWidth: number;
  innerHeight: number;
  outerWidth: number;
  outerHeight: number;
  clientWidth: number;
  clientHeight: number;
  scrollWidth: number;
  scrollHeight: number;
  screenWidth: number;
  screenHeight: number;
  availWidth: number;
  availHeight: number;
  orientation: string | null;
  visualViewport: {
    width: number;
    height: number;
    scale: number;
    offsetLeft: number;
    offsetTop: number;
    pageLeft: number;
    pageTop: number;
  } | null;
  activeElement: {
    tag: string;
    id: string;
    type: string | null;
    fontSize: string;
    lineHeight: string;
    fontFamily: string;
    transform: string;
    zoom: string;
    rect: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  } | null;
  reference: {
    css100Width: number | null;
    interSampleWidth: number | null;
    systemSampleWidth: number | null;
  };
}

const SNAPSHOT_LIMIT = 80;

function rounded(value: number) {
  return Math.round(value * 1000) / 1000;
}

function collectSnapshot(reason: string): ViewportSnapshot {
  const htmlStyle = getComputedStyle(document.documentElement);
  const bodyStyle = getComputedStyle(document.body);
  const active =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const activeStyle = active ? getComputedStyle(active) : null;
  const activeRect = active?.getBoundingClientRect();
  const viewport = window.visualViewport;
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };
  const css100 = document.getElementById("diagnostic-css-100");
  const interSample = document.getElementById("diagnostic-inter-sample");
  const systemSample = document.getElementById("diagnostic-system-sample");

  return {
    at: new Date().toISOString(),
    reason,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
    standalone: navigatorWithStandalone.standalone === true,
    viewportMeta:
      document
        .querySelector<HTMLMetaElement>('meta[name="viewport"]')
        ?.getAttribute("content") ?? null,
    htmlFontSize: htmlStyle.fontSize,
    bodyFontSize: bodyStyle.fontSize,
    textSizeAdjust: htmlStyle.getPropertyValue("text-size-adjust") || "(empty)",
    webkitTextSizeAdjust:
      htmlStyle.getPropertyValue("-webkit-text-size-adjust") || "(empty)",
    bodyFontFamily: bodyStyle.fontFamily,
    fontsStatus: document.fonts.status,
    devicePixelRatio: window.devicePixelRatio,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight,
    clientWidth: document.documentElement.clientWidth,
    clientHeight: document.documentElement.clientHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    availWidth: window.screen.availWidth,
    availHeight: window.screen.availHeight,
    orientation: window.screen.orientation?.type ?? null,
    visualViewport: viewport
      ? {
          width: rounded(viewport.width),
          height: rounded(viewport.height),
          scale: rounded(viewport.scale),
          offsetLeft: rounded(viewport.offsetLeft),
          offsetTop: rounded(viewport.offsetTop),
          pageLeft: rounded(viewport.pageLeft),
          pageTop: rounded(viewport.pageTop),
        }
      : null,
    activeElement:
      active && activeStyle && activeRect
        ? {
            tag: active.tagName.toLowerCase(),
            id: active.id,
            type:
              active instanceof HTMLInputElement ? active.type : null,
            fontSize: activeStyle.fontSize,
            lineHeight: activeStyle.lineHeight,
            fontFamily: activeStyle.fontFamily,
            transform: activeStyle.transform,
            zoom: activeStyle.getPropertyValue("zoom") || "normal",
            rect: {
              x: rounded(activeRect.x),
              y: rounded(activeRect.y),
              width: rounded(activeRect.width),
              height: rounded(activeRect.height),
            },
          }
        : null,
    reference: {
      css100Width: css100 ? rounded(css100.getBoundingClientRect().width) : null,
      interSampleWidth: interSample
        ? rounded(interSample.getBoundingClientRect().width)
        : null,
      systemSampleWidth: systemSample
        ? rounded(systemSample.getBoundingClientRect().width)
        : null,
    },
  };
}

export default function IOSDiagnosticsPage() {
  const [snapshots, setSnapshots] = useState<ViewportSnapshot[]>([]);
  const [copyState, setCopyState] = useState("Copier le rapport");
  const programmaticInputRef = useRef<HTMLInputElement>(null);
  const timersRef = useRef<number[]>([]);

  const capture = useCallback((reason: string) => {
    setSnapshots((current) => [
      collectSnapshot(reason),
      ...current,
    ].slice(0, SNAPSHOT_LIMIT));
  }, []);

  const captureBurst = useCallback(
    (reason: string) => {
      [0, 80, 250, 600].forEach((delay) => {
        const timer = window.setTimeout(
          () => capture(`${reason} +${delay}ms`),
          delay,
        );
        timersRef.current.push(timer);
      });
    },
    [capture],
  );

  useEffect(() => {
    capture("mount");

    void document.fonts.ready.then(() => capture("fonts-ready"));

    const onFocusIn = () => captureBurst("focusin");
    const onFocusOut = () => captureBurst("focusout");
    const onWindowResize = () => capture("window-resize");
    const onOrientationChange = () => captureBurst("orientationchange");
    const onVisualResize = () => capture("visualViewport-resize");
    const onVisualScroll = () => capture("visualViewport-scroll");

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    window.addEventListener("resize", onWindowResize);
    window.addEventListener("orientationchange", onOrientationChange);
    window.visualViewport?.addEventListener("resize", onVisualResize);
    window.visualViewport?.addEventListener("scroll", onVisualScroll);

    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("resize", onWindowResize);
      window.removeEventListener("orientationchange", onOrientationChange);
      window.visualViewport?.removeEventListener("resize", onVisualResize);
      window.visualViewport?.removeEventListener("scroll", onVisualScroll);
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, [capture, captureBurst]);

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
      setCopyState("Copié");
      window.setTimeout(() => setCopyState("Copier le rapport"), 1200);
    } catch {
      setCopyState("Échec de copie");
    }
  };

  const latest = snapshots[0];

  return (
    <main className="mx-auto max-w-app px-page py-6 text-ink">
      <div className="rounded-card border border-brass bg-surface-muted p-4">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-brass">
          Diagnostic temporaire iOS/WebKit
        </p>
        <h1 className="mt-2 font-display text-2xl font-medium">
          Viewport, police et focus
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          Cette page ne corrige rien. Elle mesure ce que Safari/WebKit fait réellement
          avant, pendant et après le focus.
        </p>
        <p className="mt-2 font-mono text-xs text-ink-muted">
          Branche: debug/ios-webkit-viewport
        </p>
      </div>

      <section className="mt-6">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => capture("manual")}
            className="rounded-lg border border-line px-3 py-2 text-sm"
          >
            Prendre un snapshot
          </button>
          <button
            type="button"
            onClick={() => void copyReport()}
            className="rounded-lg border border-line px-3 py-2 text-sm"
          >
            {copyState}
          </button>
          <button
            type="button"
            onClick={() => setSnapshots([])}
            className="rounded-lg border border-line px-3 py-2 text-sm"
          >
            Effacer le journal
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-card border border-line p-4">
        <h2 className="font-display text-lg font-medium">État courant</h2>
        {latest ? (
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-xs leading-5">
            <dt>reason</dt><dd className="min-w-0 break-all">{latest.reason}</dd>
            <dt>standalone</dt><dd>{String(latest.standalone)}</dd>
            <dt>html font</dt><dd>{latest.htmlFontSize}</dd>
            <dt>body font</dt><dd>{latest.bodyFontSize}</dd>
            <dt>text adjust</dt><dd>{latest.textSizeAdjust}</dd>
            <dt>-webkit adjust</dt><dd>{latest.webkitTextSizeAdjust}</dd>
            <dt>inner</dt><dd>{latest.innerWidth} × {latest.innerHeight}</dd>
            <dt>client</dt><dd>{latest.clientWidth} × {latest.clientHeight}</dd>
            <dt>scroll width</dt><dd>{latest.scrollWidth}</dd>
            <dt>DPR</dt><dd>{latest.devicePixelRatio}</dd>
            <dt>VV scale</dt><dd>{latest.visualViewport?.scale ?? "n/a"}</dd>
            <dt>VV size</dt><dd>{latest.visualViewport ? `${latest.visualViewport.width} × ${latest.visualViewport.height}` : "n/a"}</dd>
            <dt>active</dt><dd className="min-w-0 break-all">{latest.activeElement ? `${latest.activeElement.tag}#${latest.activeElement.id || "(no-id)"}` : "none"}</dd>
            <dt>active font</dt><dd>{latest.activeElement?.fontSize ?? "n/a"}</dd>
          </dl>
        ) : null}
      </section>

      <section className="mt-6 rounded-card border border-line p-4">
        <h2 className="font-display text-lg font-medium">Références de taille</h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          La barre ci-dessous fait exactement 100 CSS px. Les deux textes font
          exactement 16 CSS px mais utilisent des familles différentes.
        </p>
        <div id="diagnostic-css-100" className="mt-4 h-3 w-[100px] bg-brass" />
        <p
          id="diagnostic-inter-sample"
          className="mt-4 inline-block"
          style={{ fontSize: "16px", fontFamily: "var(--font-inter), sans-serif" }}
        >
          My Books Wishlist — 16px Inter
        </p>
        <br />
        <p
          id="diagnostic-system-sample"
          className="mt-2 inline-block"
          style={{
            fontSize: "16px",
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          My Books Wishlist — 16px system
        </p>
      </section>

      <section className="mt-6 rounded-card border border-line p-4">
        <h2 className="font-display text-lg font-medium">Tests de focus manuel</h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          Reviens au zoom normal avant chaque essai, puis touche un seul champ.
          Le journal capture 0, 80, 250 et 600 ms après le focus.
        </p>
        <div className="mt-4 space-y-5">
          <label className="block text-sm">
            <span className="mb-1 block text-ink-muted">Input 14px explicite</span>
            <input
              id="diagnostic-input-14"
              className="w-full border border-line bg-paper px-3 py-2 outline-none focus:border-brass"
              style={{ fontSize: "14px" }}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-ink-muted">Input 16px explicite</span>
            <input
              id="diagnostic-input-16"
              ref={programmaticInputRef}
              className="w-full border border-line bg-paper px-3 py-2 outline-none focus:border-brass"
              style={{ fontSize: "16px" }}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-ink-muted">Input 1rem explicite</span>
            <input
              id="diagnostic-input-1rem"
              className="w-full border border-line bg-paper px-3 py-2 outline-none focus:border-brass"
              style={{ fontSize: "1rem" }}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-ink-muted">Input .book-form-control</span>
            <input
              id="diagnostic-input-book-form"
              className="book-form-control w-full border border-line bg-paper px-3 py-2 outline-none focus:border-brass"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-ink-muted">Textarea .book-form-control</span>
            <textarea
              id="diagnostic-textarea-book-form"
              rows={3}
              className="book-form-control w-full border border-line bg-paper px-3 py-2 outline-none focus:border-brass"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-ink-muted">Select text-base</span>
            <select
              id="diagnostic-select-base"
              className="w-full border border-line bg-paper px-3 py-2 text-base outline-none focus:border-brass"
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
            captureBurst("programmatic-focus");
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
