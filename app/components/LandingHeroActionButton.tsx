"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type TransitionEvent,
} from "react";
import { createPortal } from "react-dom";
import { LANDING_INFO_LIQUID_GLASS_OPTIONS, useLiquidGlass } from "./liquid-glass";

const MOTION_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const COLLAPSE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const MOTION_DURATION_MS = 700;
const EXPANDED_RADIUS_PX = 28;

const SCHEDULE_DAYS = [
  {
    date: "09.18 FRI",
    items: [
      { time: "13:00", label: "자유관람" },
      { time: "15:00", label: "졸업생 특강" },
      { time: "16:00", label: "개회식" },
      { time: "16:20", label: "졸업작품 우수작 시상" },
      { time: "16:30", label: "자유관람" },
    ],
  },
  {
    date: "09.19 SAT",
    items: [
      { time: "10:00", label: "자유관람" },
    ],
  },
  {
    date: "09.20 SUN",
    items: [{ time: "10:00", label: "자유관람" }],
  },
] as const;

type MotionRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function asFiniteRect(rect: MotionRect): MotionRect | null {
  if (
    !Number.isFinite(rect.top) ||
    !Number.isFinite(rect.left) ||
    !Number.isFinite(rect.width) ||
    !Number.isFinite(rect.height)
  ) {
    return null;
  }

  return rect;
}

function syncMobileInfoScrollPad(button: HTMLElement) {
  if (!window.matchMedia("(max-width: 767px)").matches) {
    button.style.removeProperty("--info-scroll-pad");
    return;
  }

  const panels = button.querySelector<HTMLElement>(
    ".landing-hero-action__panels",
  );
  if (!panels) {
    return;
  }

  const parking = [
    ...panels.querySelectorAll(".landing-hero-action__section-title"),
  ].find((el) => el.textContent?.trim() === "Parking");
  if (!parking) {
    return;
  }

  button.style.setProperty("--info-scroll-pad", "0px");
  const parkingOffset =
    parking.getBoundingClientRect().top - panels.getBoundingClientRect().top;
  const pad = Math.max(0, Math.round(panels.clientHeight - parkingOffset));
  button.style.setProperty("--info-scroll-pad", `${pad}px`);
}

function parseCssLength(value: string, rootFontSize: number) {
  const normalized = value.trim();

  if (!normalized) {
    return 0;
  }

  if (normalized.endsWith("rem")) {
    return parseFloat(normalized) * rootFontSize;
  }

  if (normalized.endsWith("px")) {
    return parseFloat(normalized);
  }

  if (normalized.endsWith("dvh")) {
    return (parseFloat(normalized) / 100) * window.innerHeight;
  }

  if (normalized.endsWith("vh")) {
    return (parseFloat(normalized) / 100) * window.innerHeight;
  }

  return parseFloat(normalized);
}

function getViewportBox() {
  const visualViewport = window.visualViewport;

  return {
    width: visualViewport?.width ?? window.innerWidth,
    height: visualViewport?.height ?? window.innerHeight,
    top: visualViewport?.offsetTop ?? 0,
    left: visualViewport?.offsetLeft ?? 0,
  };
}

function isMobileViewport() {
  return window.matchMedia("(max-width: 767px)").matches;
}

function getExpandedRect(anchor: { bottom: number; right: number }): MotionRect {
  if (isMobileViewport()) {
    const viewport = getViewportBox();
    const width = viewport.width;
    const height = viewport.height * 0.75;

    return {
      top: viewport.top + viewport.height - height,
      left: viewport.left,
      width,
      height,
    };
  }

  const width = window.innerWidth * (1 / 2);
  const height = window.innerHeight * (2 / 3);

  return {
    top: anchor.bottom - height,
    left: anchor.right - width,
    width,
    height,
  };
}

function getCollapsedTargetRect(
  anchor?: { bottom: number; right: number },
): MotionRect {
  const hero = document.querySelector<HTMLElement>(".landing-hero");

  if (!hero) {
    if (!anchor) {
      return {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
      };
    }

    return {
      top: anchor.bottom,
      left: anchor.right,
      width: 0,
      height: 0,
    };
  }

  const heroStyles = getComputedStyle(hero);
  const htmlStyles = getComputedStyle(document.documentElement);
  const rootFontSize = parseFloat(htmlStyles.fontSize) || 16;
  const width = parseCssLength(
    heroStyles.getPropertyValue("--landing-hero-action-width"),
    rootFontSize,
  );
  const height = parseCssLength(
    heroStyles.getPropertyValue("--landing-hero-action-height"),
    rootFontSize,
  );
  const insetX = parseCssLength(
    htmlStyles.getPropertyValue("--landing-copy-inset-x"),
    rootFontSize,
  );
  const insetBottom = parseCssLength(
    heroStyles.getPropertyValue("--landing-hero-action-inset-bottom"),
    rootFontSize,
  );

  if (!window.matchMedia("(max-width: 767px)").matches) {
    return {
      top: window.innerHeight - insetBottom - height,
      left: window.innerWidth - insetX - width,
      width,
      height,
    };
  }

  const safeRight = parseCssLength(
    htmlStyles.getPropertyValue("--safe-right"),
    rootFontSize,
  );
  const safeBottom = parseCssLength(
    htmlStyles.getPropertyValue("--safe-bottom"),
    rootFontSize,
  );
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
  const viewportTop = window.visualViewport?.offsetTop ?? 0;
  const viewportLeft = window.visualViewport?.offsetLeft ?? 0;

  return {
    top: viewportTop + viewportHeight - safeBottom - insetBottom - height,
    left: viewportLeft + viewportWidth - safeRight - insetX - width,
    width,
    height,
  };
}

export default function LandingHeroActionButton() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isBoxExpandedRef = useRef(false);
  const isCollapsingRef = useRef(false);
  const originRectRef = useRef<MotionRect | null>(null);
  const [portalActive, setPortalActive] = useState(false);
  const [isBoxExpanded, setIsBoxExpanded] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [motionRect, setMotionRect] = useState<MotionRect | null>(null);
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useLiquidGlass(buttonRef, {
    ...LANDING_INFO_LIQUID_GLASS_OPTIONS,
    mountKey: portalActive,
  });

  useEffect(() => {
    isBoxExpandedRef.current = isBoxExpanded;
  }, [isBoxExpanded]);

  useEffect(() => {
    isCollapsingRef.current = isCollapsing;
  }, [isCollapsing]);

  const finishCollapse = useCallback(() => {
    setPortalActive(false);
    setIsCollapsing(false);
    setMotionRect(null);
    originRectRef.current = null;
  }, []);

  useEffect(() => {
    document.body.classList.toggle(
      "landing-hero-action-expanded",
      isBoxExpanded || isCollapsing,
    );

    return () => {
      document.body.classList.remove("landing-hero-action-expanded");
    };
  }, [isBoxExpanded, isCollapsing]);

  useEffect(() => {
    if (!portalActive || (!isBoxExpanded && !isCollapsing)) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [portalActive, isBoxExpanded, isCollapsing]);

  const expand = useCallback(() => {
    const button = buttonRef.current;

    if (!button || portalActive) {
      return;
    }

    const snapshot = button.getBoundingClientRect();
    const originRect = {
      top: snapshot.top,
      left: snapshot.left,
      width: snapshot.width,
      height: snapshot.height,
    };
    originRectRef.current = originRect;

    setPortalActive(true);
    setIsCollapsing(false);
    setIsBoxExpanded(false);
    setMotionRect(originRect);

    requestAnimationFrame(() => {
      const button = buttonRef.current;
      if (button) {
        void button.offsetWidth;
      }

      setMotionRect(
        getExpandedRect({
          bottom: snapshot.bottom,
          right: snapshot.right,
        }),
      );
      setIsBoxExpanded(true);
    });
  }, [portalActive]);

  useEffect(() => {
    if (!isBoxExpanded || isCollapsing) {
      return;
    }

    const syncExpandedRect = () => {
      const origin = originRectRef.current;

      if (!origin) {
        return;
      }

      setMotionRect(
        getExpandedRect({
          bottom: origin.top + origin.height,
          right: origin.left + origin.width,
        }),
      );
    };

    const syncScrollPad = () => {
      const button = buttonRef.current;
      if (button) {
        syncMobileInfoScrollPad(button);
      }
    };

    window.addEventListener("resize", syncExpandedRect);
    window.visualViewport?.addEventListener("resize", syncExpandedRect);
    window.addEventListener("resize", syncScrollPad);
    window.visualViewport?.addEventListener("resize", syncScrollPad);

    const frame = requestAnimationFrame(syncScrollPad);
    const settleTimer = window.setTimeout(syncScrollPad, MOTION_DURATION_MS);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
      window.removeEventListener("resize", syncExpandedRect);
      window.visualViewport?.removeEventListener("resize", syncExpandedRect);
      window.removeEventListener("resize", syncScrollPad);
      window.visualViewport?.removeEventListener("resize", syncScrollPad);
    };
  }, [isBoxExpanded, isCollapsing]);

  const collapse = useCallback(() => {
    if (!portalActive || !isBoxExpandedRef.current) {
      return;
    }

    setIsCollapsing(true);
    setIsBoxExpanded(false);

    requestAnimationFrame(() => {
      const button = buttonRef.current;
      if (button) {
        void button.offsetWidth;
      }

      const origin = originRectRef.current;
      const isMobile = window.matchMedia("(max-width: 767px)").matches;

      if (isMobile) {
        const collapsedRect =
          origin && asFiniteRect(origin)
            ? origin
            : asFiniteRect(getCollapsedTargetRect()) ?? origin;

        if (collapsedRect) {
          setMotionRect(collapsedRect);
        }

        return;
      }

      setMotionRect(
        getCollapsedTargetRect(
          origin
            ? {
                bottom: origin.top + origin.height,
                right: origin.left + origin.width,
              }
            : undefined,
        ),
      );
    });
  }, [portalActive]);

  const handleTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLButtonElement>) => {
      if (
        event.target !== buttonRef.current ||
        event.propertyName !== "width"
      ) {
        return;
      }

      if (!isCollapsingRef.current) {
        return;
      }

      finishCollapse();
    },
    [finishCollapse],
  );

  const showInfoLabel = !portalActive || isCollapsing;

  const isMobileMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 767px)").matches;
  const motionEase =
    isCollapsing && isMobileMotion ? COLLAPSE_EASE : MOTION_EASE;
  const motionStyle: CSSProperties | undefined = portalActive
    ? {
        position: "fixed",
        top: motionRect?.top ?? 0,
        left: motionRect?.left ?? 0,
        width: motionRect?.width ?? 0,
        height: motionRect?.height ?? 0,
        margin: 0,
        right: "auto",
        bottom: "auto",
        borderRadius: isBoxExpanded
          ? isMobileMotion
            ? "1.25rem 1.25rem 0 0"
            : EXPANDED_RADIUS_PX
          : (motionRect?.height ?? 0) / 2,
        transition: [
          `top ${MOTION_DURATION_MS}ms ${motionEase}`,
          `left ${MOTION_DURATION_MS}ms ${motionEase}`,
          `width ${MOTION_DURATION_MS}ms ${motionEase}`,
          `height ${MOTION_DURATION_MS}ms ${motionEase}`,
          `border-radius ${MOTION_DURATION_MS}ms ${motionEase}`,
        ].join(", "),
      }
    : undefined;

  const buttonClassName = [
    "landing-hero-action liquid-glass-surface touch-manipulation",
    portalActive ? "landing-hero-action--portal" : "",
    isBoxExpanded ? "landing-hero-action--expanded cursor-default" : "",
    isCollapsing ? "landing-hero-action--collapsing cursor-default" : "",
    !isBoxExpanded && !isCollapsing ? "cursor-pointer" : "",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-systemNavy",
  ].join(" ");

  const expandedPanels = isBoxExpanded ? (
    <div className="landing-hero-action__panels" aria-hidden={!isBoxExpanded}>
      <div className="landing-hero-action__panel landing-hero-action__panel--schedule">
        <h2 className="landing-hero-action__section-title">Schedule</h2>
        <div className="landing-hero-action__schedule-days">
          {SCHEDULE_DAYS.map((day) => (
            <section key={day.date} className="landing-hero-action__schedule-day">
              <p className="landing-hero-action__schedule-date">{day.date}</p>
              <ul className="landing-hero-action__schedule-list">
                {day.items.map((item) => (
                  <li
                    key={`${day.date}-${item.time}-${item.label}`}
                    className="landing-hero-action__schedule-item"
                  >
                    {item.time} {item.label}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
      <div className="landing-hero-action__panel landing-hero-action__panel--info">
        <h2 className="landing-hero-action__section-title">Address</h2>
        <p className="landing-hero-action__section-text">
          홍대 아트센터 지하 2층 전시관 3
          <br />
          서울특별시 종로구 대학로 57
        </p>
        <h2 className="landing-hero-action__section-title landing-hero-action__section-title--follow">
          Parking
        </h2>
        <p className="landing-hero-action__section-text">
          기본 30분 3,000원 / 이후 20분당 2,000원
          <br />
          이용객 주차권 지참 시 50% 할인 및 1시간 무료 이용권 제공
          <br />
          (주차권으로만 정산 가능, 티켓 정산 불가)
          <br />
          주차권 배부 장소 : B2 전시관3, 전시장 입구 인포데스크
        </p>
        <h2 className="landing-hero-action__section-title landing-hero-action__section-title--follow">
          Hours
        </h2>
        <p className="landing-hero-action__section-text">
          09.18 FRI&nbsp;&nbsp;13:00 - 17:30
          <br />
          09.19 SAT&nbsp;&nbsp;10:00 - 17:30
          <br />
          09.20 SUN&nbsp;&nbsp;10:00 - 17:00
        </p>
      </div>
      <div className="landing-hero-action__scroll-spacer" aria-hidden="true" />
    </div>
  ) : null;

  const buttonNode = (
    <button
      ref={buttonRef}
      type="button"
      aria-label="Exhibition info"
      aria-expanded={isBoxExpanded}
      onClick={expand}
      onTransitionEnd={handleTransitionEnd}
      style={motionStyle}
      className={buttonClassName}
    >
      {!showInfoLabel ? null : (
        <span className="landing-hero-action__label">INFO</span>
      )}
      {expandedPanels}
    </button>
  );

  const portalNode =
    portalActive && isMounted ? (
      <>
        <div
          className="landing-hero-action-backdrop"
          aria-hidden={!isBoxExpanded}
          onClick={isBoxExpanded ? collapse : undefined}
        />
        {buttonNode}
      </>
    ) : null;

  return (
    <>
      {!portalActive ? buttonNode : null}
      {portalNode ? createPortal(portalNode, document.body) : null}
    </>
  );
}
