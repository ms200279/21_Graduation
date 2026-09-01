import type { ProjectCard } from "./projectsCylinderConfig";

type ProjectsGridGalleryProps = {
  cards: ProjectCard[];
  onCardSelect: (id: number) => void;
  getProjectName: (id: number) => string;
};

export default function ProjectsGridGallery({
  cards,
  onCardSelect,
  getProjectName,
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
          <span className="projects-grid-card__number">
            {String(card.id).padStart(2, "0")}
          </span>
        </button>
      ))}
    </section>
  );
}
