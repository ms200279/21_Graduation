import Image from "next/image";

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
  return (
    <section className="projects-grid-gallery" aria-label="Project grid">
      {cards.map((card) => (
        <button
          key={card.id}
          type="button"
          className="projects-grid-card"
          aria-label={`Open ${getProjectName(card.id)}`}
          onClick={() => onCardSelect(card.id)}
        >
          <Image
            src={getProjectThumbnail(card.id)}
            alt=""
            fill
            sizes="(min-width: 1536px) 376px, (min-width: 1024px) 23vw, 46vw"
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
      ))}
    </section>
  );
}
