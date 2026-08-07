#!/usr/bin/env node

// Main script to generate routes
// Usage: node --loader ts-node/esm src/lib/routes/scripts/generate-routes.ts
// or: npm run generate:routes
import { RouteGenerator } from './classes/RouteGenerator.js';

async function main() {
  try {
    const generator = new RouteGenerator();
    await generator.generate();
  } catch (error) {
    console.error('Failed to generate routes:', error);
    process.exit(1);
  }
}

// Execute if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { RouteGenerator };
