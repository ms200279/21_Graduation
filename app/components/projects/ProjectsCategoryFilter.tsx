"use client";

import type { ReactNode } from "react";

import {
  PROJECTS_CATEGORY_OPTIONS,
  type ProjectsCategoryId,
} from "./projectCategories";
import "@/app/styles/projects-category-filter.css";

export {
  PROJECTS_CATEGORY_OPTIONS,
  type ProjectsCategoryId,
} from "./projectCategories";

type ProjectsCategoryFilterProps = {
  actionSlot?: ReactNode;
  isSticky?: boolean;
  activeCategory: ProjectsCategoryId;
  onCategoryChange: (categoryId: ProjectsCategoryId) => void;
};

export default function ProjectsCategoryFilter({
  actionSlot,
  isSticky = true,
  activeCategory,
  onCategoryChange,
}: ProjectsCategoryFilterProps) {
  return (
    <div
      className={[
        "projects-category-filter",
        isSticky ? "" : "projects-category-filter--flow",
      ]
        .filter(Boolean)
        .join(" ")}
      role="toolbar"
      aria-label="Project categories"
    >
      <div className="projects-category-filter__items">
        <div className="projects-category-filter__buttons">
          {PROJECTS_CATEGORY_OPTIONS.map((option) => {
            const isActive = activeCategory === option.id;

            return (
              <button
                key={option.id}
                type="button"
                className={[
                  "projects-category-filter__button",
                  isActive ? "projects-category-filter__button--active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-pressed={isActive}
                onClick={() => onCategoryChange(option.id)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {actionSlot ? (
          <div className="projects-category-filter__actions">{actionSlot}</div>
        ) : null}
      </div>
    </div>
  );
}
