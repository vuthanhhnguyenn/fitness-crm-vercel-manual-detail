'use client';

import { AlertTriangle } from 'lucide-react';

interface ConflictItem {
  instructorValue: string;
  date: string;
  lessonName: string;
}

interface InstructorConflictWarningProps {
  conflicts: ConflictItem[];
}

export function InstructorConflictWarning({ conflicts }: InstructorConflictWarningProps) {
  if (conflicts.length === 0) return null;
  return (
    <div className="mt-2 space-y-1">
      {conflicts.map((c, i) => (
        <div
          key={i}
          className="border-warning/30 bg-warning/10 flex items-start gap-2 rounded-md border px-3 py-2"
        >
          <AlertTriangle className="text-warning mt-0.5 size-4 shrink-0" />
          <p className="text-warning text-xs">
            {c.instructorValue} は同日時に「{c.lessonName}」を担当しています
          </p>
        </div>
      ))}
    </div>
  );
}
