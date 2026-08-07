// Configuration for route generator
import type { GroupConfig } from '../types/route-generator.types';

export const GROUPS_ROUTER_CONFIG: GroupConfig = {
  '(public)': false,
  '(private)': true,
  '(shared)': undefined,
  '(equipment-management)': true,
};

export const SKIP_PATTERNS = [
  '_', // Private folders
  '@', // Parallel routes
  '(.', // Intercepting routes
] as const;

export const SKIP_ITEMS = [
  'api', // API routes
  'globals.css', // Global CSS files
] as const;

export const SKIP_EXTENSIONS = ['.css', '.js', '.ts', '.tsx', '.jsx'] as const;

export const OUTPUT_FILES = {
  CONFIG: 'routes.config.ts',
  TYPES: 'routes.type.ts',
  UTILS: 'routes.util.ts',
} as const;
