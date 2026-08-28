'use client';

import { useState } from 'react';

import {
  TERMS_STATUS_BADGE_CLASSES,
  TERMS_TIMELINE_STATUS_LABELS,
  VERSION_KIND_BADGE_CLASSES,
  VERSION_KIND_LABELS,
} from '@/app/(private)/terms/_constants/constants';
import { formatDate, formatFileSize } from '@/utils/format.util';
import { ChevronDown, Eye, FileText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { TermsVersionEntry } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

interface VersionTimelineProps {
  versions: TermsVersionEntry[];
}

const INITIAL_VISIBLE_COUNT = 3;

export function VersionTimeline({ versions }: Readonly<VersionTimelineProps>) {
  const [showAll, setShowAll] = useState(false);

  const visibleVersions = showAll ? versions : versions.slice(0, INITIAL_VISIBLE_COUNT);

  return (
    <div className="flex flex-col gap-3">
      {visibleVersions.map((version, index) => (
        <div key={version.id} className="relative flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'mt-1 size-3 rounded-full',
                version.isCurrentlyApplied ? 'bg-success' : 'bg-muted-foreground/30',
              )}
            />
            {index < visibleVersions.length - 1 && <div className="bg-border w-px flex-1" />}
          </div>
          <div
            className={cn(
              'mb-2 flex-1 rounded-lg border p-4',
              version.isCurrentlyApplied && 'border-success/30 bg-success/15',
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{version.version}</span>
                <Badge
                  variant="outline"
                  className={cn('text-[10px]', VERSION_KIND_BADGE_CLASSES[version.versionKind])}
                >
                  {VERSION_KIND_LABELS[version.versionKind]}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn('text-[10px]', TERMS_STATUS_BADGE_CLASSES[version.status])}
                >
                  {TERMS_TIMELINE_STATUS_LABELS[version.status]}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs"
                disabled={!version.pdfUrl}
                onClick={() =>
                  version.pdfUrl && window.open(version.pdfUrl, '_blank', 'noopener,noreferrer')
                }
              >
                <Eye className="size-3" />
                プレビュー
              </Button>
            </div>
            <p className="text-muted-foreground mb-1 text-xs">
              {formatDate(version.effectiveFrom)} 〜{' '}
              {version.effectiveTo ? formatDate(version.effectiveTo) : '現在'}
            </p>
            <p className="mb-3 text-xs">{version.changeSummary}</p>
            {version.isCurrentlyApplied && version.pdfFileName && (
              <div className="border-t pt-3">
                <p className="text-muted-foreground mb-2 text-xs">ファイル</p>
                <div className="bg-background flex w-fit items-center gap-2 rounded-md border px-3 py-2">
                  <FileText className="text-muted-foreground size-4" />
                  <a
                    href={version.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary text-xs hover:underline"
                  >
                    {version.pdfFileName}
                  </a>
                  <span className="text-muted-foreground text-[10px]">
                    ({formatFileSize(version.pdfFileSize)})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
      {versions.length > INITIAL_VISIBLE_COUNT && !showAll && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground ml-7 w-fit gap-1 text-xs"
          onClick={() => setShowAll(true)}
        >
          <ChevronDown className="size-3" />
          過去のバージョンを表示（全{versions.length}件）
        </Button>
      )}
    </div>
  );
}
