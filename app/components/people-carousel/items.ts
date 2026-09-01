export type PeopleCarouselItem = {
  id: string;
  name: string;
  role?: string;
  phone?: string;
  photoSrc?: string;
};

/** Placeholder roster until people data is wired to Supabase. */
export const PEOPLE_CAROUSEL_ITEMS: PeopleCarouselItem[] = Array.from(
  { length: 99 },
  (_, index) => {
    const memberNumber = String(index + 1).padStart(2, "0");

    return {
      id: String(index + 1),
      name: `Member ${memberNumber}`,
      role: "Design Engineering",
      phone: "010-0000-0000",
    };
  },
);
