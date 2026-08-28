import { cookies } from 'next/headers';

import { AuthUserProvider } from '@/contexts/auth-user.context';
import { CurrentStoreProvider } from '@/contexts/current-store.context';
import { NavigationBlockerProvider } from '@/contexts/navigation-blocker.context';

import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import { CookieNames } from '@/types/global.enum';

export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const initialStoreId = cookieStore.get(CookieNames.CurrentStore)?.value;

  return (
    <AuthUserProvider>
      <CurrentStoreProvider initialStoreId={initialStoreId}>
        <NavigationBlockerProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="flex h-screen min-w-93.75 flex-col overflow-hidden">
              <AppHeader />
              <main className="bg-background flex-1 overflow-y-auto">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </NavigationBlockerProvider>
      </CurrentStoreProvider>
    </AuthUserProvider>
  );
}
