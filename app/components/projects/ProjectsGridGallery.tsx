"use client";

import Image from "next/image";
import { useState } from "react";

import { useIsMobileViewport } from "@/app/utils/useIsMobileViewport";
import type { ProjectCard } from "./projectsCylinderConfig";

type ProjectsGridGalleryProps = {
  cards: ProjectCard[];
  onCardSelect: (id: number) => void;
  getProjectName: (id: number) => string;
  getProjectThumbnail: (id: number) => string;
  getProjectDescription: (id: number) => string;
};

export default function ProjectsGridGallery({
  cards,
  onCardSelect,
  getProjectName,
  getProjectThumbnail,
  getProjectDescription,
}: ProjectsGridGalleryProps) {
  const isMobile = useIsMobileViewport();
  const [previewId, setPreviewId] = useState<number | null>(null);

  return (
    <section className="projects-grid-gallery" aria-label="Project grid">
      {cards.map((card, cardIndex) => {
        const isPreview = isMobile && previewId === card.id;

        return (
          <button
            key={card.id}
            type="button"
            className={[
              "projects-grid-card",
              isPreview ? "projects-grid-card--preview" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={`Open ${getProjectName(card.id)}`}
            aria-expanded={isMobile ? isPreview : undefined}
            onClick={() => {
              if (!isMobile) {
                onCardSelect(card.id);
                return;
              }

              if (previewId === card.id) {
                onCardSelect(card.id);
                return;
              }

              setPreviewId(card.id);
            }}
          >
            <Image
              src={getProjectThumbnail(card.id)}
              alt=""
              fill
              sizes="(max-width: 767px) 92vw, (min-width: 1536px) 376px, (min-width: 1024px) 23vw, 46vw"
              loading={cardIndex === 0 ? "eager" : "lazy"}
              className="projects-grid-card__image"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            <span className="projects-card-overlay">
              <strong className="projects-card-overlay__title">
                {getProjectName(card.id)}
              </strong>
              <span className="projects-card-overlay__description">
                {getProjectDescription(card.id)}
              </span>
            </span>
          </button>
        );
      })}
    </section>
  );
}
