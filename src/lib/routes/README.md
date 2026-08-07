# Route Generator

A TypeScript-based route generator for Next.js applications that automatically scans your app directory and generates type-safe route configurations.

## 🚀 Features

- **TypeScript First**: Full TypeScript support with strict typing
- **Class-based Architecture**: Clean, maintainable OOP design
- **Modular Structure**: Separated concerns across multiple files
- **Next.js Compatible**: Supports all Next.js routing conventions
- **Type Safety**: Generated routes with full IntelliSense support
- **Automatic Detection**: Scans app directory and generates routes automatically

## 📁 Project Structure

```
src/scripts/
├── classes/
│   ├── RouteGenerator.ts    # Main generator class
│   ├── RouteScanner.ts      # Directory scanner
│   └── FileGenerator.ts     # File content generator
├── config/
│   └── generator.config.ts  # Configuration constants
├── types/
│   └── route-generator.types.ts # TypeScript interfaces
├── utils/
│   └── route-pattern.util.ts    # Route pattern utilities
├── generate-routes.ts       # Main entry point
├── index.ts                # Export all modules
└── README.md               # This file
```

## 🛠️ Usage

### Basic Usage

```bash
# Generate routes using npm script
npm run generate-routes

# Or run directly with tsx
npx tsx src/lib/routes/scripts/generate-routes.ts
```

### Programmatic Usage

```typescript
import { RouteGenerator } from './src/scripts';

const generator = new RouteGenerator();

// Generate with default settings
await generator.generate();

// Or customize paths
await generator.setAppPath('./custom/app').setOutputDir('./custom/output').generate();
```

## 📄 Generated Files

The generator creates 3 files in `src/lib/routes/`:

### 1. `routes.config.ts` - Route Configuration

```typescript
export const routes = {
  '/demo': {
    router: '/demo',
    filePath: '(private)/demo',
    pattern: '/demo',
    private: true,
  },
  '/demo/[id]': {
    router: (id: string | number) => `/demo/${id}`,
    filePath: '(private)/demo/[id]',
    pattern: '/demo/:id',
    private: true,
  },
} as const;
```

### 2. `routes.type.ts` - TypeScript Types

```typescript
export type RouteKey = keyof typeof routes;
export type RouteConfig = {
  /* ... */
};
export type RouterFunction<T extends RouteKey> = (typeof routes)[T]['router'];
```

### 3. `routes.util.ts` - Utility Functions

```typescript
export function navigate<T extends RouteKey>(/* type-safe overloads */): string;
export function isPrivateRoute(key: RouteKey): boolean;
export function isPublicRoute(key: RouteKey): boolean;
// ... more utilities
```

## 🎯 Supported Route Types

| Route Type             | Example                 | Generated Router                                 | Pattern       |
| ---------------------- | ----------------------- | ------------------------------------------------ | ------------- |
| **Static**             | `/about`                | `'/about'`                                       | `/about`      |
| **Dynamic**            | `/user/[id]`            | `(id) => '/user/${id}'`                          | `/user/:id`   |
| **Catch-all**          | `/blog/[...slug]`       | `(...slug) => '/blog/${slug.join('/')}'`         | `/blog/*`     |
| **Optional Catch-all** | `/shop/[[...category]]` | `(...category) => '/shop/${category.join('/')}'` | `/shop(/.*)?` |

## ⚙️ Configuration

### Group Configuration

```typescript
// src/scripts/config/generator.config.ts
export const GROUPS_ROUTER_CONFIG = {
  '(public)': false, // Public routes
  '(private)': true, // Private routes
  '(shared)': undefined, // Shared routes
};
```

### Skip Patterns

The generator automatically skips:

- Private folders (`_folder`)
- Parallel routes (`@folder`)
- Intercepting routes (`(.)folder`, `(..)folder`)
- API routes (`api/`)
- Non-directory files

## 🔧 Customization

### Adding New Route Groups

```typescript
// Update generator.config.ts
export const GROUPS_ROUTER_CONFIG = {
  '(public)': false,
  '(private)': true,
  '(shared)': undefined,
  '(admin)': true, // Add new group
};
```

### Custom Skip Patterns

```typescript
// Update generator.config.ts
export const SKIP_PATTERNS = [
  '_', // Private folders
  '@', // Parallel routes
  '(.', // Intercepting routes
  'temp', // Custom pattern
] as const;
```

## 📝 Example Usage in Components

```typescript
import type { RouteKey } from '@/lib/routes/routes.type';
import { getRoutesByType, isPrivateRoute, navigate } from '@/lib/routes/routes.util';

// Type-safe navigation (TypeScript automatically checks parameters)
const userUrl = navigate('/user/[id]', 123); // '/user/123'
const profileUrl = navigate('/user/[id]', 'john'); // '/user/john'

// Static routes (no parameters needed)
const homeUrl = navigate('/'); // '/'

// Catch-all routes
const blogUrl = navigate('/blog/[...slug]', 'category', 'post-title'); // '/blog/category/post-title'

// Route checking
const isPrivate = isPrivateRoute('/dashboard'); // boolean

// Get routes by type
const privateRoutes = getRoutesByType('private'); // RouteKey[]
```

## 🚨 Important Notes

1. **Auto-generated Files**: Never edit generated files manually - they will be overwritten
2. **TypeScript Required**: This generator requires TypeScript and tsx to run
3. **Next.js Structure**: Follows Next.js 13+ app directory conventions
4. **Page Files**: Only directories with `page.tsx` files are considered routes

## 🎯 Production Ready

This TypeScript-based route generator is production-ready and replaces the old JavaScript implementation with:

- **Better Performance**: Faster execution with optimized TypeScript
- **Enhanced Reliability**: Compile-time error checking
- **Improved Maintainability**: Clean class-based architecture
- **Future-Proof**: Easy to extend and modify
