"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";

interface AutocompleteInputProps {
  id: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  className: string;
  invalid?: boolean;
  autoFocus?: boolean;
}

const MAX_SUGGESTIONS = 8;

export function AutocompleteInput({
  id,
  value,
  options,
  onChange,
  className,
  invalid = false,
  autoFocus = false,
}: AutocompleteInputProps) {
  const reactId = useId();
  const listboxId = `${id}-${reactId.replaceAll(":", "")}-suggestions`;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const suggestions = useMemo(() => {
    const query = value.trim().toLocaleLowerCase();
    const matches = query
      ? options.filter((option) => option.toLocaleLowerCase().includes(query))
      : options;

    return matches
      .filter((option) => option.toLocaleLowerCase() !== query)
      .slice(0, MAX_SUGGESTIONS);
  }, [options, value]);

  const showSuggestions = open && suggestions.length > 0;

  const selectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    if (!showSuggestions) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="relative">
      <input
        id={id}
        name={`book-${id}`}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        className={className}
        aria-invalid={invalid}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={showSuggestions}
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
        role="combobox"
        autoFocus={autoFocus}
        autoComplete="new-password"
        inputMode="text"
      />

      {showSuggestions ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-52 overflow-y-auto rounded-card border border-line bg-paper py-1"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              id={`${listboxId}-${index}`}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectSuggestion(suggestion)}
              className={`block w-full px-3 py-2 text-left text-sm text-ink focus:outline-none ${
                index === activeIndex ? "bg-surface-muted" : "hover:bg-surface-muted"
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
