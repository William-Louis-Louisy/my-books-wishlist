import { useTranslations } from "next-intl";
import type { ReleaseDatePrecision } from "@/types/book";

interface DatePrecisionProps {
  value: ReleaseDatePrecision;
  onChange: (value: ReleaseDatePrecision) => void;
}

export default function DatePrecision({ value, onChange }: DatePrecisionProps) {
  const t = useTranslations("Form");

  const precisionOptions: {
    value: ReleaseDatePrecision;
    label: string;
  }[] = [
    { value: "day", label: t("precisionDay") },
    { value: "month", label: t("precisionMonth") },
    { value: "year", label: t("precisionYear") },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={t("datePrecision")}
      className="isolate grid grid-cols-3 rounded-md shadow-xs"
    >
      {precisionOptions.map((option, index) => {
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={[
              "relative inline-flex items-center justify-center border border-line px-3 py-2 text-xs font-medium",
              "focus:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass",
              index > 0 && "-ml-px",
              index === 0 && "rounded-l-md",
              index === precisionOptions.length - 1 && "rounded-r-md",
              isSelected
                ? "z-10 bg-cloth text-paper"
                : "bg-surface-muted text-ink",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
