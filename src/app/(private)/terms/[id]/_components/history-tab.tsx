'use client';

import { useState } from 'react';

import { ChevronDown, Eye, FileText, Plus } from 'lucide-react';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmTermsByIdResponse } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

type HistoryTabTermDetailProps = {
  readonly versions: GetCrmTermsByIdResponse['versions'];
  readonly onCreateVersion: () => void;
};

function getVersionTypeLabel(
  versionType: GetCrmTermsByIdResponse['versions'][number]['versionType'],
) {
  return versionType === 'original' ? 'オリジナル規約' : 'バージョン規約';
}

function getVersionStatusLabel(status: GetCrmTermsByIdResponse['versions'][number]['status']) {
  switch (status) {
    case 'active':
      return '適用中';
    case 'expired':
      return '適用終了';
    case 'draft':
      return '下書き';
  }
}

function getVersionStatusBadgeClass(status: GetCrmTermsByIdResponse['versions'][number]['status']) {
  switch (status) {
    case 'active':
      return 'bg-success/15 text-success border-success/20';
    case 'expired':
      return 'border-border bg-muted text-muted-foreground';
    case 'draft':
      return 'bg-warning/15 text-warning border-warning/20';
  }
}

export function HistoryTabTermDetail({ versions, onCreateVersion }: HistoryTabTermDetailProps) {
  const [showAllVersions, setShowAllVersions] = useState(false);
  const visibleVersions = showAllVersions ? versions : versions.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">バージョン履歴</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-muted-foreground text-xs">
            新バージョンを公開すると、旧バージョンは自動的に適用終了になります
          </p>
          <RoleGatedButton
            requiredPermission={Permission.TermsCreate}
            size="sm"
            className="shrink-0 gap-1 text-xs"
            onClick={onCreateVersion}
          >
            <Plus className="size-3" />
            新規バージョン作成
          </RoleGatedButton>
        </div>
        <div className="flex flex-col gap-3">
          {visibleVersions.map((version, index) => {
            const isActive = version.status === 'active';
            const showConnector = index < visibleVersions.length - 1;

            return (
              <div key={version.version} className="relative flex gap-4">
                <div className="flex flex-col items-center">
                  <span
                    className={
                      isActive
                        ? 'bg-success mt-1 size-3 rounded-full'
                        : 'bg-muted-foreground/30 mt-1 size-3 rounded-full'
                    }
                  />
                  {showConnector && <div className="bg-border w-px flex-1" />}
                </div>

                <div
                  className={
                    isActive
                      ? 'border-success/30 bg-success/15 mb-2 flex-1 rounded-lg border p-4'
                      : 'mb-2 flex-1 rounded-lg border p-4'
                  }
                >
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{version.version}</span>
                        <Badge
                          variant="outline"
                          className={
                            version.versionType === 'original'
                              ? 'bg-primary/15 text-primary border-primary/20 text-[10px]'
                              : 'bg-info/15 text-info border-info/20 text-[10px]'
                          }
                        >
                          {getVersionTypeLabel(version.versionType)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${getVersionStatusBadgeClass(version.status)}`}
                        >
                          {getVersionStatusLabel(version.status)}
                        </Badge>
                      </div>
                    </div>

                    <Button variant="outline" size="sm" className="shrink-0 gap-1 text-xs">
                      <Eye className="size-3" />
                      プレビュー
                    </Button>
                  </div>
                  <p className="text-muted-foreground mb-1 text-xs">{version.period}</p>
                  <p className="mb-3 text-xs">{version.summary}</p>

                  {isActive && (
                    <div className="border-t pt-3">
                      <p className="text-muted-foreground mb-2 text-xs">ファイル</p>
                      <div className="bg-background flex w-fit items-center gap-2 rounded-md border px-3 py-2">
                        <FileText className="text-muted-foreground size-4" />
                        <a
                          href={version.file.url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary text-xs font-medium hover:underline"
                        >
                          {version.file.name}
                        </a>
                        <span className="text-muted-foreground text-[10px]">
                          ({version.file.size})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {versions.length > 3 && (
          <div className="mt-2 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground ml-7 gap-1 text-center text-xs"
              onClick={() => setShowAllVersions((current) => !current)}
            >
              <ChevronDown className={showAllVersions ? 'size-3 rotate-180' : 'size-3'} />
              {showAllVersions
                ? '過去のバージョンを閉じる'
                : `過去のバージョンを表示（全${versions.length}件）`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
