'use client';

import { useEffect, useState } from 'react';

import dynamic from 'next/dynamic';

import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpec = async () => {
      try {
        const response = await fetch('/api/openapi.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch OpenAPI spec: ${response.status}`);
        }
        const data = await response.json();
        setSpec(data);
      } catch (err) {
        console.error('Error fetching OpenAPI spec:', err);
        setError(err instanceof Error ? err.message : 'Failed to load API documentation');
      }
    };
    fetchSpec();
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">Error Loading API Documentation</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <SwaggerUI spec={spec} />
    </div>
  );
}
