"use client";

import {
  getCreditContentSide,
  getCreditFragmentById,
  type CreditFragmentId,
} from "./creditData";

type CreditContentOverlayProps = {
  selectedId: CreditFragmentId | null;
  isVisible: boolean;
  onClose: () => void;
};

export default function CreditContentOverlay({
  selectedId,
  isVisible,
  onClose,
}: CreditContentOverlayProps) {
  const selectedFragment = selectedId ? getCreditFragmentById(selectedId) : null;
  const contentSide = selectedId ? getCreditContentSide(selectedId) : "right";

  return (
    <div className="credits-content-layer" aria-live="polite">
      <section
        className={[
          "credits-content-panel",
          `credits-content-panel--${contentSide}`,
          selectedFragment && isVisible ? "credits-content-panel--visible" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-hidden={!selectedFragment}
      >
        {selectedFragment ? (
          <article className="credits-content-article">
            <button
              type="button"
              className="credits-content-article__back"
              aria-label="Back to all credits"
              onClick={onClose}
            >
              <span aria-hidden="true">←</span>
            </button>
            <h1 className="credits-content-article__title">
              {selectedFragment.title}
            </h1>
            <div className="credits-content-article__description">
              {selectedFragment.description.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        ) : null}
      </section>
    </div>
  );
}
