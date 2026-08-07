// Route scanner class for discovering routes in app directory
import fs from 'fs';
import path from 'path';

import {
  GROUPS_ROUTER_CONFIG,
  SKIP_EXTENSIONS,
  SKIP_ITEMS,
  SKIP_PATTERNS,
} from '../config/generator.config';
import type { GroupConfig, RouteInfo, ScanOptions } from '../types/route-generator.types';
import { RoutePatternUtil } from '../utils/route-pattern.util';

export class RouteScanner {
  private groupConfig: GroupConfig;
  private routes: Record<string, RouteInfo> = {};

  constructor(private options: ScanOptions) {
    this.groupConfig = options.groupConfig || GROUPS_ROUTER_CONFIG;
  }

  /**
   * Scan directory for routes
   */
  scanRoutes(): Record<string, RouteInfo> {
    this.routes = {};
    this.scanDirectory(this.options.appPath, '', this.options.appPath, false);
    return this.routes;
  }

  /**
   * Check if path is a directory
   */
  private isDirectory(dirPath: string): boolean {
    try {
      return fs.statSync(dirPath).isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Check if item should be skipped
   */
  private shouldSkipItem(item: string, fullPath: string): boolean {
    // Skip non-directories
    if (!this.isDirectory(fullPath)) {
      return true;
    }

    // Skip items matching patterns
    for (const pattern of SKIP_PATTERNS) {
      if (item.startsWith(pattern)) {
        return true;
      }
    }

    // Skip specific items
    if (SKIP_ITEMS.includes(item as any)) {
      return true;
    }

    // Skip items with specific extensions
    for (const ext of SKIP_EXTENSIONS) {
      if (item.endsWith(ext)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get group configuration for a path
   */
  private getGroupConfigForPath(relativePath: string): boolean | undefined {
    const pathParts = relativePath.split(path.sep);

    for (const part of pathParts) {
      if (part.startsWith('(') && part.endsWith(')') && this.groupConfig.hasOwnProperty(part)) {
        return this.groupConfig[part];
      }
    }

    return undefined;
  }

  /**
   * Check if item is a group folder
   */
  private isGroupFolder(item: string): boolean {
    return item.startsWith('(') && item.endsWith(')') && this.groupConfig.hasOwnProperty(item);
  }

  /**
   * Scan directory recursively
   */
  private scanDirectory(
    dirPath: string,
    urlPath: string,
    appPath: string,
    isInsideGroup: boolean,
  ): void {
    try {
      const items = fs.readdirSync(dirPath);
      const relativePath = path.relative(appPath, dirPath);

      // Check for page.tsx file in current directory
      const pageFile = path.join(dirPath, 'page.tsx');
      if (fs.existsSync(pageFile)) {
        // Only add route if:
        // 1. Is root (app/page.tsx)
        // 2. Or currently inside a group folder
        if (relativePath === '' || isInsideGroup) {
          this.addRoute(urlPath, relativePath);
        }
      }

      // Process subdirectories
      for (const item of items) {
        const fullPath = path.join(dirPath, item);

        if (this.shouldSkipItem(item, fullPath)) {
          continue;
        }

        const isGroupFolder = this.isGroupFolder(item);

        // If at root level, only allow group folders
        if (relativePath === '' && !isGroupFolder) {
          continue;
        }

        // Build URL path based on folder type
        const currentUrlPath = RoutePatternUtil.buildUrlPath(urlPath, item);

        // Continue scanning subdirectories
        this.scanDirectory(fullPath, currentUrlPath, appPath, isInsideGroup || isGroupFolder);
      }
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${dirPath}:`, error);
    }
  }

  /**
   * Add route to routes collection
   */
  private addRoute(urlPath: string, relativePath: string): void {
    const routePath = urlPath || '/';
    const routeKey = routePath;
    const filePath = relativePath || '.';
    const privateConfig = this.getGroupConfigForPath(relativePath);

    const routeInfo: RouteInfo = {
      key: routeKey,
      router: RoutePatternUtil.generateRouterFunction(routePath),
      filePath: filePath,
      pattern: RoutePatternUtil.analyzeRoute(routePath).pattern,
      private: privateConfig,
    };

    this.routes[routeKey] = routeInfo;
  }
}
