import type { SVGProps } from "react";
import type { IconName } from "@/types/icon";

export interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
  /** Stroke width; defaults to 1.5 (matches the prototype's `I.*` library). */
  strokeWidth?: number;
  /** Decorative icons must be hidden from AT; defaults to true. */
  decorative?: boolean;
}

const SHARED: Omit<SVGProps<SVGSVGElement>, "children"> = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

/**
 * Inline SVG icon set. Add new icons in the switch below and extend
 * IconName in src/types/icon.ts to keep type-safety.
 *
 * Sourced 1:1 from the prototype's `I.*` module (app/components.jsx:5-49).
 */
export function Icon({
  name,
  size = 20,
  strokeWidth = 1.5,
  decorative = true,
  className,
  ...rest
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      aria-hidden={decorative || undefined}
      role={decorative ? undefined : "img"}
      className={className}
      {...SHARED}
      {...rest}
    >
      <Path name={name} />
    </svg>
  );
}

function Path({ name }: { name: IconName }) {
  switch (name) {
    case "search":
      return (
        <>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </>
      );
    case "home":
      return <path d="M3 11 12 4l9 7v8a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />;
    case "user":
      return (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
        </>
      );
    case "users":
      return (
        <>
          <circle cx="9" cy="8" r="4" />
          <path d="M1 21c0-4 3.5-7 8-7s8 3 8 7" />
          <circle cx="17" cy="6" r="3" />
          <path d="M14.5 13.5c3-.5 6.5 1.5 6.5 5" />
        </>
      );
    case "calendar":
      return (
        <>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </>
      );
    case "plus":
      return <path d="M12 5v14M5 12h14" />;
    case "x":
      return <path d="M6 6l12 12M18 6 6 18" />;
    case "check":
      return <path d="m4 12 5 5L20 6" />;
    case "chevron-right":
      return <path d="m9 6 6 6-6 6" />;
    case "chevron-down":
      return <path d="m6 9 6 6 6-6" />;
    case "arrow-right":
      return <path d="M5 12h14M13 5l7 7-7 7" />;
    case "arrow-left":
      return <path d="M19 12H5M11 5l-7 7 7 7" />;
    case "bell":
      return <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 3h16zM10 21a2 2 0 0 0 4 0" />;
    case "bag":
      return <path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8zM9 8V6a3 3 0 0 1 6 0v2" />;
    case "gift":
      return (
        <>
          <rect x="3" y="9" width="18" height="12" rx="1" />
          <path d="M3 13h18M12 9v12M8 9a3 3 0 1 1 4-3 3 3 0 1 1 4 3" />
        </>
      );
    case "sparkle":
      return <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" />;
    case "chart":
      return <path d="M4 20V8m6 12V4m6 16v-9m6 9v-5" />;
    case "message":
      return <path d="M21 12a8 8 0 0 1-12 7l-5 2 2-5a8 8 0 1 1 15-4z" />;
    case "whatsapp":
      return (
        <path d="M20 12a8 8 0 0 1-12 7l-5 2 2-5a8 8 0 1 1 15-4zM8 11a4 4 0 0 0 5 3l1.5-1-1.5-1.5L11.5 12 10 10.5l.5-1.5L9 7.5 8 8z" />
      );
    case "email":
      return (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </>
      );
    case "sms":
      return <path d="M21 12a8 8 0 0 1-12 7l-5 2 2-5a8 8 0 1 1 15-4zM8 10h.01M12 10h.01M16 10h.01" />;
    case "more":
      return (
        <>
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
        </>
      );
    case "filter":
      return <path d="M4 5h16M7 12h10M10 19h4" />;
    case "scan":
      return <path d="M4 7V5a1 1 0 0 1 1-1h2M20 7V5a1 1 0 0 0-1-1h-2M4 17v2a1 1 0 0 0 1 1h2M20 17v2a1 1 0 0 1-1 1h-2M4 12h16" />;
    case "excel":
      return (
        <>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="m9 9 6 6M15 9l-6 6" />
        </>
      );
    case "pdf":
      return (
        <>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M9 13h6M9 17h6M9 9h3" />
        </>
      );
    case "camera":
      return (
        <>
          <path d="M3 8h4l2-3h6l2 3h4v11H3z" />
          <circle cx="12" cy="13" r="3.5" />
        </>
      );
    case "warning":
      return <path d="M12 3 2 21h20zM12 10v5M12 18h.01" />;
    case "lock":
      return (
        <>
          <rect x="5" y="10" width="14" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </>
      );
    case "trash":
      return <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" />;
    case "eye":
      return (
        <>
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </>
      );
    case "device":
      return (
        <>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M10 18h4" />
        </>
      );
    case "ticket":
      return <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />;
    case "cloud":
      return <path d="M7 18a4 4 0 1 1 .5-7.97A6 6 0 0 1 19 11a4 4 0 0 1 0 7z" />;
    case "plug":
      return <path d="M9 4v4M15 4v4M6 8h12v4a6 6 0 0 1-12 0zM12 18v3" />;
    case "download":
      return <path d="M12 4v12m0 0-4-4m4 4 4-4M4 20h16" />;
    case "power":
      return <path d="M12 3v8m6.4-3.6a8 8 0 1 1-12.8 0" />;
    case "shield":
      return <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />;
    case "heart":
      return <path d="M12 21s-7-4.5-7-10.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 7 4.5C19 16.5 12 21 12 21z" />;
    case "star":
      return <path d="m12 3 2.6 6 6.4.5-4.9 4.2 1.5 6.3L12 16.8 6.4 20l1.5-6.3L3 9.5 9.4 9z" />;
    case "wifi":
      return <path d="M2 9a16 16 0 0 1 20 0M5 13a11 11 0 0 1 14 0M8.5 17a6 6 0 0 1 7 0M12 21h.01" />;
    case "wifi-off":
      return <path d="m2 2 20 20M9.5 17a6 6 0 0 1 5 0M2 9a16 16 0 0 1 8-3" />;
    case "loreal-logo":
      return <path d="M4 6h16M4 12h10M4 18h16" />;
  }
}
