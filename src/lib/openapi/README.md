# OpenAPI Specification Management

## Overview

The `src/lib/openapi.json` file contains the OpenAPI specification for all API endpoints in the project. This file is used to:

- Generate API client code with `@hey-api/openapi-ts`
- Display API documentation on Swagger UI (`/api-docs`)
- Enable type-safe API calls in the frontend

## Workflow for Adding New APIs

### Step 1: Create API Route

Create a route file in `src/app/api/`:

```typescript
// src/app/api/crm/stores/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Your implementation
  return NextResponse.json({ stores: [] });
}

export async function POST(request: NextRequest) {
  // Your implementation
  return NextResponse.json({ success: true });
}
```

### Step 2: Generate OpenAPI Spec

Run the script to automatically scan and update `openapi.json`:

```bash
npm run generate-openapi
```

The script will:

- ✅ Scan all `route.ts` files in `src/app/api`
- ✅ Detect HTTP methods (GET, POST, PUT, DELETE, etc.)
- ✅ Convert paths (`[id]` → `{id}`)
- ✅ Generate basic OpenAPI definitions
- ✅ **Preserve** existing definitions (does not overwrite manual edits)

### Step 3: Customize OpenAPI Spec (Optional)

If you need to add more details (schemas, examples, descriptions), edit `src/lib/openapi.json`:

```json
{
  "paths": {
    "/crm/stores": {
      "get": {
        "tags": ["Stores"],
        "summary": "Get stores list",
        "description": "Retrieve list of all stores",
        "parameters": [
          {
            "name": "page",
            "in": "query",
            "schema": { "type": "integer", "default": 1 }
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/GetStoresResponse"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "GetStoresResponse": {
        "type": "object",
        "properties": {
          "stores": {
            "type": "array",
            "items": { "$ref": "#/components/schemas/Store" }
          }
        }
      },
      "Store": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" }
        }
      }
    }
  }
}
```

### Step 4: Generate API Client

After updating `openapi.json`, generate the API client code:

```bash
npm run generate-client
```

This command will:

- ✅ Read `src/lib/openapi.json`
- ✅ Generate TypeScript types to `src/lib/api/types.gen.ts`
- ✅ Generate SDK classes to `src/lib/api/sdk.gen.ts`
- ✅ Generate React Query hooks to `src/lib/api/@tanstack/react-query.gen.ts`

### Step 5: Use Generated Hooks

Use the generated hooks in your code:

```typescript
// GET request
import { useQuery } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';

import { getCrmStoresOptions } from '@/lib/api/@tanstack/react-query.gen';
// POST request
import { postCrmStoresMutation } from '@/lib/api/@tanstack/react-query.gen';

const { data, isLoading } = useQuery(
  getCrmStoresOptions({
    query: { page: 1, limit: 10 },
  }),
);

const mutation = useMutation({
  ...postCrmStoresMutation(),
  onSuccess: (data) => {
    console.log('Success:', data);
  },
});

mutation.mutate({
  body: {
    name: 'New Store',
    address: '123 Main St',
  },
});
```

## Methods for Updating OpenAPI Spec

### Method 1: Automatic Generation (Recommended)

The script automatically scans all API routes and generates the OpenAPI spec:

```bash
npm run generate-openapi
```

The script will:

1. Scan all `route.ts` files in `src/app/api`
2. Detect HTTP methods (GET, POST, PUT, DELETE, etc.)
3. Convert file paths to OpenAPI paths (e.g., `[id]` → `{id}`)
4. Generate/update `src/lib/openapi.json`
5. Preserve existing definitions (does not overwrite manual edits)

### Method 2: Manual Update

If you want to customize in more detail, you can edit `src/lib/openapi.json` directly:

1. Open `src/lib/openapi.json`
2. Add a new endpoint to `paths`:

```json
{
  "paths": {
    "/your-new-endpoint": {
      "post": {
        "tags": ["YourTag"],
        "summary": "Your endpoint summary",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/YourRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/YourResponse"
                }
              }
            }
          }
        }
      }
    }
  }
}
```

3. Add schemas to `components.schemas` if needed

## Recommended Workflow

1. **Create a new API route** in `src/app/api/.../route.ts`
2. **Run the generate script**:
   ```bash
   npm run generate-openapi
   ```
3. **Review and customize** `src/lib/openapi.json` if needed:
   - Add detailed descriptions
   - Add request/response schemas
   - Add examples
   - Add error responses
4. **Generate API client**:
   ```bash
   npm run generate-client
   ```
5. **Use generated hooks** in your code:

   ```typescript
   import { getYourNewEndpointOptions } from '@/lib/api/@tanstack/react-query.gen';

   const { data } = useQuery(getYourNewEndpointOptions({ ... }));
   ```

## File Structure

```
src/
├── app/
│   └── api/                    # Next.js API routes
│       └── your-endpoint/
│           └── route.ts
├── lib/
│   ├── openapi.json           # OpenAPI spec (auto-generated + manual edits)
│   ├── openapi/
│   │   ├── scripts/
│   │   │   └── generate-openapi.ts  # Generation script
│   │   └── README.md          # This file
│   └── api/                   # Generated API client (from openapi.json)
│       ├── @tanstack/
│       │   └── react-query.gen.ts
│       └── types.gen.ts
```

## Quick Reference

| Task                                  | Command                    |
| ------------------------------------- | -------------------------- |
| Generate OpenAPI spec from routes     | `npm run generate-openapi` |
| Generate API client from openapi.json | `npm run generate-client`  |
| View API docs                         | Visit `/api-docs`          |
| Get OpenAPI JSON                      | `GET /api/openapi.json`    |

## Best Practices

1. **Always run `generate-openapi` after adding a new route**

   ```bash
   npm run generate-openapi
   ```

2. **Review generated spec** before generating the client
   - Check if paths are correct
   - Check if methods are correct
   - Add schemas if needed

3. **Customize schemas** in `openapi.json` for better type safety
   - Define request/response types
   - Add validation rules
   - Add examples

4. **Generate client after each openapi.json update**

   ```bash
   npm run generate-client
   ```

5. **Commit both `openapi.json` and generated files** to git
   - `src/lib/openapi.json` - Source of truth
   - `src/lib/api/**/*.gen.ts` - Generated files

## Examples

### Adding a New Endpoint

1. Create route file: `src/app/api/crm/stores/route.ts`

```typescript
export async function GET() { ... }
export async function POST() { ... }
```

2. Run generate:

```bash
npm run generate-openapi
```

3. Result in `openapi.json`:

```json
{
  "paths": {
    "/crm/stores": {
      "get": { ... },
      "post": { ... }
    }
  }
}
```

4. Generate client:

```bash
npm run generate-client
```

5. Use:

```typescript
import { getCrmStoresOptions, postCrmStoresMutation } from '@/lib/api/@tanstack/react-query.gen';

// GET
const { data } = useQuery(getCrmStoresOptions());

// POST
const mutation = useMutation({ ...postCrmStoresMutation() });
```

## Important Notes

- The automatic script will **not overwrite** existing definitions
- If you have customized an endpoint in `openapi.json`, the script will preserve it
- Only new endpoints or empty definitions will be generated
- After updating `openapi.json`, remember to run `npm run generate-client` to update API client code

## Troubleshooting

### Script doesn't detect new route

- Ensure the file is named `route.ts` or `route.tsx`
- Ensure there's an exported function with an HTTP method name (GET, POST, etc.)
- Check console output to see if the script scanned the file

### Generated client doesn't have types

- Check if `openapi.json` has schema definitions
- Run `npm run generate-client` again
- Check if `src/lib/api/types.gen.ts` has new types

### Swagger UI doesn't display endpoint

- Refresh the `/api-docs` page
- Check browser console for errors
- Verify `openapi.json` has the endpoint in `paths`
