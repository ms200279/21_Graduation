"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

import { getProjectAuthors } from "@/app/components/people-carousel/items";
import { SITE_PATHS } from "@/app/utils/routes";
import type {
  ProjectDetailData,
  ProjectStorySection,
} from "./projectData";
import "@/app/styles/project-detail.css";

type ProjectDetailProps = {
  project: ProjectDetailData;
};

const PROJECT_DETAIL_CLOSE_DURATION_MS = 560;
const PROJECT_DETAIL_REDUCED_MOTION_DURATION_MS = 160;
const PROJECT_DETAIL_SECTION_COUNT = 7;

type ProjectMediaProps = {
  src: string | null;
  label: string;
  variant: "thumbnail" | "story" | "detail";
};

function ProjectMedia({ src, label, variant }: ProjectMediaProps) {
  const [hasImageError, setHasImageError] = useState(false);

  return (
    <div
      className={`project-detail-media project-detail-media--${variant}`}
      aria-label={src && !hasImageError ? undefined : `${label} image placeholder`}
    >
      {src && !hasImageError ? (
        <Image
          src={src}
          alt={label}
          fill
          sizes={variant === "story" ? "(min-width: 768px) 52vw, 100vw" : "(min-width: 768px) 62vw, 100vw"}
          className="project-detail-media__image"
          onError={() => setHasImageError(true)}
        />
      ) : (
        <span className="project-detail-media__placeholder" aria-hidden="true">
          {label}
        </span>
      )}
    </div>
  );
}

function ProjectStoryPage({
  section,
  index,
}: {
  section: ProjectStorySection;
  index: number;
}) {
  const imageFirst = index % 2 === 1;

  return (
    <section
      className={[
        "project-detail-section",
        "project-detail-story",
        imageFirst ? "project-detail-story--image-first" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby={`project-section-${section.id}`}
    >
      <div className="project-detail-story__copy">
        <h2
          id={`project-section-${section.id}`}
          className="project-detail-title"
        >
          {section.title}
        </h2>
        {section.subtitle ? (
          <p className="project-detail-lead">{section.subtitle}</p>
        ) : null}
        <p className="project-detail-body">{section.body}</p>
      </div>
      <ProjectMedia
        src={section.imageSrc}
        label={section.title}
        variant="story"
      />
    </section>
  );
}

export default function ProjectDetail({ project }: ProjectDetailProps) {
  const router = useRouter();
  const authors = getProjectAuthors(project.id);
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isClosingRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const closeProject = useCallback(() => {
    if (isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;
    setIsClosing(true);
    const closeDuration = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
      ? PROJECT_DETAIL_REDUCED_MOTION_DURATION_MS
      : PROJECT_DETAIL_CLOSE_DURATION_MS;

    closeTimerRef.current = setTimeout(() => {
      router.push(SITE_PATHS.projects, { scroll: false });
    }, closeDuration);
  }, [router]);

  useEffect(() => {
    document.documentElement.setAttribute("data-project-detail-open", "true");
    closeButtonRef.current?.focus({ preventScroll: true });
    let openFrame = 0;
    const initialFrame = window.requestAnimationFrame(() => {
      openFrame = window.requestAnimationFrame(() => {
        setIsOpen(true);
      });
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeProject();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(initialFrame);
      window.cancelAnimationFrame(openFrame);

      if (closeTimerRef.current !== null) {
        clearTimeout(closeTimerRef.current);
      }

      document.documentElement.removeAttribute("data-project-detail-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeProject]);

  const scrollToThumbnail = () => {
    scrollRef.current?.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  const updateActiveSection = () => {
    const scrollContainer = scrollRef.current;

    if (!scrollContainer) {
      return;
    }

    const sections = Array.from(
      scrollContainer.querySelectorAll<HTMLElement>(
        ".project-detail-section",
      ),
    );
    let closestSectionIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    sections.forEach((section, index) => {
      const distance = Math.abs(section.offsetTop - scrollContainer.scrollTop);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestSectionIndex = index;
      }
    });

    setActiveSectionIndex((currentIndex) =>
      currentIndex === closestSectionIndex ? currentIndex : closestSectionIndex,
    );
  };

  const scrollToSection = (sectionIndex: number) => {
    const scrollContainer = scrollRef.current;
    const targetSection = scrollContainer?.querySelectorAll<HTMLElement>(
      ".project-detail-section",
    )[sectionIndex];

    if (!scrollContainer || !targetSection) {
      return;
    }

    scrollContainer.scrollTo({
      top: targetSection.offsetTop,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <div
      className={[
        "project-detail-layer",
        isOpen ? "project-detail-layer--open" : "",
        isClosing ? "project-detail-layer--closing" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="dialog"
      aria-modal="true"
    >
      <div className="project-detail-backdrop" aria-hidden="true" />
      <article
        className="project-detail-panel"
        aria-labelledby="project-detail-heading"
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="project-detail-close"
          aria-label="Close project"
          onClick={closeProject}
        >
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 5L19 19M19 5L5 19"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <nav className="project-detail-progress" aria-label="Project sections">
          {Array.from({ length: PROJECT_DETAIL_SECTION_COUNT }, (_, index) => (
            <button
              type="button"
              key={index}
              className={[
                "project-detail-progress__bar",
                activeSectionIndex === index
                  ? "project-detail-progress__bar--active"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label={`Go to project section ${index + 1}`}
              aria-current={activeSectionIndex === index ? "step" : undefined}
              onClick={() => scrollToSection(index)}
            />
          ))}
        </nav>

        <div
          ref={scrollRef}
          className="project-detail-scroll"
          onScroll={updateActiveSection}
        >
          <section
            className="project-detail-section project-detail-thumbnail"
            aria-labelledby="project-detail-heading"
          >
            <div className="project-detail-thumbnail__visual">
              <ProjectMedia
                src={project.thumbnailSrc}
                label={`${project.name} thumbnail`}
                variant="thumbnail"
              />
            </div>
            <div className="project-detail-thumbnail__copy">
              <div>
                <h1 id="project-detail-heading" className="project-detail-head">
                  {project.name}
                </h1>
                <p className="project-detail-tag">#{project.tag}</p>
                <p className="project-detail-body">{project.body}</p>
              </div>
              {authors.length > 0 ? (
                <nav
                  className="project-detail-authors"
                  aria-label="Project members"
                >
                  {authors.map((author) => (
                    <Link
                      key={author.id}
                      href={author.memberHref}
                      className="project-detail-author"
                    >
                      <span className="project-detail-author__name">
                        {author.name}
                      </span>
                      <span className="project-detail-author__button">
                        Profile
                      </span>
                    </Link>
                  ))}
                </nav>
              ) : null}
            </div>
          </section>

          {project.sections.map((section, index) => (
            <ProjectStoryPage
              key={section.id}
              section={section}
              index={index}
            />
          ))}

          <section
            className="project-detail-section project-detail-final"
            aria-labelledby="project-detail-section-detail"
          >
            <div className="project-detail-final__content">
              <h2
                id="project-detail-section-detail"
                className="project-detail-title"
              >
                Detail
              </h2>
              <div className="project-detail-final__grid">
                {project.details.map((detail, index) => (
                  <article key={detail.id} className="project-detail-final__item">
                    <ProjectMedia
                      src={detail.imageSrc}
                      label={`${project.name} detail ${index + 1}`}
                      variant="detail"
                    />
                    <p className="project-detail-body">{detail.body}</p>
                  </article>
                ))}
              </div>
              <button
                type="button"
                className="project-detail-to-top"
                aria-label="Back to project thumbnail"
                onClick={scrollToThumbnail}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5 15L12 8L19 15"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </section>
        </div>
      </article>
    </div>,
    document.body,
  );
}
