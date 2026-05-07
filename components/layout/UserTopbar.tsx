"use client";

import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Menu,
  MessageSquare,
  Search,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export function UserTopbar({
  onToggleSidebar,
  user,
  onSignOut,
}: {
  collapsed: boolean;
  onToggleSidebar: () => void;
  user: { name: string; email?: string; role: string } | null;
  onSignOut: () => void;
}) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-20  items-center justify-between gap-4 px-4 sm:px-6 xl:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleSidebar}
            className="xl:hidden"
          >
            <Menu className="size-4" />
          </Button>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">
              Reseau professionnel
            </p>
            <div className="mt-1 flex items-center gap-2">
              <h1 className="truncate text-2xl text-foreground">
                PROMOTE-CONNECT
              </h1>
              <Badge
                variant="secondary"
                className="hidden rounded-full sm:inline-flex"
              >
                {user?.role === "exposant" ? "Exposant" : "Visiteur"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="hidden flex-1 justify-center lg:flex">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un exposant, une entreprise, un secteur..."
              className="h-12 rounded-full border-white/70 bg-white/90 pl-11 shadow-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden rounded-full sm:inline-flex"
            onClick={() => router.push("/chat")}
          >
            <MessageSquare className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden rounded-full sm:inline-flex"
            onClick={() => router.push("/agenda")}
          >
            <CalendarDays className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative rounded-full"
          >
            <Bell className="size-4" />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="h-auto rounded-full px-2 py-1.5"
                />
              }
            >
              <Avatar className="size-10 border border-border/70">
                <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                  {user?.name?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="max-w-[10rem] truncate text-sm font-semibold">
                  {user?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.role === "exposant" ? "Exposant" : "Visiteur"}
                </p>
              </div>
              <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl">
              <DropdownMenuLabel>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/app")}>
                Accueil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/support")}>
                Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onSignOut}
                className="text-destructive"
              >
                Deconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
