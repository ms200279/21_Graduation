"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type RefObject,
} from "react";

import {
  getCarouselRadius,
  MIN_CAROUSEL_RADIUS_PX,
  VISIBLE_CAROUSEL_SLOTS,
} from "./peopleCarouselModel";
import { MOBILE_VIEWPORT_EVENT } from "@/app/components/mobile-shell/viewportMetrics";

export type ZoneHitRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type Options = {
  bodyRef: RefObject<HTMLDivElement | null>;
  stageRef: RefObject<HTMLDivElement | null>;
  zoneCardRef: RefObject<HTMLElement | null>;
  batchIndex: number;
  displayRotation: number;
  zoneSlotInBatch: number;
};

export function usePeopleCarouselMeasurements({
  bodyRef,
  stageRef,
  zoneCardRef,
  batchIndex,
  displayRotation,
  zoneSlotInBatch,
}: Options) {
  const [carouselRadius, setCarouselRadius] = useState(
    MIN_CAROUSEL_RADIUS_PX,
  );
  const [zoneHitRect, setZoneHitRect] = useState<ZoneHitRect | null>(null);

  const updateZoneHitRect = useCallback(() => {
    const zoneCard = zoneCardRef.current;
    const body = bodyRef.current;

    if (!zoneCard || !body) {
      setZoneHitRect(null);
      return;
    }

    const cardRect = zoneCard.getBoundingClientRect();
    const bodyRect = body.getBoundingClientRect();

    setZoneHitRect({
      top: cardRect.top - bodyRect.top,
      left: cardRect.left - bodyRect.left,
      width: cardRect.width,
      height: cardRect.height,
    });
  }, [bodyRef, zoneCardRef]);

  const updateCarouselRadius = useCallback(() => {
    const stage = stageRef.current;

    if (!stage) {
      return;
    }

    setCarouselRadius(
      getCarouselRadius(
        stage.offsetHeight,
        stage.offsetWidth,
        VISIBLE_CAROUSEL_SLOTS,
      ),
    );
  }, [stageRef]);

  useLayoutEffect(() => {
    updateCarouselRadius();
  }, [updateCarouselRadius]);

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(updateZoneHitRect);
    return () => cancelAnimationFrame(frame);
  }, [
    batchIndex,
    carouselRadius,
    displayRotation,
    updateZoneHitRect,
    zoneSlotInBatch,
  ]);

  useEffect(() => {
    window.addEventListener("scroll", updateZoneHitRect, { passive: true });
    window.addEventListener("resize", updateZoneHitRect);
    window.addEventListener("resize", updateCarouselRadius);
    window.addEventListener(MOBILE_VIEWPORT_EVENT, updateZoneHitRect);
    window.addEventListener(MOBILE_VIEWPORT_EVENT, updateCarouselRadius);

    return () => {
      window.removeEventListener("scroll", updateZoneHitRect);
      window.removeEventListener("resize", updateZoneHitRect);
      window.removeEventListener("resize", updateCarouselRadius);
      window.removeEventListener(MOBILE_VIEWPORT_EVENT, updateZoneHitRect);
      window.removeEventListener(MOBILE_VIEWPORT_EVENT, updateCarouselRadius);
    };
  }, [updateCarouselRadius, updateZoneHitRect]);

  return { carouselRadius, zoneHitRect, updateZoneHitRect };
}
