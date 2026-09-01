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

function getExpandedRect(anchor: { bottom: number; right: number }): MotionRect {
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

  return {
    top: window.innerHeight - insetBottom - height,
    left: window.innerWidth - insetX - width,
    width,
    height,
  };
}

export default function LandingHeroActionButton() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isBoxExpandedRef = useRef(false);
  const isCollapsingRef = useRef(false);
  const anchorRef = useRef<{ bottom: number; right: number } | null>(null);
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
    anchorRef.current = null;
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
    const anchor = { bottom: snapshot.bottom, right: snapshot.right };
    anchorRef.current = anchor;

    setPortalActive(true);
    setIsCollapsing(false);
    setIsBoxExpanded(false);
    setMotionRect({
      top: snapshot.top,
      left: snapshot.left,
      width: snapshot.width,
      height: snapshot.height,
    });

    requestAnimationFrame(() => {
      const button = buttonRef.current;
      if (button) {
        void button.offsetWidth;
      }

      setMotionRect(getExpandedRect(anchor));
      setIsBoxExpanded(true);
    });
  }, [portalActive]);

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

      setMotionRect(getCollapsedTargetRect(anchorRef.current ?? undefined));
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
          ? EXPANDED_RADIUS_PX
          : (motionRect?.height ?? 0) / 2,
        transition: [
          `top ${MOTION_DURATION_MS}ms ${MOTION_EASE}`,
          `left ${MOTION_DURATION_MS}ms ${MOTION_EASE}`,
          `width ${MOTION_DURATION_MS}ms ${MOTION_EASE}`,
          `height ${MOTION_DURATION_MS}ms ${MOTION_EASE}`,
          `border-radius ${MOTION_DURATION_MS}ms ${MOTION_EASE}`,
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
          09.19 SAT - 20 SUN&nbsp;&nbsp;10:00 - 17:30
        </p>
      </div>
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
