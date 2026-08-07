#!/usr/bin/env tsx

/**
 * Script to generate OpenAPI spec from Zod schemas registered in routes
 *
 * This script imports all route files to trigger registration, then generates openapi.json
 *
 * Usage:
 *   npm run generate-openapi
 *   or
 *   tsx src/lib/openapi/scripts/generate-openapi-from-zod.ts
 */
import { writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

import { generateOpenAPISpec } from './register-route';
import { registerAllSchemas } from './register-schemas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Import route registration file to trigger OpenAPI registration
 */
async function importRouteFiles() {
  const projectRoot = join(__dirname, '../../../../');
  const routesIndexPath = join(projectRoot, 'src/app/api/_routes/index.ts');

  try {
    // Import the central routes index file which imports all route files
    await import(routesIndexPath);
    console.log('✓ Imported route registrations');
  } catch (error) {
    console.warn('⚠ Could not import route registrations:', error);
  }
}

/**
 * Generate OpenAPI spec from registered routes
 */
async function generateOpenApiFromZod() {
  const projectRoot = join(__dirname, '../../../../');
  const outputPath = join(projectRoot, 'src/lib/openapi.json');

  console.log('Registering all schemas...');
  registerAllSchemas();

  console.log('Importing route files to register OpenAPI routes...');
  await importRouteFiles();

  console.log('Generating OpenAPI spec from registered schemas...');
  const spec = generateOpenAPISpec();

  // Use the generated spec directly from Zod
  // This ensures $ref is properly used in paths
  // Note: If you have other routes not using Zod, you may need to merge them separately
  writeFileSync(outputPath, JSON.stringify(spec, null, 2), 'utf-8');
  console.log(`✓ Generated OpenAPI spec: ${outputPath}`);
}

// Run if executed directly (cross-platform check)
const isMainModule = (() => {
  try {
    const currentFile = fileURLToPath(import.meta.url);
    const scriptFile = process.argv[1] ? resolve(process.argv[1]) : '';
    const normalizePath = (p: string) => p.replace(/\\/g, '/').toLowerCase();
    return normalizePath(currentFile) === normalizePath(scriptFile);
  } catch {
    return true; // Fallback: always run
  }
})();

if (isMainModule) {
  generateOpenApiFromZod().catch((error) => {
    console.error('Error generating OpenAPI spec:', error);
    process.exit(1);
  });
}
