// Types for route generator

export interface RouteInfo {
  key: string;
  router: string;
  filePath: string;
  pattern: string;
  private: boolean | undefined;
}

export interface RouteConfig {
  router: string | ((...args: (string | number)[]) => string);
  filePath: string;
  pattern: string;
  private: boolean | undefined;
}

export interface GroupConfig {
  [key: string]: boolean | undefined;
}

export interface ScanOptions {
  appPath: string;
  groupConfig: GroupConfig;
}

export interface GeneratorOptions {
  outputDir: string;
  routes: Record<string, RouteInfo>;
}

export type RouteType = 'static' | 'dynamic' | 'catch-all' | 'optional-catch-all';

export interface RoutePattern {
  type: RouteType;
  params: string[];
  pattern: string;
}
