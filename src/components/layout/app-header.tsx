'use client';

import { useCallback, useState } from 'react';

import Image from 'next/image';

import { useAuthUser } from '@/contexts/auth-user.context';
import { handleLogout } from '@/utils/global.util';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Check,
  ChevronDown,
  FlaskConical,
  HelpCircle,
  LogOut,
  Settings,
  User,
} from 'lucide-react';
import Cookies from 'universal-cookie';

import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

import {
  getAuthMeQueryKey,
  getCrmUsersOptions,
  postAuthSwitchUserMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmUsersResponse } from '@/lib/api/types.gen';

import { CookieNames } from '@/types/global.enum';
import { UserRole } from '@/types/permission.type';

// ─── Role display helpers ─────────────────────────────────────────────────────

const ROLE_LABEL: Record<UserRole, string> = {
  [UserRole.System]: 'System',
  [UserRole.Headquarter]: 'Headquarter',
  [UserRole.Manager]: 'Manager',
  [UserRole.Staff]: 'Staff',
  [UserRole.Trainer]: 'Trainer',
  [UserRole.Observer]: 'Observer',
};

const ROLE_BADGE_CLASS: Record<UserRole, string> = {
  [UserRole.System]: 'bg-secondary/80 text-secondary-foreground border-secondary/20',
  [UserRole.Headquarter]: 'bg-primary/15 text-primary border-primary/20',
  [UserRole.Manager]: 'bg-info/15 text-info border-info/20',
  [UserRole.Staff]: 'bg-muted text-muted-foreground border-border',
  [UserRole.Trainer]: 'bg-success/15 text-success border-success/20',
  [UserRole.Observer]: 'bg-warning/15 text-warning border-warning/20',
};

export function AppHeader() {
  const { user, isLoading } = useAuthUser();
  const queryClient = useQueryClient();

  const role = user?.role ?? UserRole.Staff;

  // Fetch demo users lazily (enabled only when the submenu is opened)
  const [demoSubOpen, setDemoSubOpen] = useState(false);
  const { data: demoData, isLoading: demoLoading } = useQuery({
    ...getCrmUsersOptions(),
    enabled: demoSubOpen,
    staleTime: Infinity,
  });
  const demoUsers =
    (demoData as { users?: GetCrmUsersResponse['users'] } | undefined)?.users ?? null;

  const {
    mutate: switchUser,
    isPending: switching,
    variables: switchingVars,
  } = useMutation({
    ...postAuthSwitchUserMutation(),
    onSuccess: (data) => {
      new Cookies().set(CookieNames.Session, data, { path: '/' });
      queryClient.invalidateQueries({ queryKey: getAuthMeQueryKey() }).then(() => {
        window.location.reload();
      });
    },
  });

  const handleSwitchUser = useCallback(
    (targetUser: GetCrmUsersResponse['users'][number]) => {
      switchUser({ body: { user_id: targetUser.id } });
    },
    [switchUser],
  );

  return (
    <header className="bg-sidebar border-sidebar-border sticky top-0 z-30 flex h-14 w-full shrink-0 items-center justify-between gap-4 border-b px-4">
      {/* Left: Store selector */}
      <div className="border-sidebar-border/60 bg-sidebar-accent/40 hover:border-sidebar-border hover:bg-sidebar-accent flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors">
        <div className="relative h-7 w-7">
          <Image
            src={'/fitness.jpeg'}
            alt="申込写真"
            className="size-full rounded object-cover"
            fill
            sizes="(max-width: 768px) 100vw, 48px"
          />
        </div>
        <span className="text-sidebar-foreground/90 text-sm font-medium">Fit365八潮店</span>
        <ChevronDown className="text-sidebar-foreground/70 size-4 shrink-0" />
      </div>

      {/* Right: User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger className="bg-sidebar-accent/40 hover:bg-sidebar-accent flex shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors outline-none">
          {isLoading ? (
            <div className="bg-sidebar-accent size-7 animate-pulse rounded-full" />
          ) : (
            <div
              className={`bg-sidebar-accent text-sidebar-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-medium`}
            >
              {user?.name.slice(0, 2) || <User className="size-3.5" />}
            </div>
          )}
          <span className="text-sidebar-foreground/70 max-w-35 truncate text-sm">
            {isLoading ? '読み込み中...' : (user?.name ?? 'ユーザー')}
          </span>
          <ChevronDown className="text-sidebar-foreground/70 size-4 shrink-0" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64 rounded-lg shadow-lg" sideOffset={8}>
          {/* User info header — div instead of DropdownMenuLabel per prototype */}
          <div className="px-3 py-3">
            <div className="flex items-start gap-3">
              <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full">
                <span className="text-foreground text-xs font-medium">
                  {(user?.name ?? '').slice(0, 2)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user?.name}</p>
                <p className="text-muted-foreground truncate text-xs">{user?.email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  <Badge
                    variant="outline"
                    className={`h-4 rounded-sm px-1 text-[10px] ${ROLE_BADGE_CLASS[role]}`}
                  >
                    {ROLE_LABEL[role] ?? role}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-muted-foreground border-border h-4 rounded-sm px-1 text-[10px]"
                  >
                    {user?.position}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem>
            <User className="size-4" />
            プロフィール
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="size-4" />
            アカウント設定
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell className="size-4" />
            通知設定
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <HelpCircle className="size-4" />
            ヘルプ
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            ログアウト
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Demo user switcher */}
          <DropdownMenuSub onOpenChange={setDemoSubOpen}>
            <DropdownMenuSubTrigger className="text-muted-foreground">
              <FlaskConical className="size-4" />
              デモ: ユーザー切替
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-64">
              {demoLoading && (
                <div className="text-muted-foreground px-3 py-2 text-xs">読み込み中...</div>
              )}

              {demoUsers?.map((demoUser) => {
                const isActive = demoUser.id === user?.id;
                const isCurrentlySwitching =
                  switching && switchingVars?.body?.user_id === demoUser.id;
                const badgeClass =
                  ROLE_BADGE_CLASS[demoUser.role as UserRole] ?? ROLE_BADGE_CLASS[UserRole.Staff]!;
                return (
                  <DropdownMenuItem
                    key={demoUser.id}
                    disabled={!!isCurrentlySwitching}
                    onClick={() => !isActive && handleSwitchUser(demoUser)}
                  >
                    <div className="bg-muted flex size-6 shrink-0 items-center justify-center rounded-full">
                      <span className="text-foreground text-[9px] font-medium">
                        {demoUser.name.slice(0, 2)}
                      </span>
                    </div>
                    <div className="ml-1 min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{demoUser.name}</p>
                      <p className="text-muted-foreground text-[10px]">{demoUser.position}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`h-4 shrink-0 rounded-sm px-1 text-[9px] ${badgeClass}`}
                    >
                      {ROLE_LABEL[demoUser.role as UserRole] ?? demoUser.role}
                    </Badge>
                    {isActive && <Check className="text-primary ml-1 size-3 shrink-0" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <Separator className="my-1" />
          <div className="px-2 pb-2">
            <p className="text-muted-foreground/60 text-[10px]">
              デモモード — 本番環境では認証連動
            </p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
