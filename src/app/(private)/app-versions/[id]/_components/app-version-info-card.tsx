import { formatDateYYYYMMDD, formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { AlertTriangle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { AppVersionRecord } from '@/lib/api/types.gen';

import {
  APP_VERSION_BRAND_LABELS,
  BRAND_BADGE_CLASSES,
} from '../../_constants/app-version.constants';

interface AppVersionInfoCardProps {
  data: AppVersionRecord | undefined;
}

export function AppVersionInfoCard({ data }: AppVersionInfoCardProps) {
  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">バージョン情報</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <p className="text-muted-foreground mb-1 text-xs">ID</p>
              <p className="text-sm">{data.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">ブランド</p>
              <Badge variant="outline" className={`text-xs ${BRAND_BADGE_CLASSES[data.brandEnum]}`}>
                {APP_VERSION_BRAND_LABELS[data.brandEnum]}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">iOSバージョンコード</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm">{data.iosVersionName}</p>
                <span className="text-muted-foreground text-xs">
                  （ビルド: {data.iosBuildNumber}）
                </span>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">Androidバージョンコード</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm">{data.androidVersionName}</p>
                <span className="text-muted-foreground text-xs">
                  （ビルド: {data.androidBuildNumber}）
                </span>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">リリース日</p>
              <p className="text-sm">{formatDateYYYYMMDD(data.releaseDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">作成日</p>
              <p className="text-sm">{formatDateYYYYMMDD_HHMM(data.createdAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 text-xs">更新日</p>
              <p className="text-sm">
                {data.updatedAt ? (
                  formatDateYYYYMMDD_HHMM(data.updatedAt)
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </p>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">備考</p>
            <p className="text-sm">
              {data.remarks ?? <span className="text-muted-foreground/50"></span>}
            </p>
          </div>
          <Alert className="border-warning/50 bg-warning/15">
            <AlertTriangle className="text-warning size-4" />
            <AlertDescription className="text-muted-foreground text-xs">
              メンテナンス中に強制アップデートのポップアップを表示させないように日時設定をしてください
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}
