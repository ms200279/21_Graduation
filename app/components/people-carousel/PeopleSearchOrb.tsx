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
  onClose: () => void;
};

export default function PeopleSearchOrb({
  isOpen,
  query,
  onQueryChange,
  onOpen,
  onClose,
}: PeopleSearchOrbProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useLiquidGlass(shellRef, {
    ...LANDING_INFO_LIQUID_GLASS_OPTIONS,
    redrawDuringSizeTransition: true,
    motionStrengthScale: 0.85,
    motionChromaticAberration: LANDING_INFO_LIQUID_GLASS_OPTIONS.chromaticAberration,
    motionSizeChangeThreshold: 4,
    sizeTransitionRestoreMs: SEARCH_MORPH_DURATION_MS + 80,
    radius: 999,
  });

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
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        shellRef.current &&
        !shellRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen, onClose]);

  return (
    <div
      ref={shellRef}
      className={[
        "people-category-filter__search-morph",
        "liquid-glass-surface",
        isOpen ? "people-category-filter__search-morph--open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role={isOpen ? "search" : undefined}
    >
      <input
        ref={inputRef}
        type="search"
        className="people-category-filter__search-input"
        placeholder="Search people"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onClose();
          }
        }}
        tabIndex={isOpen ? 0 : -1}
        readOnly={!isOpen}
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
