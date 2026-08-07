# API Contracts: Weekly Schedule Registration

> Phase 1 mock API contracts. Replaced by DEV-BE OpenAPI spec in Phase 2.

## POST /api/crm/lesson-schedules/create

Create a new lesson schedule (single or recurring).

### Request Body

```typescript
{
  lesson_type: 'studio' | 'personal';
  store_id: string;
  studio_id?: string;              // Required if lesson_type = 'studio'
  course_type?: '30min' | '60min' | 'trial'; // Required if lesson_type = 'personal'
  schedule_mode: 'single' | 'recurring';
  date?: string;                   // YYYY-MM-DD, single mode
  start_date?: string;             // YYYY-MM-DD, recurring mode
  start_time: string;              // HH:mm
  repeat_type?: 'weekly' | 'biweekly' | 'monthly';
  days_of_week?: number[];         // 0-6, required if weekly/biweekly
  end_condition?: 'by_date' | 'by_count' | 'indefinite';
  end_date?: string;               // YYYY-MM-DD
  end_count?: number;              // 1-100
  skip_holidays?: boolean;
  lesson_id: string;
  instructor_ids: string[];        // Min 1
  capacity?: number;               // Required if studio lesson
  is_published: boolean;
  trial_enabled: boolean;
  trial_mode?: 'inclusive' | 'additional';
  trial_capacity?: number;         // 1-5
}
```

### Response `201`

```typescript
{
  id: string; // Generated schedule ID (LS-xxx)
  message: string; // "スケジュールを登録しました"
  created_schedules: Array<{
    id: string;
    date: string;
    start_time: string;
    end_time: string;
  }>; // Single item for single mode, multiple for recurring
}
```

### Error Responses

- `400`: Validation error — field-level errors in `errors` map
- `409`: Conflict — instructor already booked at same time

## GET /api/crm/lesson-schedules/templates

List saved recurring templates.

### Response `200`

```typescript
{
  templates: Array<{
    id: string;
    name: string;
    repeat_type: 'weekly' | 'biweekly' | 'monthly';
    days_of_week: number[];
    end_condition: string;
    end_value: string | number | null;
    skip_holidays: boolean;
    start_time: string;
    store_id: string;
    lesson_class: 'studio' | 'personal';
    studio_id: string | null;
    lesson_id: string;
  }>;
}
```

## POST /api/crm/lesson-schedules/templates

Save a new recurring template.

### Request Body

```typescript
{
  name: string;
  repeat_type: 'weekly' | 'biweekly' | 'monthly';
  days_of_week: number[];
  end_condition: 'by_date' | 'by_count' | 'indefinite';
  end_value: string | number | null;
  skip_holidays: boolean;
  start_time: string;
  store_id: string;
  lesson_class: 'studio' | 'personal';
  studio_id: string | null;
  lesson_id: string;
}
```

### Response `201`

```typescript
{
  id: string;
  message: string;
}
```

## DELETE /api/crm/lesson-schedules/templates/[id]

Delete a saved template.

### Response `200`

```typescript
{
  message: string;
}
```

## GET /api/crm/lesson-schedules/instructor-availability

Check instructor availability for a given date and time.

### Query Parameters

```typescript
{
  instructor_id: string;
  date: string;                    // YYYY-MM-DD
  start_time: string;              // HH:mm
  day_of_week?: number;            // 0-6, for recurring checks
}
```

### Response `200`

```typescript
{
  available: boolean;
  conflicts: Array<{
    schedule_id: string;
    lesson_name: string;
    start_time: string;
    end_time: string;
  }>;
}
```

## GET /api/crm/stores/[id]/holidays

Get store holidays for a date range.

### Query Parameters

```typescript
{
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}
```

### Response `200`

```typescript
{
  holidays: Array<{
    date: string;
    name: string;
  }>;
}
```
