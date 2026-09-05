"use client";

import { startTransition, useMemo, useState } from "react";

import PeopleCategoryFilter, {
  type PeopleCategoryId,
} from "./PeopleCategoryFilter";
import PeopleRotatingCarousel from "./PeopleRotatingCarousel";
import { PEOPLE_CAROUSEL_ITEMS } from "./items";
import { getVisiblePeople } from "./peopleSearch";

export default function PeoplePageContent({
  initialMemberSlug,
}: {
  initialMemberSlug?: string;
}) {
  const [activeCategory, setActiveCategory] =
    useState<PeopleCategoryId>("everyone");
  const [searchQuery, setSearchQuery] = useState("");
  const items = useMemo(
    () => getVisiblePeople(PEOPLE_CAROUSEL_ITEMS, activeCategory, searchQuery),
    [activeCategory, searchQuery],
  );

  return (
    <>
      <PeopleCategoryFilter
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        searchQuery={searchQuery}
        onSearchQueryChange={(value) => {
          startTransition(() => {
            setSearchQuery(value);
          });
        }}
      />
      {items.length > 0 ? (
        <PeopleRotatingCarousel
          key={activeCategory}
          items={items}
          initialMemberSlug={
            activeCategory === "everyone" && !searchQuery.trim()
              ? initialMemberSlug
              : undefined
          }
        />
      ) : (
        <p className="people-carousel-empty" role="status">
          No matching people
        </p>
      )}
    </>
  );
}
