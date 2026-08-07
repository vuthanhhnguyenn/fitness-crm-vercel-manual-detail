'use client';

/**
 * RoleGatedMenuItem — Switches a DropdownMenuItem between normal / disabled+Badge based on role or permission flag.
 *
 * Usage (role-based):
 * ```tsx
 * <RoleGatedMenuItem allowedRoles={[UserRole.Headquarter, UserRole.System]} onClick={handleEdit}>
 *   <Pencil className="size-4" /> Edit
 * </RoleGatedMenuItem>
 * ```
 *
 * Usage (permission-based):
 * ```tsx
 * <RoleGatedMenuItem requiredPermission={Permission.StaffsDelete}>
 *   Delete
 * </RoleGatedMenuItem>
 * ```
 *
 * Access logic:
 * - allowedRoles only: allowed if the current role matches any entry
 * - requiredPermission only: allowed if the user holds the permission flag
 * - both specified: AND condition
 * - neither specified: always allowed
 *
 * When denied:
 * - Button is disabled + aria-disabled
 * - A badge (default "本部") is appended at the end; customize via denyBadge
 */
import type { ComponentProps, ReactNode } from 'react';

import { useAuthUser } from '@/contexts/auth-user.context';

import { Badge } from '@/components/ui/badge';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { cn } from '@/lib/utils';

import { Permission, UserRole } from '@/types/permission.type';

interface RoleGatedMenuItemProps extends ComponentProps<typeof DropdownMenuItem> {
  /** Roles that are allowed to perform this action */
  allowedRoles?: readonly UserRole[];
  /** Permission flag required for this action */
  requiredPermission?: Permission;
  /** Badge label shown when access is denied (default: "本部") */
  denyBadge?: string;
  /** Optional tooltip shown even when the user is allowed (e.g. to explain why the button might be disabled) */
  tooltip?: string;
  children: ReactNode;
}

export function RoleGatedMenuItem({
  allowedRoles,
  requiredPermission,
  denyBadge = '本部',
  children,
  onClick,
  className,
  disabled,
  tooltip: externalTooltip,
  ...props
}: RoleGatedMenuItemProps) {
  const { hasRole, hasPermission } = useAuthUser();

  const roleAllowed = allowedRoles ? hasRole(allowedRoles) : true;
  const permissionAllowed = requiredPermission ? hasPermission(requiredPermission) : true;
  const allowed = roleAllowed && permissionAllowed;

  // Case 1: no permission → disabled + badge, no tooltip
  // Case 2: has permission + parent disabled + tooltip → disabled + show tooltip
  // Case 3: has permission + not disabled → normal click
  const isDisabled = !allowed || !!disabled;
  const tooltipContent = allowed ? externalTooltip : null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <div
              className={cn(isDisabled && 'inline-flex cursor-not-allowed')}
              onClickCapture={
                isDisabled
                  ? (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  : undefined
              }
            />
          }
        >
          <DropdownMenuItem
            {...props}
            className={className}
            onClick={(e) => {
              if (isDisabled) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              onClick?.(e);
            }}
            disabled={isDisabled}
          >
            {children}
            {!allowed && (
              <Badge
                variant="outline"
                className="border-border text-muted-foreground ml-auto h-4 shrink-0 rounded-sm px-1 text-[9px]"
              >
                {denyBadge}
              </Badge>
            )}
          </DropdownMenuItem>
        </TooltipTrigger>
        {tooltipContent && (
          <TooltipContent>
            <p className="text-xs">{tooltipContent}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
