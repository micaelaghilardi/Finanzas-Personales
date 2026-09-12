import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

const iconProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const links = [
  {
    to: "/",
    label: "Inicio",
    icon: (
      <svg {...iconProps}>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    to: "/movimientos",
    label: "Movimientos",
    icon: (
      <svg {...iconProps}>
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="18" x2="14" y2="18" />
      </svg>
    ),
  },
  {
    to: "/presupuestos",
    label: "Presupuestos",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M16 6V4H8v2" />
      </svg>
    ),
  },
  {
    to: "/objetivos",
    label: "Objetivos",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="4.5" />
        <circle cx="12" cy="12" r="0.8" fill="currentColor" />
      </svg>
    ),
  },
];

export function BottomNav() {
  return (
    <div className="flex-none h-[78px] bg-surface border-t border-border flex items-center justify-around relative pb-1.5">
      {links.slice(0, 2).map((link) => (
        <NavItem key={link.to} {...link} />
      ))}

      <NavLink
        to="/agregar"
        className="w-[52px] h-[52px] rounded-full bg-sage flex items-center justify-center text-white -mt-8 shadow-[0_6px_14px_oklch(0.6_0.06_150_/_0.35)]"
      >
        <svg
          width={24}
          height={24}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </NavLink>

      {links.slice(2).map((link) => (
        <NavItem key={link.to} {...link} />
      ))}
    </div>
  );
}

function NavItem({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 ${
          isActive ? "text-sage" : "text-ink-soft"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {icon}
          <span className={`text-[11px] ${isActive ? "font-semibold" : ""}`}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}
