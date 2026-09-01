import type { CSSProperties } from "react";
import Image from "next/image";

const TRANSITION_EASE_CLASS_NAME =
  "duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]";

export function HeaderLogoIcon({
  className = "",
  style,
  disableTransition = false,
}: {
  className?: string;
  style?: CSSProperties;
  disableTransition?: boolean;
}) {
  return (
    <Image
      src="/icons/symbol.svg"
      alt=""
      aria-hidden="true"
      width={177}
      height={299}
      unoptimized
      style={style}
      className={[
        "block h-[calc(var(--orb-size)*0.48)] w-[calc(var(--orb-size)*0.284)] object-contain object-center",
        "translate-y-[1px]",
        disableTransition ? "" : "transition-opacity",
        disableTransition ? "" : TRANSITION_EASE_CLASS_NAME,
        className,
      ].join(" ")}
    />
  );
}
