'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { UserSidebar } from '@/components/layout/UserSidebar';
import { UserTopbar } from '@/components/layout/UserTopbar';
import { cn } from '@/lib/utils';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut, loading } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (profile?.role === 'admin') {
      router.replace('/admin');
    }
  }, [loading, profile?.role, router, user]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="surface-panel flex items-center gap-3 px-6 py-5">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  const role = profile?.role === 'exposant' ? 'exposant' : 'visiteur';

  return (
    <div className="min-h-screen">
      <UserSidebar
        role={role}
        collapsed={collapsed}
        onToggle={() => setCollapsed((current) => !current)}
        user={{
          name: profile?.full_name || user.email?.split('@')[0] || 'Participant',
          company: profile?.company || undefined,
          subscription: profile?.subscription_status,
        }}
        onSignOut={handleSignOut}
      />

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 xl:hidden" onClick={() => setMobileOpen(false)}>
          <div
            className="h-full w-[86%] max-w-sm bg-sidebar"
            onClick={(event) => event.stopPropagation()}
          >
            <UserSidebar
              role={role}
              collapsed={false}
              onToggle={() => setMobileOpen(false)}
              user={{
                name: profile?.full_name || user.email?.split('@')[0] || 'Participant',
                company: profile?.company || undefined,
                subscription: profile?.subscription_status,
              }}
              onSignOut={handleSignOut}
              mobile
            />
          </div>
        </div>
      )}

      <div
        className={cn(
          'transition-all duration-300 xl:ml-72',
          collapsed && 'xl:ml-24'
        )}
      >
        <UserTopbar
          collapsed={collapsed}
          onToggleSidebar={() => setMobileOpen(true)}
          user={{
            name: profile?.full_name || user.email?.split('@')[0] || 'Participant',
            email: user.email || undefined,
            role,
          }}
          onSignOut={handleSignOut}
        />

        <main className="px-4 pb-8 pt-6 sm:px-6 xl:px-8">{children}</main>
      </div>
    </div>
  );
}
