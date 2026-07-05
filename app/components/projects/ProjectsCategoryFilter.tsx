"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import "@/app/styles/projects-category-filter.css";

export const PROJECTS_CATEGORY_OPTIONS = [
  { id: "all-projects", label: "All Projects" },
  { id: "mobility-robot", label: "Mobility/Robot" },
  { id: "public-design", label: "Public Design" },
  { id: "it-education", label: "IT/Education" },
  { id: "smart-life", label: "Smart Life" },
  { id: "healthcare", label: "Healthcare" },
] as const;

export type ProjectsCategoryId = (typeof PROJECTS_CATEGORY_OPTIONS)[number]["id"];

type ProjectsCategoryFilterProps = {
  actionSlot?: ReactNode;
  isSticky?: boolean;
};

export default function ProjectsCategoryFilter({
  actionSlot,
  isSticky = true,
}: ProjectsCategoryFilterProps) {
  const [activeCategory, setActiveCategory] =
    useState<ProjectsCategoryId>("all-projects");

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
                onClick={() => setActiveCategory(option.id)}
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
