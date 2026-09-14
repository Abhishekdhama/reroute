import type { ComponentType, SVGProps } from "react";
import {
  ActivityIcon,
  GraphIcon,
  OverviewIcon,
  RiskIcon,
  SettingsIcon,
  TasksIcon,
} from "@/components/ui/icons";

export interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Overview", description: "Release health and what to do next", icon: OverviewIcon },
  { href: "/risks", label: "Risks", description: "Ranked delivery risks and interventions", icon: RiskIcon },
  { href: "/dependencies", label: "Dependencies", description: "Dependency graph and blast radius", icon: GraphIcon },
  { href: "/tasks", label: "Tasks", description: "All work in the release", icon: TasksIcon },
  { href: "/activity", label: "Activity", description: "Updates and reassessments", icon: ActivityIcon },
  { href: "/settings", label: "Settings", description: "API connection and workspace", icon: SettingsIcon },
];
