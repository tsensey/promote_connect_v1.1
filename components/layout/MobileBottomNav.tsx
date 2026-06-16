"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Rss,
  Users,
  MessageSquare,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useNotificationState } from "@/lib/notification-context";
import { Badge } from "@/components/ui/badge";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { unreadMessages } = useNotificationState();

  const navItems = [
    { label: t("layout.sidebar.home"), href: "/app", icon: LayoutDashboard },
    { label: t("layout.sidebar.feed"), href: "/feed", icon: Rss },
    { label: t("layout.sidebar.network"), href: "/annuaire", icon: Users },
    {
      label: t("layout.sidebar.messages"),
      href: "/chat",
      icon: MessageSquare,
      badge: unreadMessages > 0,
    },
    { label: t("layout.sidebar.agenda"), href: "/agenda", icon: CalendarDays },
  ];

  function isItemActive(currentPath: string, href: string) {
    return (
      currentPath === href || (href !== "/app" && currentPath.startsWith(href))
    );
  }

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background lg:hidden"
      style={{ paddingBottom: 'calc(max(env(safe-area-inset-bottom), 0px) + 20px)' }}
    >
      <div className="flex h-[70px] items-center justify-around px-2">
        {navItems.map((item) => {
          const active = isItemActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={cn("size-5 shrink-0", active && "fill-primary/20")} />
                {item.badge && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-3 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold"
                  >
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </Badge>
                )}
              </div>
              <span
                className={cn(
                  "text-[9px] font-medium transition-all text-center px-0.5 leading-[1.1] line-clamp-2 max-w-full",
                  active ? "font-semibold" : "",
                )}
              >
                {item.label}
              </span>
              {active && (
                <span className="absolute -top-[1px] left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
