import { AuthUserProvider } from '@/contexts/auth-user.context';

import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthUserProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex h-screen min-w-[375px] flex-col overflow-hidden">
          <AppHeader />
          <main className="bg-muted/40 flex-1 overflow-y-auto">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </AuthUserProvider>
  );
}
