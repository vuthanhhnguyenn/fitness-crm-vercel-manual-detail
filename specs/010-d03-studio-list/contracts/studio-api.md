# API Contract: Studio List Endpoint

**Module**: D-03 Studio Management — FR-001 Studio List Display  
**Phase**: Phase 1 (Mock); Phase 2 (Real API via OpenAPI)  
**Status**: Draft

---

## Endpoint: GET /api/crm/studios

**Purpose**: Retrieve a paginated, filtered, and sorted list of studios scoped to current user's role.

### Request

**Method**: `GET`  
**URL**: `/api/crm/studios`

#### Query Parameters

```typescript
interface GetStudiosQuery {
  // Pagination (required)
  page?: number; // Default: 1; Min: 1
  limit?: number; // Default: 50; One of: [25, 50, 100, 200]

  // Search (optional; case-insensitive partial match on name)
  search?: string;

  // Filters (optional; all apply as AND logic)
  store_id?: string; // Single value; pre-scoped to user's accessible stores
  studio_type?: string; // One of: 'studio-lesson', 'pt', 'body-care'
  brand?: string; // One of: 'JOYFIT', 'JOYFIT24', 'JOYFIT_YOGA', 'JOYFIT_PLUS', 'FIT365'
  status?: string; // One of: 'active', 'inactive'; empty means show both

  // Sort (optional)
  sort_by?: string; // One of: 'id', 'name', 'store_name', 'studio_type', 'capacity'; Default: 'id'
  sort_order?: string; // One of: 'asc', 'desc'; Default: 'asc'
}
```

#### Example Requests

**Basic list** (first page, 50 items, default sort):

```
GET /api/crm/studios?page=1&limit=50
```

**Search by name**:

```
GET /api/crm/studios?page=1&limit=50&search=studio%20a
```

**Single filter** (active studios only):

```
GET /api/crm/studios?page=1&limit=50&status=active
```

**Multiple filters** (store AND studio_type AND status):

```
GET /api/crm/studios?page=1&limit=50&store_id=uuid-123&studio_type=pt&status=active
```

**Custom sort & pagination**:

```
GET /api/crm/studios?page=2&limit=100&sort_by=name&sort_order=desc
```

---

### Response

#### Success (200 OK)

```typescript
interface StudioListResponse {
  items: StudioListItem[];
  total: number; // Total count matching query (across all pages)
  page: number; // Current page
  limit: number; // Items per page
  has_next: boolean; // Whether there are more pages
}

interface StudioListItem {
  id: string; // UUID
  name: string;
  store_id: string; // UUID
  store_name: string;
  studio_type: 'studio-lesson' | 'pt' | 'body-care';
  capacity: number; // e.g., 20
  available_hours: string; // e.g., "10:00–21:00"
  brand: 'JOYFIT' | 'JOYFIT24' | 'JOYFIT_YOGA' | 'JOYFIT_PLUS' | 'FIT365';
  status: 'active' | 'inactive';
}
```

**Example Response**:

```json
{
  "items": [
    {
      "id": "studio-001",
      "name": "スタジオA",
      "store_id": "store-001",
      "store_name": "渋谷店",
      "studio_type": "studio-lesson",
      "capacity": 30,
      "available_hours": "10:00–21:00",
      "brand": "JOYFIT",
      "status": "active"
    },
    {
      "id": "studio-002",
      "name": "スタジオB",
      "store_id": "store-001",
      "store_name": "渋谷店",
      "studio_type": "pt",
      "capacity": 8,
      "available_hours": "10:00–22:00",
      "brand": "JOYFIT",
      "status": "active"
    }
  ],
  "total": 245,
  "page": 1,
  "limit": 50,
  "has_next": true
}
```

#### Error (400 Bad Request)

Invalid query parameter (e.g., `limit=999`):

```json
{
  "error": "Invalid limit: 999. Must be one of [25, 50, 100, 200]",
  "code": "INVALID_QUERY_PARAM"
}
```

#### Error (401 Unauthorized)

No authentication token provided:

```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

#### Error (403 Forbidden)

User lacks permission to view studios (not implemented for this list endpoint; all roles can view):

```json
{
  "error": "Forbidden",
  "code": "FORBIDDEN"
}
```

#### Error (500 Internal Server Error)

```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

---

## Authorization & Data Scoping

**Required**: User must be authenticated. Endpoint respects role-based data scoping:

| Role                | Returns                                           |
| ------------------- | ------------------------------------------------- |
| System, Headquarter | All studios across all stores                     |
| Manager             | Studios in assigned stores only                   |
| Staff               | Studios in assigned store only                    |
| Trainer, Observer   | Studios in assigned store only (read-only access) |

**Implementation**: Scoping enforced in route handler before response returned.

---

## Behavioral Specifications

### Filter Combination Logic

All active filters combine with **AND** logic:

- `store_id=X AND studio_type=Y AND status=Z` returns only studios matching ALL three criteria.

### Search Behavior

- Searches **studio name only** (case-insensitive, partial match)
- Example: `search=studio` matches "スタジオA", "lesson studio", etc.
- Search applies independently; combines with filters via AND

### Sort Behavior

- **Sortable columns**: `id`, `name`, `store_name`, `studio_type`, `capacity`
- **Non-sortable columns**: `available_hours`, `brand`, `status`
- **Invalid sort_by**: Returns 400 Bad Request
- **Default**: `sort_by=id&sort_order=asc`
- **Null handling**: Nulls sort last (if applicable)

### Pagination Behavior

- `page` is 1-indexed
- `limit` must be one of [25, 50, 100, 200]
- Out-of-range `page` returns empty list (no error)
- `has_next` = `true` if `(page * limit) < total`

### Empty Results

- No results for search/filter combination → `items: []`, `total: 0`, `has_next: false`
- No error raised; UI handles empty state (FR-001-07)

---

## Phase 1 Implementation

**Location**: `src/app/api/crm/studios/route.ts`

**Responsibilities**:

1. Parse and validate query parameters
2. Apply role-based data scoping (filter by user's stores)
3. Apply search, filter, sort logic to mock data in `_mock-db.ts`
4. Paginate results
5. Return `StudioListResponse`

**Mock Data Source**: `src/app/api/_mock-db.ts`

---

## Phase 2 Integration

Once DEV-BE publishes the stable OpenAPI spec for studios:

1. Run `npm run generate-api` (live server) or `npm run generate-client` (local `openapi.json`)
2. Generated client code in `src/lib/api/@tanstack/react-query.gen` replaces mock logic
3. Mock route handler removed; real backend API becomes source of truth
4. No client-side code changes required (hook interface remains identical)

---

## OpenAPI Specification (Phase 2)

```yaml
openapi: 3.0.0
info:
  title: Studio Management API
  version: 1.0.0
paths:
  /crm/studios:
    get:
      operationId: getCrmStudios
      tags:
        - Studios
      summary: Get paginated list of studios
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            enum: [25, 50, 100, 200]
            default: 50
        - name: search
          in: query
          schema:
            type: string
        - name: store_id
          in: query
          schema:
            type: string
            format: uuid
        - name: studio_type
          in: query
          schema:
            type: string
            enum: ['studio-lesson', 'pt', 'body-care']
        - name: brand
          in: query
          schema:
            type: string
            enum: ['JOYFIT', 'JOYFIT24', 'JOYFIT_YOGA', 'JOYFIT_PLUS', 'FIT365']
        - name: status
          in: query
          schema:
            type: string
            enum: ['active', 'inactive']
        - name: sort_by
          in: query
          schema:
            type: string
            enum: ['id', 'name', 'store_name', 'studio_type', 'capacity']
            default: 'id'
        - name: sort_order
          in: query
          schema:
            type: string
            enum: ['asc', 'desc']
            default: 'asc'
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StudioListResponse'
        '400':
          description: Bad request
        '401':
          description: Unauthorized
        '500':
          description: Internal server error
components:
  schemas:
    StudioListItem:
      type: object
      required:
        - id
        - name
        - store_id
        - store_name
        - studio_type
        - capacity
        - available_hours
        - brand
        - status
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        store_id:
          type: string
          format: uuid
        store_name:
          type: string
        studio_type:
          type: string
          enum: ['studio-lesson', 'pt', 'body-care']
        capacity:
          type: integer
          minimum: 1
        available_hours:
          type: string
        brand:
          type: string
          enum: ['JOYFIT', 'JOYFIT24', 'JOYFIT_YOGA', 'JOYFIT_PLUS', 'FIT365']
        status:
          type: string
          enum: ['active', 'inactive']
    StudioListResponse:
      type: object
      required:
        - items
        - total
        - page
        - limit
        - has_next
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/StudioListItem'
        total:
          type: integer
        page:
          type: integer
        limit:
          type: integer
        has_next:
          type: boolean
```

---

## Notes

- **Phase 1 Limitation**: All filtering/sorting happens client-side after fetch; backend mock returns full result set
- **Phase 2 Optimization**: Backend can push filtering/sorting server-side for better performance with large datasets
- **Role-based scoping**: Enforced at API boundary; client cannot access studios outside their scope
