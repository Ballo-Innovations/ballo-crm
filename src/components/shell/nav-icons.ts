import {
  BarChart3,
  Building2,
  CalendarDays,
  FileSignature,
  Kanban,
  LayoutDashboard,
  Lightbulb,
  Settings,
  Target,
  type LucideIcon,
} from "lucide-react";

/** Icons live here (not in site.ts) so the nav config stays serialisable. */
export const NAV_ICONS: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/pipeline": Kanban,
  "/accounts": Building2,
  "/leads": Target,
  "/forecast": BarChart3,
  "/engagement": CalendarDays,
  "/contracts": FileSignature,
  "/intelligence": Lightbulb,
  "/settings": Settings,
};
