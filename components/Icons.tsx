import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const common = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function SettingsIcon(props: IconProps) {
  return <svg {...common} {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 16 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.15.37.36.7.65.98.29.27.66.42 1.05.42h.1v4h-.1c-.39 0-.76.15-1.05.42-.29.27-.5.6-.65.98Z"/></svg>;
}

export function FilterIcon(props: IconProps) {
  return <svg {...common} {...props}><path d="M4 6h16M7 12h10M10 18h4"/></svg>;
}

export function ChevronIcon(props: IconProps) {
  return <svg {...common} {...props}><path d="m9 18 6-6-6-6"/></svg>;
}

export function ArrowLeftIcon(props: IconProps) {
  return <svg {...common} {...props}><path d="m15 18-6-6 6-6"/></svg>;
}

export function PlusIcon(props: IconProps) {
  return <svg {...common} {...props}><path d="M12 5v14M5 12h14"/></svg>;
}

export function SearchIcon(props: IconProps) {
  return <svg {...common} {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.7-3.7"/></svg>;
}
