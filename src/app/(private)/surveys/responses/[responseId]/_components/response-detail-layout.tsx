import type { ReactNode } from 'react';

interface ResponseDetailLayoutProps {
  main: ReactNode;
  aside: ReactNode;
}

export function ResponseDetailLayout({ main, aside }: ResponseDetailLayoutProps) {
  return (
    <div className="flex gap-4">
      <div className="flex w-[60%] flex-col gap-4">{main}</div>
      <div className="w-[40%]">
        <div className="sticky top-0 flex flex-col gap-4">{aside}</div>
      </div>
    </div>
  );
}
