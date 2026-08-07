import type { ReactNode } from 'react';

interface SurveyDetailLayoutProps {
  main: ReactNode;
  aside: ReactNode;
}

export function SurveyDetailLayout({ main, aside }: SurveyDetailLayoutProps) {
  return (
    <div className="flex gap-4">
      <div className="flex w-[60%] flex-col gap-4">{main}</div>
      <div className="w-[40%]">
        <div className="sticky top-0 flex flex-col gap-4">{aside}</div>
      </div>
    </div>
  );
}
