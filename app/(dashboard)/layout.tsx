'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useTranslation } from '@/lib/i18n';
import { UserSidebar } from '@/components/layout/UserSidebar';
import { UserTopbar } from '@/components/layout/UserTopbar';
import { cn } from '@/lib/utils';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { user, profile, exposant, signOut, loading } = useAuth();
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
      return;
    }
  }, [loading, profile?.role, router, user]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  const role = profile?.role === 'exposant' ? 'exposant' : 'visiteur';

  const sidebarUser = {
    name: (profile?.role === 'exposant' && exposant?.nom)
      ? exposant.nom
      : (profile?.full_name || user.email?.split('@')[0] || t('common.participant')),
    company: (profile?.role === 'exposant' && exposant?.nom)
      ? exposant.nom
      : (profile?.company || undefined),
    avatar: ((profile?.role === 'exposant' && exposant?.logo_url)
      ? exposant.logo_url
      : profile?.avatar_url) ?? undefined,
  };

  return (
    <div className="min-h-screen">
      <UserSidebar
        role={role}
        collapsed={collapsed}
        onToggle={() => setCollapsed((current) => !current)}
        user={sidebarUser}
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
              onNavigate={() => setMobileOpen(false)}
              user={sidebarUser}
              onSignOut={handleSignOut}
              onItemClick={() => setMobileOpen(false)}
              mobile
            />
          </div>
        </div>
      )}

      <div
        className={cn(
          'transition-[margin-left] duration-300 ease-in-out xl:ml-64',
          collapsed && 'xl:ml-24'
        )}
      >
        <UserTopbar
          collapsed={collapsed}
          onToggleSidebar={() => setMobileOpen(true)}
          user={{
            name: sidebarUser.name,
            email: user.email || undefined,
            role,
            avatar: sidebarUser.avatar,
          }}
          onSignOut={handleSignOut}
        />

        <main className="px-4 pt-6 sm:px-6 xl:px-8">
          <Suspense fallback={
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          }>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
