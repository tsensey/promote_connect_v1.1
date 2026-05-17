"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, Menu, MessageSquare, CalendarDays } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNotificationState } from "@/lib/notification-context";
import { NotificationDropdown } from "./NotificationDropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { LocaleToggle } from "@/components/ui/locale-toggle";
import { UserBreadcrumb } from "@/components/ui/breadcrumb-nav";
import { useTranslation } from '@/lib/i18n';

export function UserTopbar({
  onToggleSidebar,
  user,
  onSignOut,
}: {
  collapsed: boolean;
  onToggleSidebar: () => void;
  user: { name: string; email?: string; role: string; avatar?: string } | null;
  onSignOut: () => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const { unreadMessages } = useNotificationState();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 items-center justify-between gap-4 px-4 sm:px-6 xl:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleSidebar}
            className="xl:hidden"
          >
            <Menu className="size-4" />
          </Button>
          <UserBreadcrumb className="hidden min-w-0 sm:flex" />
        </div>

        <div className="flex items-center gap-1.5">
          <LocaleToggle />
          <ModeToggle />
          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden rounded-full text-muted-foreground hover:text-foreground sm:inline-flex"
            onClick={() => router.push("/chat")}
          >
            <MessageSquare className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden rounded-full text-muted-foreground hover:text-foreground sm:inline-flex"
            onClick={() => router.push("/agenda")}
          >
            <CalendarDays className="size-4" />
          </Button>
          <NotificationDropdown />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="h-auto rounded-full px-2 py-1 hover:bg-muted/60"
                />
              }
            >
              <Avatar className="size-7 border-2 border-border/50">
                {user?.avatar ? (
                  <AvatarImage src={user.avatar} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                  {user?.name?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="max-w-[8rem] truncate text-sm font-medium text-foreground">
                  {user?.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {user?.role === "exposant" ? t('layout.topbar.exposant') : t('layout.topbar.visiteur')}
                </p>
              </div>
              <ChevronDown className="hidden size-3.5 text-muted-foreground md:block" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl p-1">
              <DropdownMenuLabel className="px-3 py-2">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {user?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push("/app")}
                className="rounded-lg"
              >
                {t('layout.topbar.home')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/support")}
                className="rounded-lg"
              >
                {t('layout.topbar.support')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onSignOut}
                className="rounded-lg text-destructive focus:text-destructive"
              >
                {t('layout.topbar.signout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
