import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const OverviewIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2" y="2.5" width="5" height="5" rx="1" />
    <rect x="9" y="2.5" width="5" height="3" rx="1" />
    <rect x="2" y="9.5" width="5" height="4" rx="1" />
    <rect x="9" y="7.5" width="5" height="6" rx="1" />
  </Icon>
);

export const RiskIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 2.6 14 13H2L8 2.6Z" />
    <path d="M8 6.6v3" />
    <path d="M8 11.4h.01" />
  </Icon>
);

export const GraphIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="3.4" cy="8" r="1.7" />
    <circle cx="12.6" cy="4" r="1.7" />
    <circle cx="12.6" cy="12" r="1.7" />
    <path d="M5 7.2 11 4.7M5 8.8l6 2.5" />
  </Icon>
);

export const TasksIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 4h8M6 8h8M6 12h8" />
    <path d="M2.6 4h.01M2.6 8h.01M2.6 12h.01" />
  </Icon>
);

export const ActivityIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M1.5 8h3l2-4.5 3 9 2-4.5h3" />
  </Icon>
);

export const SettingsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2.5 4.5h11M2.5 11.5h11" />
    <circle cx="6" cy="4.5" r="1.6" />
    <circle cx="10.5" cy="11.5" r="1.6" />
  </Icon>
);

export const SearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="7" cy="7" r="4.2" />
    <path d="m10.2 10.2 3.3 3.3" />
  </Icon>
);

export const RefreshIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M13.2 7a5.2 5.2 0 1 0-.7 3.6" />
    <path d="M13.4 3.4v3.3h-3.3" />
  </Icon>
);

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </Icon>
);

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m3.2 8.4 3 3 6.6-6.8" />
  </Icon>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6 3.5 4.5 4.5L6 12.5" />
  </Icon>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m3.5 6 4.5 4.5L12.5 6" />
  </Icon>
);

export const BlockedIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="8" cy="8" r="5.6" />
    <path d="m4.4 4.4 7.2 7.2" />
  </Icon>
);

export const ClockIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="8" cy="8" r="5.8" />
    <path d="M8 4.8V8l2.3 1.4" />
  </Icon>
);

export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 3.5v9M3.5 8h9" />
  </Icon>
);

export const MinusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 8h9" />
  </Icon>
);

export const FitIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 6V3h3M13 6V3h-3M3 10v3h3M13 10v3h-3" />
  </Icon>
);

export const CopyIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="5.5" y="5.5" width="8" height="8" rx="1.4" />
    <path d="M10.5 3H3.4A.9.9 0 0 0 2.5 4v7" />
  </Icon>
);

export const SendIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M13.5 2.5 7 9" />
    <path d="M13.5 2.5 9.4 13.5l-2.3-4.6-4.6-2.3Z" />
  </Icon>
);

export const UploadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 10.5V3" />
    <path d="M4.8 6.2 8 3l3.2 3.2" />
    <path d="M3 11v1.5A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5V11" />
  </Icon>
);

export const RerouteIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="3.2" cy="12.8" r="1.5" />
    <circle cx="12.8" cy="3.2" r="1.5" />
    <path d="M3.2 11.2V7.4A2.6 2.6 0 0 1 5.8 4.8h5.4" />
    <path d="M9.2 2.6 11.6 4.8 9.2 7" />
  </Icon>
);
