import { t } from "@/i18n/t";
import {
  CalendarTabIcon,
  InfoIcon,
  MusicIcon,
  FlameIcon,
  UserIcon,
} from "@/components/ui/icons";
import type { ComponentType, SVGProps } from "react";

export interface NavItem {
  key: string;
  href: string;
  label: string; // top-nav label
  tabLabel: string; // compact bottom-tab label
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  /** Path prefixes that should mark this item active. */
  match: string[];
}

/** Primary navigation, shared by the desktop top nav and mobile bottom tabs. */
export const NAV_ITEMS: NavItem[] = [
  { key: "bolos", href: "/bolos", label: t.nav.bolos, tabLabel: t.tabs.bolos, icon: CalendarTabIcon, match: ["/bolos", "/reunions"] },
  { key: "colla", href: "/colla", label: t.nav.colla, tabLabel: t.tabs.colla, icon: InfoIcon, match: ["/colla", "/membres"] },
  { key: "musica", href: "/musica", label: t.nav.musica, tabLabel: t.tabs.musica, icon: MusicIcon, match: ["/musica"] },
  { key: "foc", href: "/foc", label: t.nav.foc, tabLabel: t.tabs.foc, icon: FlameIcon, match: ["/foc"] },
  { key: "perfil", href: "/perfil", label: t.nav.perfil, tabLabel: t.tabs.perfil, icon: UserIcon, match: ["/perfil"] },
];

export function isActive(item: NavItem, pathname: string): boolean {
  return item.match.some((p) => pathname === p || pathname.startsWith(p + "/"));
}
