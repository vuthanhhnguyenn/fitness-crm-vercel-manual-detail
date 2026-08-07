import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import type { ZodSchema } from 'zod';

import { registeredSchemaMap } from './register-schemas';
import { registry } from './registry';

/**
 * Helper to extract refId from schema's openapi metadata
 */
function getSchemaRefId(schema: ZodSchema): string | undefined {
  // Try to get refId from openapi metadata
  const metadata = (schema as any)._def?.openapi;
  if (metadata?.refId) {
    return metadata.refId;
  }
  // Try to get title from openapi metadata
  if (metadata?.title) {
    return metadata.title;
  }
  return undefined;
}

/**
 * Helper to get registered schema if it exists
 * This ensures schemas use $ref instead of being inline
 */
function getRegisteredSchema(schema: ZodSchema): ZodSchema {
  const refId = getSchemaRefId(schema);
  if (refId && registeredSchemaMap.has(refId)) {
    // Use the registered schema which will generate $ref
    return registeredSchemaMap.get(refId)!;
  }
  // If not registered yet, register it now
  if (refId) {
    const registered = registry.register(refId, schema);
    registeredSchemaMap.set(refId, registered);
    return registered;
  }
  return schema;
}

/**
 * Register an API route with OpenAPI documentation
 */
export function registerRoute(config: {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  path: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: Array<{
    name: string;
    in: 'path' | 'query' | 'header' | 'cookie';
    required?: boolean;
    description?: string;
    schema?: ZodSchema | { type: string; enum?: string[] };
  }>;
  requestBody?: {
    schema: ZodSchema;
    description?: string;
  };
  query?: ZodSchema;
  responses: {
    status: number;
    schema?: ZodSchema;
    description?: string;
  }[];
  security?: Array<Record<string, string[]>>;
}) {
  const method = config.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';

  // Build request object
  const request: any = {};

  if (config.requestBody) {
    // Use registered schema to ensure $ref is used
    const schema = getRegisteredSchema(config.requestBody.schema);
    request.body = {
      content: {
        'application/json': {
          schema,
        },
      },
      description: config.requestBody.description,
    };
  }

  if (config.query) {
    // Use registered schema to ensure $ref is used
    const querySchema = getRegisteredSchema(config.query);
    request.query = querySchema;
  }

  const requestObj = Object.keys(request).length > 0 ? request : undefined;

  // Build responses
  const responses: Record<string, any> = {};
  config.responses.forEach((response) => {
    if (response.schema) {
      const schema = getRegisteredSchema(response.schema);
      responses[String(response.status)] = {
        description: response.description || `Response ${response.status}`,
        content: {
          'application/json': {
            schema,
          },
        },
      };
      return;
    }

    responses[String(response.status)] = {
      description: response.description || `Response ${response.status}`,
    };
  });

  // Build parameters
  let parameters:
    | Array<{
        name: string;
        in: 'path' | 'query' | 'header' | 'cookie';
        required: boolean;
        description?: string;
        schema: ZodSchema | { type: string; enum?: string[] };
      }>
    | undefined;

  // If parameters are explicitly provided, use them
  if (config.parameters) {
    parameters = config.parameters.map((param) => ({
      name: param.name,
      in: param.in,
      required: param.required !== false,
      description: param.description,
      schema: param.schema || { type: 'string' },
    }));
  } else {
    // Auto-detect path parameters from path string
    if (config.path.includes('{')) {
      const pathParamMatches = config.path.match(/\{([^}]+)\}/g);
      if (pathParamMatches) {
        parameters = pathParamMatches.map((match) => {
          const paramName = match.replace(/[{}]/g, '');
          return {
            name: paramName,
            in: 'path' as const,
            required: true,
            description: `${paramName} parameter`,
            schema: { type: 'string' },
          };
        });
      }
    }
  }

  // Register path using registerPath method
  registry.registerPath({
    method,
    path: config.path,
    summary: config.summary,
    description: config.description,
    tags: config.tags || [],
    ...(parameters && parameters.length > 0 && { parameters }),
    ...(requestObj && { request: requestObj }),
    responses,
    ...(config.security && { security: config.security }),
  });
}

/**
 * Generate OpenAPI spec from registered routes
 */
export function generateOpenAPISpec() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
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
  });
}
