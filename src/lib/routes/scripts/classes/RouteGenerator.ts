// Main route generator class
import path from 'path';
import { fileURLToPath } from 'url';

import { GROUPS_ROUTER_CONFIG } from '../config/generator.config';
import type { RouteInfo } from '../types/route-generator.types';
import { FileGenerator } from './FileGenerator';
import { RouteScanner } from './RouteScanner';

export class RouteGenerator {
  private appPath: string;
  private outputDir: string;

  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    this.appPath = path.join(__dirname, '../../../../app');
    this.outputDir = path.join(__dirname, '../../../../lib/routes');
  }

  /**
   * Generate routes and create files
   */
  async generate(): Promise<Record<string, RouteInfo>> {
    try {
      // Scan for routes
      const scanner = new RouteScanner({
        appPath: this.appPath,
        groupConfig: GROUPS_ROUTER_CONFIG,
      });

      const routes = scanner.scanRoutes();

      // Generate files
      const generator = new FileGenerator({
        outputDir: this.outputDir,
        routes,
      });

      await generator.generateFiles();

      return routes;
    } catch (error) {
      console.error('❌ Error generating routes:', error);
      throw error;
    }
  }

  /**
   * Set custom app path
   */
  setAppPath(appPath: string): this {
    this.appPath = appPath;
    return this;
  }

  /**
   * Set custom output directory
   */
  setOutputDir(outputDir: string): this {
    this.outputDir = outputDir;
    return this;
  }
}
