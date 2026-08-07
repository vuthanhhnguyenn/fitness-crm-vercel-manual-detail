# API Development Guide

Guide for creating new APIs with automatic OpenAPI documentation from Zod schemas.

## Overview

The system uses:

- **Zod** for validation and type inference
- **@asteasolutions/zod-to-openapi** to generate OpenAPI spec from Zod schemas
- **registerRoute** to register API routes with OpenAPI documentation
- **register-schemas.ts** to register all schemas in the OpenAPI registry

## Steps to Create a New API

### 1. Create Schema File

Create a schema file in `src/app/api/_schemas/` (e.g., `example.schema.ts`):

```typescript
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const ExampleRequestSchema = z
  .object({
    name: z.string().min(1).openapi({
      example: 'John Doe',
      description: 'User name',
    }),
    email: z.string().email().openapi({
      example: 'john@example.com',
      description: 'User email',
    }),
  })
  .openapi({
    title: 'ExampleRequest',
    description: 'Example request payload',
  });

export const ExampleResponseSchema = z
  .object({
    id: z.string().openapi({
      example: '123',
      description: 'Example ID',
    }),
    name: z.string().openapi({
      example: 'John Doe',
      description: 'User name',
    }),
  })
  .openapi({
    title: 'ExampleResponse',
    description: 'Example response',
  });

export { ErrorResponseSchema } from './auth.schema';

// Export types
export type ExampleRequest = z.infer<typeof ExampleRequestSchema>;
export type ExampleResponse = z.infer<typeof ExampleResponseSchema>;
```

### 2. Register Schema in register-schemas.ts

Add to `src/app/api/_scripts/register-schemas.ts`:

```typescript
import * as exampleSchemas from '../_schemas/example.schema';

// In registerAllSchemas():
registeredSchemaMap.set(
  'ExampleRequest',
  registry.register('ExampleRequest', exampleSchemas.ExampleRequestSchema),
);
registeredSchemaMap.set(
  'ExampleResponse',
  registry.register('ExampleResponse', exampleSchemas.ExampleResponseSchema),
);
```

**Note:** The name in `registry.register()` must match the `title` in schema `.openapi()`.

### 3. Create Route File

Create route file in `src/app/api/` (e.g., `src/app/api/example/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';

import {
  ErrorResponseSchema,
  type ExampleRequest,
  ExampleRequestSchema,
  type ExampleResponse,
  ExampleResponseSchema,
} from '@/app/api/_schemas/example.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

// Register OpenAPI documentation
registerRoute({
  method: 'post',
  path: '/example',
  summary: 'Create example',
  description: 'Create a new example resource',
  tags: ['Examples'],
  requestBody: {
    schema: ExampleRequestSchema,
    description: 'Example request body',
  },
  responses: [
    {
      status: 200,
      schema: ExampleResponseSchema,
      description: 'Example created successfully',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Bad request',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate with Zod
    const validationResult = ExampleRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const validatedBody: ExampleRequest = validationResult.data;

    // Your business logic
    const response: ExampleResponse = {
      id: '123',
      name: validatedBody.name,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Example error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 4. Import Route in index.ts

Add import to `src/app/api/_routes/index.ts`:

```typescript
import '@/app/api/example/route';
```

### 5. Generate OpenAPI Spec

Run:

```bash
npm run generate-openapi
```

## registerRoute Configuration

```typescript
registerRoute({
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    path: string,                    // e.g., '/crm/members/{id}'
    summary?: string,
    description?: string,
    tags?: string[],                 // e.g., ['Members']
    parameters?: Array<{             // Path/query/header parameters
        name: string,
        in: 'path' | 'query' | 'header' | 'cookie',
        required?: boolean,
        description?: string,
        schema?: ZodSchema | { type: 'string' },
    }>,
    requestBody?: {                  // For POST/PUT/PATCH
        schema: ZodSchema,
        description?: string,
    },
    query?: ZodSchema,               // Query parameters schema
    responses: Array<{
        status: number,
        schema: ZodSchema,
        description?: string,
    }>,
});
```

### Examples

**With Path Parameters:**

```typescript
registerRoute({
    method: 'get',
    path: '/crm/members/{id}',
    parameters: [
        {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Member ID',
            schema: { type: 'string' },
        },
    ],
    responses: [...],
});
```

**With Query Parameters:**

```typescript
registerRoute({
    method: 'get',
    path: '/crm/members',
    query: GetMembersQuerySchema,
    responses: [...],
});
```

## Schema Best Practices

1. Always add `.openapi()` with `title`, `description`, and `example`
2. Use `.openapi()` on each field for better documentation
3. Export types using `z.infer<typeof SchemaName>`
4. Reuse `ErrorResponseSchema` from `auth.schema.ts` for all error responses

### Query Parameters with Preprocessing

For query parameters that can be string (comma-separated) or array:

```typescript
member_type: z.preprocess(
    (val) => {
        if (val === undefined || val === null) return undefined;
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
            return val.split(',').map((s) => s.trim()).filter(Boolean);
        }
        return [val];
    },
    z.array(MemberTypeSchema).optional().openapi({
        example: ['regular', 'family'],
        description: 'Filter by member type',
    }),
),
```

## Best Practices

1. **Always validate requests** with Zod using `.safeParse()`
2. **Export types** from schemas for use in route handlers
3. **Register all schemas** in `register-schemas.ts`
4. **Import routes** in `_routes/index.ts`
5. **Run `npm run generate-openapi`** after creating new APIs
6. **Declare path parameters** explicitly with descriptions
7. **Use tags** to group related APIs (e.g., 'Members', 'Authentication')

## Examples

See real examples:

- **Auth API**: `src/app/api/auth/login/route.ts` and `src/app/api/_schemas/auth.schema.ts`
- **Members API**: `src/app/api/crm/members/route.ts` and `src/app/api/_schemas/member.schema.ts`

## Troubleshooting

**Schema not in OpenAPI spec:**

- Check if schema is registered in `register-schemas.ts`
- Ensure `title` matches the name in `registry.register()`
- Run `npm run generate-openapi` again

**Path parameters not recognized:**

- Declare explicitly in `parameters` array
- Ensure path format is `{paramName}` (e.g., `/crm/members/{id}`)
