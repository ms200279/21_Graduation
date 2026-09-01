"use client";

import { createPortal } from "react-dom";
import type { CSSProperties, RefObject } from "react";

import type {
  CardRect,
  ExpandedCardState,
} from "./peopleCarouselModel";
import { PeopleCarouselCardSurface } from "./PeopleCarouselCard";

type Props = {
  expandedCard: ExpandedCardState;
  bodyAnchorRect: CardRect;
  expandedTargetLayoutRect: CardRect;
  expandAlignRef: RefObject<HTMLDivElement | null>;
  expand3dRootRef: RefObject<HTMLDivElement | null>;
  expandSurfaceRef: RefObject<HTMLDivElement | null>;
  expandIsOpen: boolean;
  expandIsClosing: boolean;
  expandCloseHandoff: boolean;
  expandCloseReady: boolean;
  expandShouldAnimate: boolean;
  expandTransformOriginValue: string;
  expandAlignTransform: string;
  expandUseCarouselPose: boolean;
  expandCarouselRigTransform: string;
  expandCarouselStageTransform?: string;
  expandCarouselSlotTransform?: string;
  expandShowHoverSurface: boolean;
  zoneHoverStandDeg: number;
  zoneHoverLiftPx: number;
  onClose: () => void;
};

export default function PeopleCarouselExpandedPortal({
  expandedCard,
  bodyAnchorRect,
  expandedTargetLayoutRect,
  expandAlignRef,
  expand3dRootRef,
  expandSurfaceRef,
  expandIsOpen,
  expandIsClosing,
  expandCloseHandoff,
  expandCloseReady,
  expandShouldAnimate,
  expandTransformOriginValue,
  expandAlignTransform,
  expandUseCarouselPose,
  expandCarouselRigTransform,
  expandCarouselStageTransform,
  expandCarouselSlotTransform,
  expandShowHoverSurface,
  zoneHoverStandDeg,
  zoneHoverLiftPx,
  onClose,
}: Props) {
  return createPortal(
    <div
      className={[
        "people-carousel-expand",
        "people-carousel-expand--visible",
        expandIsOpen || expandIsClosing ? "people-carousel-expand--open" : "",
        expandIsClosing ? "people-carousel-expand--closing" : "",
        expandCloseHandoff ? "people-carousel-expand--handoff" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className="people-carousel-expand__backdrop"
        onClick={onClose}
        aria-label="Close expanded card"
      />
      <div
        ref={expand3dRootRef}
        className="people-carousel-expand-3d-root"
        style={{
          top: bodyAnchorRect.top,
          left: bodyAnchorRect.left,
          width: bodyAnchorRect.width,
          height: bodyAnchorRect.height,
          perspective: `${expandedCard.restPose.carouselPerspective}px`,
        }}
        role="dialog"
        aria-modal="true"
        aria-label={expandedCard.item.name}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          ref={expandAlignRef}
          className={[
            "people-carousel-expand-align",
            expandShouldAnimate ? "people-carousel-expand-align--animate" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{
            transformOrigin: expandTransformOriginValue,
            transform: expandAlignTransform,
          }}
        >
          <div
            className={[
              "people-carousel-rig",
              "people-carousel-expand-layer",
              expandShouldAnimate ? "people-carousel-expand-layer--animate" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{
              transform: expandUseCarouselPose
                ? expandCarouselRigTransform
                : "none",
            }}
          >
            <div
              className={[
                "people-carousel-stage",
                "people-carousel-expand-layer",
                expandShouldAnimate
                  ? "people-carousel-expand-layer--animate"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{
                width: expandedCard.restPose.stageWidth || undefined,
                height: expandedCard.restPose.stageHeight || undefined,
                transform: expandUseCarouselPose
                  ? expandCarouselStageTransform
                  : "none",
              }}
            >
              <article
                className={[
                  "people-carousel-card",
                  "people-carousel-expand-layer",
                  expandShouldAnimate
                    ? "people-carousel-expand-layer--animate"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  transform: expandUseCarouselPose
                    ? expandCarouselSlotTransform
                    : "none",
                }}
              >
                <PeopleCarouselCardSurface
                  ref={expandSurfaceRef}
                  className={[
                    "people-carousel-card__surface",
                    "people-carousel-card__surface--in-zone",
                    expandShowHoverSurface
                      ? "people-carousel-card__surface--in-zone-hovered"
                      : "",
                    expandIsOpen
                      ? "people-carousel-expand__surface--open"
                      : "",
                    expandIsClosing
                      ? "people-carousel-card__surface--visible-glass"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={
                    expandShowHoverSurface
                      ? ({
                          "--zone-hover-stand-deg": `${zoneHoverStandDeg}deg`,
                          "--zone-hover-lift-px": `${zoneHoverLiftPx}px`,
                        } as CSSProperties)
                      : undefined
                  }
                  item={expandedCard.item}
                />
              </article>
            </div>
          </div>
        </div>
      </div>
      {expandIsOpen && expandCloseReady ? (
        <button
          type="button"
          className="people-carousel-expand__close people-carousel-expand__close--visible"
          style={{
            top: expandedTargetLayoutRect.top + 16,
            left:
              expandedTargetLayoutRect.left +
              expandedTargetLayoutRect.width -
              52,
          }}
          onClick={onClose}
          aria-label="Close expanded card"
        >
          ×
        </button>
      ) : null}
    </div>,
    document.body,
  );
}
