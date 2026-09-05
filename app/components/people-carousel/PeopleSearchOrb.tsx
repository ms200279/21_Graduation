"use client";

import { useEffect, useRef } from "react";

import {
  LANDING_INFO_LIQUID_GLASS_OPTIONS,
  useLiquidGlass,
} from "@/app/components/liquid-glass";

const SEARCH_MORPH_DURATION_MS = 520;

function SearchIcon() {
  return (
    <svg
      className="people-category-filter__search-icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="10.5"
        cy="10.5"
        r="6.25"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M15.5 15.5 20 20"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export type PeopleSearchOrbProps = {
  isOpen: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onOpen: () => void;
  onCommit: () => void;
  onClose: () => void;
};

export default function PeopleSearchOrb({
  isOpen,
  query,
  onQueryChange,
  onOpen,
  onCommit,
  onClose,
}: PeopleSearchOrbProps) {
  const glassRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef(false);

  useLiquidGlass(glassRef, {
    ...LANDING_INFO_LIQUID_GLASS_OPTIONS,
    redrawDuringSizeTransition: true,
    motionStrengthScale: 0.85,
    motionChromaticAberration: LANDING_INFO_LIQUID_GLASS_OPTIONS.chromaticAberration,
    motionSizeChangeThreshold: 4,
    sizeTransitionRestoreMs: SEARCH_MORPH_DURATION_MS + 80,
    radius: 999,
  });

  const previousQueryRef = useRef(query);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const focusFrame = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => {
      cancelAnimationFrame(focusFrame);
    };
  }, [isOpen]);

  useEffect(() => {
    const input = inputRef.current;
    const wasCleared = previousQueryRef.current !== "" && query === "";
    previousQueryRef.current = query;

    if (wasCleared && input && !isComposingRef.current) {
      input.value = "";
    }
  }, [query]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        shellRef.current &&
        !shellRef.current.contains(event.target as Node)
      ) {
        onCommit();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen, onCommit]);

  const emitQuery = (value: string) => {
    onQueryChange(value);
  };

  return (
    <div
      ref={shellRef}
      className={[
        "people-category-filter__search-morph",
        isOpen ? "people-category-filter__search-morph--open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role={isOpen ? "search" : undefined}
    >
      <div
        ref={glassRef}
        className="people-category-filter__search-glass liquid-glass-surface"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="text"
        className="people-category-filter__search-input"
        placeholder="Search people"
        defaultValue={query}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        lang="ko"
        enterKeyHint="search"
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onCompositionEnd={(event) => {
          isComposingRef.current = false;
          emitQuery(event.currentTarget.value);
        }}
        onInput={(event) => {
          if (isComposingRef.current) {
            return;
          }

          emitQuery(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onClose();
            return;
          }

          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            event.preventDefault();
            emitQuery(event.currentTarget.value);
            onCommit();
          }
        }}
        tabIndex={isOpen ? 0 : -1}
        aria-label="Search people"
        aria-hidden={!isOpen}
      />
      <span className="people-category-filter__search-icon-wrap" aria-hidden="true">
        <SearchIcon />
      </span>
      {!isOpen ? (
        <button
          type="button"
          className="people-category-filter__search-trigger"
          aria-label="Search people"
          onClick={onOpen}
        />
      ) : null}
    </div>
  );
}
