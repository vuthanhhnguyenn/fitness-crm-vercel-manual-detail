// Utilities for route pattern processing
import type { RoutePattern } from '../types/route-generator.types';

export class RoutePatternUtil {
  /**
   * Analyze route path and determine its type and parameters
   */
  static analyzeRoute(routePath: string): RoutePattern {
    // Check for optional catch-all routes [[...param]]
    const optionalCatchAllMatch = routePath.match(/\/\[\[\.\.\.(\w+)\]\]/g);
    if (optionalCatchAllMatch) {
      const params = optionalCatchAllMatch.map((match) => match.match(/\[\[\.\.\.(\w+)\]\]/)![1]);
      return {
        type: 'optional-catch-all',
        params,
        pattern: routePath.replace(/\/\[\[\.\.\.(\w+)\]\]/g, '(/.*)?'),
      };
    }

    // Check for catch-all routes [...param]
    const catchAllMatch = routePath.match(/\/\[\.\.\.(\w+)\]/g);
    if (catchAllMatch) {
      const params = catchAllMatch.map((match) => match.match(/\[\.\.\.(\w+)\]/)![1]);
      return {
        type: 'catch-all',
        params,
        pattern: routePath.replace(/\/\[\.\.\.(\w+)\]/g, '/*'),
      };
    }

    // Check for regular dynamic routes [param]
    const dynamicMatches = routePath.match(/\/\[(\w+)\]/g);
    if (dynamicMatches) {
      const params = dynamicMatches.map((match) => match.match(/\[(\w+)\]/)![1]);
      return {
        type: 'dynamic',
        params,
        pattern: routePath.replace(/\/\[(\w+)\]/g, '/:$1'),
      };
    }

    // Static route
    return {
      type: 'static',
      params: [],
      pattern: routePath,
    };
  }

  /**
   * Generate router function string based on route pattern
   */
  static generateRouterFunction(routePath: string): string {
    const pattern = this.analyzeRoute(routePath);

    switch (pattern.type) {
      case 'optional-catch-all':
      case 'catch-all':
        const paramName = pattern.params[0];
        return `(...${paramName}: (string | number)[]) => \`${routePath.replace(/\/\[\[?\.\.\.(\w+)\]\]?/, '/${' + paramName + ".join('/')}")}\``;

      case 'dynamic':
        const paramList = pattern.params.map((param) => `${param}: string | number`).join(', ');
        let templatePath = routePath;
        pattern.params.forEach((param) => {
          templatePath = templatePath.replace(`/[${param}]`, `/$\{${param}}`);
        });
        return `(${paramList}) => \`${templatePath}\``;

      case 'static':
      default:
        return `'${routePath}'`;
    }
  }

  /**
   * Build URL path from folder item
   */
  static buildUrlPath(urlPath: string, item: string): string {
    // Dynamic routes [param]
    if (item.startsWith('[') && item.endsWith(']')) {
      return urlPath + `/${item}`;
    }
    // Route groups (public), (private), (shared) - don't add to URL
    if (item.startsWith('(') && item.endsWith(')')) {
      return urlPath;
    }
    // Regular route
    return urlPath + `/${item}`;
  }
}
