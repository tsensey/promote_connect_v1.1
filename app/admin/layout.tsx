'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminTopbar } from '@/components/layout/AdminTopbar';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut, loading } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (profile?.role && profile.role !== 'admin') {
      router.replace('/app');
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
          <div className="size-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="text-sm text-muted-foreground">{t('admin.layout.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((current) => !current)}
      />

      {mobileOpen && (
          <div className="fixed inset-0 z-50 bg-sidebar/80 xl:hidden" onClick={() => setMobileOpen(false)}>
          <div
            className="h-full w-[86%] max-w-sm bg-sidebar"
            onClick={(event) => event.stopPropagation()}
          >
            <AdminSidebar collapsed={false} onToggle={() => setMobileOpen(false)} onNavigate={() => setMobileOpen(false)} mobile />
          </div>
        </div>
      )}

      <div
        className={cn(
          'transition-[margin-left] duration-300 ease-in-out xl:ml-64',
          collapsed && 'xl:ml-24'
        )}
      >
        <AdminTopbar
          collapsed={collapsed}
          onToggleSidebar={() => setMobileOpen(true)}
          user={{
            name: profile?.full_name || user.email?.split('@')[0] || t('admin.dashboard.default_user'),
            email: user.email || undefined,
          }}
          onSignOut={handleSignOut}
        />

        <main className="px-4 pb-8 pt-6 sm:px-6 xl:px-8">{children}</main>
      </div>
    </div>
  );
}
