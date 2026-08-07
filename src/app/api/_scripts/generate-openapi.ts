#!/usr/bin/env tsx

/**
 * Script to generate OpenAPI spec from Next.js API routes
 *
 * This script scans all API routes in src/app/api and generates/updates openapi.json
 *
 * Usage:
 *   npm run generate-openapi
 *   or
 *   tsx src/lib/openapi/scripts/generate-openapi.ts
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Extract HTTP methods from route file
 */
function extractMethods(filePath: string): string[] {
  const content = readFileSync(filePath, 'utf-8');
  const methods: string[] = [];

  if (content.includes('export async function GET')) methods.push('GET');
  if (content.includes('export async function POST')) methods.push('POST');
  if (content.includes('export async function PUT')) methods.push('PUT');
  if (content.includes('export async function PATCH')) methods.push('PATCH');
  if (content.includes('export async function DELETE')) methods.push('DELETE');

  return methods;
}

/**
 * Convert file path to OpenAPI path
 */
function filePathToOpenApiPath(filePath: string, baseDir: string): string {
  // Remove base directory and file extension
  let path = filePath
    .replace(baseDir, '')
    .replace(/\/route\.ts$/, '')
    .replace(/\/route\.tsx$/, '');

  // Convert [id] to {id}
  path = path.replace(/\[([^\]]+)\]/g, '{$1}');

  // Ensure it starts with /
  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  return path;
}

/**
 * Generate OpenAPI spec from routes
 */
async function generateOpenApiSpec() {
  const projectRoot = join(__dirname, '../../../../');
  const apiDir = join(projectRoot, 'src/app/api');
  const outputPath = join(projectRoot, 'src/lib/openapi.json');

  // Read existing spec or create base structure
  let spec: any = {
    openapi: '3.0.0',
    info: {
      title: 'Fitness CRM API',
      version: '1.0.0',
      description: 'API documentation for Fitness CRM system',
    },
    servers: [
      {
        url: '/api',
        description: 'Local development server',
      },
    ],
    paths: {},
    components: {
      schemas: {},
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  };

  // Load existing spec if it exists
  if (existsSync(outputPath)) {
    try {
      const existingContent = readFileSync(outputPath, 'utf-8');
      spec = JSON.parse(existingContent);
      console.log('✓ Loaded existing openapi.json');
    } catch {
      console.warn('⚠ Could not parse existing openapi.json, creating new one');
    }
  }

  // Find all route files recursively
  function findRouteFiles(dir: string, baseDir: string): string[] {
    const files: string[] = [];
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...findRouteFiles(fullPath, baseDir));
        } else if (entry.isFile() && entry.name === 'route.ts') {
          files.push(fullPath);
        }
      }
    } catch {
      // Ignore errors for directories we can't read
    }
    return files;
  }

  const routeFiles = findRouteFiles(apiDir, apiDir);
  console.log(`Found ${routeFiles.length} route files`);

  // Process each route file
  for (const filePath of routeFiles) {
    const methods = extractMethods(filePath);
    if (methods.length === 0) continue;

    const openApiPath = filePathToOpenApiPath(filePath, apiDir);

    // Skip openapi.json endpoint itself
    if (openApiPath === '/openapi.json') {
      console.log(`  Skipping: ${openApiPath} (meta endpoint)`);
      continue;
    }

    console.log(`  Processing: ${openApiPath} [${methods.join(', ')}]`);

    // Initialize path if not exists
    if (!spec.paths[openApiPath]) {
      spec.paths[openApiPath] = {};
    }

    // Add methods (preserve existing definitions if they exist)
    for (const method of methods) {
      const methodLower = method.toLowerCase();

      // Only add if doesn't exist or is empty
      if (!spec.paths[openApiPath][methodLower]) {
        spec.paths[openApiPath][methodLower] = {
          tags: extractTags(openApiPath),
          summary: `${method} ${openApiPath}`,
          description: `Auto-generated from ${filePath.replace(projectRoot, '')}`,
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        };

        // Add request body for POST/PUT/PATCH
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
          spec.paths[openApiPath][methodLower].requestBody = {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          };
        }

        // Add path parameters if dynamic route
        const pathParams = extractPathParams(openApiPath);
        if (pathParams.length > 0) {
          spec.paths[openApiPath][methodLower].parameters = pathParams.map((param) => ({
            name: param,
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
            description: `${param} parameter`,
          }));
        }
      }
    }
  }

  // Ensure Error schema exists
  if (!spec.components.schemas.Error) {
    spec.components.schemas.Error = {
      type: 'object',
      properties: {
        error: {
          type: 'string',
        },
      },
    };
  }

  // Write updated spec
  writeFileSync(outputPath, JSON.stringify(spec, null, 2), 'utf-8');
  console.log(`\n✓ Generated openapi.json at ${outputPath}`);
  console.log(`  Total paths: ${Object.keys(spec.paths).length}`);
}

/**
 * Extract tags from path
 */
function extractTags(path: string): string[] {
  const parts = path.split('/').filter(Boolean);
  if (parts.length > 0) {
    return [parts[0].charAt(0).toUpperCase() + parts[0].slice(1)];
  }
  return ['API'];
}

/**
 * Extract path parameters from OpenAPI path
 */
function extractPathParams(path: string): string[] {
  const matches = path.match(/\{([^}]+)\}/g);
  return matches ? matches.map((m) => m.replace(/[{}]/g, '')) : [];
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateOpenApiSpec()
    .then(() => {
      console.log('\n✓ OpenAPI spec generation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Error generating OpenAPI spec:', error);
      process.exit(1);
    });
}

export { generateOpenApiSpec };
