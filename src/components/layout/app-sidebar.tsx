'use client';

import { Fragment } from 'react';

import { usePathname } from 'next/navigation';

import Logo from '@/assets/logo.svg';
import { useAuthUser } from '@/contexts/auth-user.context';
import { useNavigationBlocker } from '@/contexts/navigation-blocker.context';
import { canRoleAccessPage, isPageHqOnly } from '@/utils/permission.util';
import {
  Building,
  Calendar,
  CircleDollarSign,
  Home,
  LogIn,
  type LucideIcon,
  Newspaper,
  Package,
  Settings,
  UserPlus,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import type { RoutePattern } from '@/lib/routes/routes.type';
import { getRoutePattern } from '@/lib/routes/routes.util';

import { UserRole } from '@/types/permission.type';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SubItem = {
  label: string;
  href: RoutePattern;
  /** Sub-group heading within a submenu (rendered once when the group changes). */
  group?: string;
  /** Additional paths that mark this sub-item active (e.g. sibling tabs sharing the same screen). */
  matchHrefs?: RoutePattern[];
};

type MenuItem = {
  label: string;
  icon: LucideIcon;
  href: RoutePattern;
  /** Top-level section heading this item belongs to (rendered once when the section changes). */
  section?: string;
  /** Additional paths that mark this menu item active. */
  matchHrefs?: RoutePattern[];
  subItems?: SubItem[];
};

// ---------------------------------------------------------------------------
// Menu definition
// ---------------------------------------------------------------------------

const menuItems: MenuItem[] = [
  {
    label: 'ダッシュボード',
    icon: Home,
    href: '/',
  },
  {
    label: '会員管理',
    icon: Users,
    href: '/members',
    section: '日々の業務',
    subItems: [
      { label: '移籍管理', href: '/members/transfers' },
      { label: '休会・退会管理', href: '/members/leaves' },
      { label: 'ブラックリスト管理', href: '/members/blacklist' },
    ],
  },
  {
    label: '入退館管理',
    icon: LogIn,
    href: '/entry-exit',
    section: '日々の業務',
    subItems: [{ label: '入退館履歴', href: '/entry-exit/history' }],
  },
  {
    label: '入会処理',
    icon: UserPlus,
    href: getRoutePattern('/membership-applications'),
    section: '日々の業務',
    subItems: [
      {
        label: '見学・体験管理',
        href: getRoutePattern('/visit-experiences'),
      },
    ],
  },
  {
    label: '予約管理',
    icon: Calendar,
    href: getRoutePattern('/lesson-schedules'),
    section: '日々の業務',
    subItems: [
      {
        label: 'レッスン内容',
        href: getRoutePattern('/lessons'),
      },
      {
        label: 'スタジオ',
        href: getRoutePattern('/studios'),
      },
      {
        label: '指導者',
        href: getRoutePattern('/instructors'),
      },
    ],
  },
  // Remove on this phase
  // {
  //   label: '家族入会',
  //   icon: UserPlus,
  //   href: getRoutePattern('/family-registrations'),
  //   section: '日々の業務',
  //   subItems: [{ label: 'ダッシュボード', href: '/family-registrations/dashboard' }],
  // },
  {
    label: '施設設備管理',
    icon: Building,
    href: '/lockers',
    section: '日々の業務',
    subItems: [
      { label: 'ロッカー管理', href: '/lockers' },
      {
        label: '店舗機器管理',
        href: '/equipment',
        matchHrefs: ['/controllers'],
      },
      { label: 'トレーニング機材管理', href: '/training-equipment' },
    ],
  },
  {
    label: '売上管理',
    icon: CircleDollarSign,
    href: getRoutePattern('/sales'),
    section: '日々の業務',
    subItems: [
      { label: '入出金明細', href: getRoutePattern('/sales/transactions') },
      { label: '請求・未回収管理', href: '/sales/receivables' },
      { label: '返金手続き一覧', href: '/sales/refunds' },
    ],
  },
  {
    label: '商材・施策設定',
    icon: Package,
    href: '/contracts',
    section: '商材・配信',
    subItems: [
      { label: '主契約管理', href: '/contracts' },
      { label: 'オプション管理', href: '/options' },
      { label: 'キャンペーン管理', href: '/campaigns' },
      { label: 'アンケート管理', href: '/surveys' },
      { label: '手動配信通知', href: '/manual-notifications' },
    ],
  },
  {
    label: 'コンテンツ',
    icon: Newspaper,
    href: '/banners',
    section: '商材・配信',
    subItems: [
      { label: 'お知らせ管理', href: '/announcements' },
      { label: 'バナー管理', href: '/banners' },
    ],
  },
  {
    label: 'システム設定',
    icon: Settings,
    href: '/staffs',
    section: '分析・設定',
    subItems: [
      { label: 'スタッフ管理', href: '/staffs', group: '組織・店舗' },
      { label: '職位マスター管理', href: '/positions', group: '組織・店舗' },
      { label: '店舗管理', href: '/stores', group: '組織・店舗' },
      { label: 'FC企業管理', href: '/franchise-companies', group: '組織・店舗' },
      { label: 'ブランド管理', href: '/brands', group: '組織・店舗' },
      { label: 'エクササイズ管理', href: '/exercises', group: 'マスタ' },
      { label: 'ルーティン管理', href: '/routines', group: 'マスタ' },
      { label: '規約文書管理', href: '/terms', group: '規約・アプリ' },
      { label: 'アプリ配信バージョン管理', href: '/app-versions', group: '規約・アプリ' },
      { label: 'アプリメンテナンス管理', href: '/app-maintenance', group: '規約・アプリ' },
      { label: 'CRMメンテナンス管理', href: '/crm-maintenance', group: 'システム' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if the current pathname matches the given href via segment-aware
 * prefix matching (e.g. /membership-applications must not match /members), or
 * matches any of the provided extra paths.
 */
function matchesHref(pathname: string, href: RoutePattern, matchHrefs?: RoutePattern[]): boolean {
  if (pathname === href || pathname.startsWith(href + '/')) return true;
  return (
    matchHrefs?.some((extra) => pathname === extra || pathname.startsWith(extra + '/')) ?? false
  );
}

/**
 * Returns true if a sub-item is active for the current pathname (own href or matchHrefs).
 */
function checkSubActive(pathname: string, sub: SubItem): boolean {
  return matchesHref(pathname, sub.href, sub.matchHrefs);
}

/**
 * Returns true if the current pathname is under a menu item or any of its sub-items.
 * Uses segment-aware prefix matching to avoid false positives
 * (e.g. /membership-applications must not match /members).
 */
function checkItemActive(pathname: string, item: MenuItem): boolean {
  if (item.href === '/') return pathname === '/';
  if (matchesHref(pathname, item.href, item.matchHrefs)) return true;
  return item.subItems?.some((sub) => checkSubActive(pathname, sub)) ?? false;
}

/**
 * Returns true if any sub-item itself (not just the parent) matches the current pathname.
 * Used to decide whether the parent button should receive the active highlight.
 */
function checkAnySubActive(pathname: string, item: MenuItem): boolean {
  return item.subItems?.some((sub) => checkSubActive(pathname, sub)) ?? false;
}

/**
 * Returns true if the current user can access the given route pattern.
 * Returns false while the user is still loading to prevent premature access.
 * Routes not listed in PAGE_PERMISSIONS are unrestricted (always allowed once loaded).
 */
function canAccess(href: RoutePattern, role: UserRole | null, isLoading: boolean): boolean {
  if (isLoading) return false; // deny everything until we know the role
  if (href === '/' || !role) return true;
  return canRoleAccessPage(role, href as Parameters<typeof canRoleAccessPage>[1]);
}

/**
 * Pre-computes, per menu index, whether the section heading should be rendered.
 * A heading is emitted only the first time a section name appears, so items
 * without a `section` (which visually belong to the preceding group) can never
 * split a section into two headings.
 */
const showSectionLabelAt: boolean[] = (() => {
  const seen = new Set<string>();
  return menuItems.map((item) => {
    if (!item.section || seen.has(item.section)) return false;
    seen.add(item.section);
    return true;
  });
})();

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AppSidebar() {
  const pathname = usePathname();
  // Routed through the navigation-blocker registry so a dirty form can intercept
  // sidebar navigation (Next's App Router has no navigation-blocking API of its own).
  const { guardedPush } = useNavigationBlocker();
  const { user, isLoading } = useAuthUser();
  const role = (user?.role as UserRole) ?? null;

  return (
    <Sidebar className="border-sidebar-border border-r">
      <SidebarHeader className="h-14 flex-row items-center px-4 py-0">
        <Logo role="img" aria-label="Logo" className="h-7 w-auto" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="pt-0">
          <SidebarGroupContent>
            {isLoading ? (
              <div className="space-y-0.5 p-2">
                {menuItems.map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-md px-2 py-1.5">
                    <Skeleton className="bg-sidebar-foreground/10 h-5 w-5 shrink-0 rounded-sm" />
                    <Skeleton
                      className="bg-sidebar-foreground/10 h-3.5 rounded-sm"
                      style={{ width: `${48 + ((i * 17) % 36)}%` }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <SidebarMenu>
                {menuItems.map((item, idx) => {
                  const Icon = item.icon;
                  const active = checkItemActive(pathname, item);
                  const hasSubItems = !!item.subItems?.length;
                  const allowed = canAccess(item.href, role, isLoading);
                  // Deny reason for tooltip
                  const denyReason = isPageHqOnly(item.href)
                    ? '本部権限が必要です'
                    : 'このロールでは操作できません';

                  // Top-level section heading — rendered once per section
                  const sectionLabel = showSectionLabelAt[idx] ? (
                    <li
                      aria-hidden="true"
                      className="text-sidebar-foreground/70 px-2 pt-4 pb-1 text-xs font-medium select-none"
                    >
                      {item.section}
                    </li>
                  ) : null;

                  if (hasSubItems) {
                    const anySubActive = checkAnySubActive(pathname, item);
                    // Parent button is highlighted only when the group is active but no sub-item is
                    const parentActive = active && !anySubActive;

                    // First sub-item the current user can access (used as fallback navigation target)
                    const firstAllowedSub = item.subItems!.find((sub) =>
                      canAccess(sub.href, role, isLoading),
                    );
                    // Parent is intractable if the user can access the parent href OR any sub-item
                    const parentAllowed = allowed || !!firstAllowedSub;
                    // Navigate to parent href if allowed, otherwise fall back to first accessible sub
                    const parentTarget = allowed ? item.href : (firstAllowedSub?.href ?? item.href);

                    const parentButton = (
                      <SidebarMenuButton
                        isActive={parentActive}
                        className={
                          !parentAllowed ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                        }
                        onClick={() => parentAllowed && guardedPush(parentTarget)}
                      >
                        <Icon className="size-5" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    );

                    return (
                      <Fragment key={item.href}>
                        {sectionLabel}
                        <SidebarMenuItem>
                          {!parentAllowed ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger render={<span className="w-full" />}>
                                  {parentButton}
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  <p className="text-xs">{denyReason}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            parentButton
                          )}

                          {active && (
                            <SidebarMenuSub>
                              {item.subItems!.map((sub, subIdx) => {
                                const subActive = checkSubActive(pathname, sub);
                                const subAllowed = canAccess(sub.href, role, isLoading);
                                const subHqOnly = isPageHqOnly(sub.href);
                                const subDenyReason = subHqOnly
                                  ? '本部権限が必要です'
                                  : 'このロールでは操作できません';

                                // Sub-group heading — rendered once when the group changes
                                const showGroupLabel =
                                  !!sub.group && sub.group !== item.subItems![subIdx - 1]?.group;

                                const subButton = (
                                  <SidebarMenuSubButton
                                    isActive={subActive}
                                    className={
                                      subAllowed
                                        ? 'cursor-pointer'
                                        : 'cursor-not-allowed opacity-40'
                                    }
                                    onClick={() => subAllowed && guardedPush(sub.href)}
                                  >
                                    <span>{sub.label}</span>
                                    {/* Show "本部" badge only for HQ-only routes when access is denied */}
                                    {!subAllowed && subHqOnly && (
                                      <Badge
                                        variant="outline"
                                        className="border-sidebar-border/60 text-sidebar-foreground/70 ml-auto h-4 shrink-0 rounded-sm px-1 text-[10px]"
                                      >
                                        本部
                                      </Badge>
                                    )}
                                  </SidebarMenuSubButton>
                                );

                                return (
                                  <Fragment key={sub.href}>
                                    {showGroupLabel && (
                                      <li
                                        aria-hidden="true"
                                        className="text-sidebar-foreground/50 px-2 pt-3 pb-0.5 text-[10px] font-medium tracking-wide select-none first:pt-1"
                                      >
                                        {sub.group}
                                      </li>
                                    )}
                                    <SidebarMenuSubItem>
                                      {!subAllowed ? (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger render={<span className="w-full" />}>
                                              {subButton}
                                            </TooltipTrigger>
                                            <TooltipContent side="right">
                                              <p className="text-xs">{subDenyReason}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      ) : (
                                        subButton
                                      )}
                                    </SidebarMenuSubItem>
                                  </Fragment>
                                );
                              })}
                            </SidebarMenuSub>
                          )}
                        </SidebarMenuItem>
                      </Fragment>
                    );
                  }

                  // Leaf item (no sub-items)
                  const leafButton = (
                    <SidebarMenuButton
                      isActive={active}
                      className={!allowed ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}
                      onClick={() => allowed && guardedPush(item.href)}
                    >
                      <Icon className="size-5" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  );

                  return (
                    <Fragment key={item.href}>
                      {sectionLabel}
                      <SidebarMenuItem>
                        {!allowed ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger render={<span className="w-full" />}>
                                {leafButton}
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p className="text-xs">{denyReason}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          leafButton
                        )}
                      </SidebarMenuItem>
                    </Fragment>
                  );
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
