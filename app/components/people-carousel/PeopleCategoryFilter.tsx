"use client";

import { useCallback, useEffect, useState } from "react";

import PeopleSearchOrb from "./PeopleSearchOrb";
import {
  PEOPLE_CATEGORY_OPTIONS,
  type PeopleCategoryId,
} from "./peopleCategories";

import "@/app/styles/people-category-filter.css";

export { PEOPLE_CATEGORY_OPTIONS, type PeopleCategoryId } from "./peopleCategories";

type PeopleCategoryFilterProps = {
  activeCategory: PeopleCategoryId;
  onCategoryChange: (categoryId: PeopleCategoryId) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
};

export default function PeopleCategoryFilter({
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchQueryChange,
}: PeopleCategoryFilterProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const hasQuery = searchQuery.trim().length > 0;
  const isSearchVisible = isSearchOpen || hasQuery;

  const dismissSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      setIsSearchOpen(false);
    }
  }, [searchQuery]);

  const cancelSearch = useCallback(() => {
    setIsSearchOpen(false);
    onSearchQueryChange("");
  }, [onSearchQueryChange]);

  useEffect(() => {
    if (!isSearchVisible) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cancelSearch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [cancelSearch, isSearchVisible]);

  return (
    <div className="people-category-filter" role="toolbar" aria-label="People categories">
      <div className="people-category-filter__items">
        <div
          className={[
            "people-category-filter__cluster",
            isSearchVisible ? "people-category-filter__cluster--search-open" : "",
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
                  aria-hidden={isSearchVisible}
                  tabIndex={isSearchVisible ? -1 : 0}
                  onClick={() => onCategoryChange(option.id)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <PeopleSearchOrb
            isOpen={isSearchVisible}
            query={searchQuery}
            onQueryChange={onSearchQueryChange}
            onOpen={() => setIsSearchOpen(true)}
            onCommit={dismissSearch}
            onClose={cancelSearch}
          />
        </div>
      </div>
    </div>
  );
}
