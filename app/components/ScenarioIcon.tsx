import type { Scenario } from "../data/scenarios";
import type { ReactNode } from "react";

type ScenarioIconProps = {
  name: Scenario["iconName"];
  className?: string;
};

const iconPaths: Record<Scenario["iconName"], ReactNode> = {
  cart: (
    <>
      <path d="M7 8h11l-1.2 6.2a2 2 0 0 1-2 1.6H9.3a2 2 0 0 1-2-1.7L6.2 5H4" />
      <path d="M9 20h.01" />
      <path d="M16 20h.01" />
    </>
  ),
  professor: (
    <>
      <path d="M4 19.5V6a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 .5Z" />
      <path d="M8 8h7" />
      <path d="M8 12h5" />
    </>
  ),
  party: (
    <>
      <path d="m4 20 4.5-13 8.5 8.5L4 20Z" />
      <path d="m13 7 1-3" />
      <path d="m17 11 3-1" />
      <path d="m15 4 1 1" />
      <path d="m20 6-1 1" />
    </>
  ),
  calendar: (
    <>
      <path d="M7 3v3" />
      <path d="M17 3v3" />
      <path d="M4 8h16" />
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M8 12h3" />
      <path d="M8 16h6" />
    </>
  ),
  classmate: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M14.5 15.5a4.5 4.5 0 0 1 6 3.5" />
    </>
  ),
  doctor: (
    <>
      <path d="M12 7v10" />
      <path d="M7 12h10" />
      <path d="M7.5 4.5h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3Z" />
    </>
  ),
  briefcase: (
    <>
      <path d="M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M3 12h18" />
      <path d="M12 12v2" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
};

export function ScenarioIcon({ name, className = "h-5 w-5" }: ScenarioIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {iconPaths[name]}
    </svg>
  );
}
