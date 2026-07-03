"use client";

import { useCallback, useEffect, useState } from "react";

import PeopleSearchOrb from "./PeopleSearchOrb";

import "@/app/styles/people-category-filter.css";

export const PEOPLE_CATEGORY_OPTIONS = [
  { id: "everyone", label: "Everyone" },
  { id: "industrial-design", label: "Industrial Design" },
  { id: "media-design", label: "Media Design" },
] as const;

export type PeopleCategoryId = (typeof PEOPLE_CATEGORY_OPTIONS)[number]["id"];

export default function PeopleCategoryFilter() {
  const [activeCategory, setActiveCategory] =
    useState<PeopleCategoryId>("everyone");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery("");
  }, []);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSearch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeSearch, isSearchOpen]);

  return (
    <div className="people-category-filter" role="toolbar" aria-label="People categories">
      <div className="people-category-filter__items">
        <div
          className={[
            "people-category-filter__cluster",
            isSearchOpen ? "people-category-filter__cluster--search-open" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="people-category-filter__buttons">
            {PEOPLE_CATEGORY_OPTIONS.map((option) => {
              const isActive = activeCategory === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  className={[
                    "people-category-filter__button",
                    isActive ? "people-category-filter__button--active" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-pressed={isActive}
                  aria-hidden={isSearchOpen}
                  tabIndex={isSearchOpen ? -1 : 0}
                  onClick={() => setActiveCategory(option.id)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <PeopleSearchOrb
            isOpen={isSearchOpen}
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onOpen={() => setIsSearchOpen(true)}
            onClose={closeSearch}
          />
        </div>
      </div>
    </div>
  );
}
