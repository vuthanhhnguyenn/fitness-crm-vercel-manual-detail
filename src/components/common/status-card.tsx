import type { ReactNode } from 'react';

import type { LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * StatusCard — 詳細画面の右カラム最上部に置くステータス表示カード
 *
 * 役割分離（critic CRITERIA-1 対応）:
 * - 詳細画面の StatusCard = 表示中心の状態ハブ。
 *   状態変更は AlertDialog 経由の action prop（即時切替UI不可）
 * - フォーム画面最末尾Card = 編集中の状態切替。Switch + 補助説明方式（option-form L356-374 参照）
 * - 両者は別画面なので「二重」ではなく「役割分離」
 */

export type StatusTone = 'success' | 'warning' | 'destructive' | 'info' | 'muted';

interface StatusCardProps {
  tone: StatusTone;
  /** 円形大アイコン用（size-10 で表示） */
  icon: LucideIcon;
  /** "公開中" / "有効" 等のラベル */
  label: string;
  /** 作成日 or 状態遷移日（文字列または文字列配列） */
  meta?: string | string[];
  /**
   * Button 1個。AlertDialog 経由の業務アクション専用。
   * 即時切替 UI（Switch 等）はここに入れない。
   */
  action?: ReactNode;
}

const TONE_CLASSES: Record<StatusTone, { bg: string; text: string; border: string; dot: string }> =
  {
    success: {
      bg: 'bg-success/10',
      text: 'text-success',
      border: 'border-success/20',
      dot: 'bg-success',
    },
    warning: {
      bg: 'bg-warning/10',
      text: 'text-warning',
      border: 'border-warning/20',
      dot: 'bg-warning',
    },
    destructive: {
      bg: 'bg-destructive/10',
      text: 'text-destructive',
      border: 'border-destructive/20',
      dot: 'bg-destructive',
    },
    info: { bg: 'bg-info/10', text: 'text-info', border: 'border-info/20', dot: 'bg-info' },
    muted: {
      bg: 'bg-muted',
      text: 'text-muted-foreground',
      border: 'border-border',
      dot: 'bg-muted-foreground',
    },
  };

export function StatusCard({ tone, icon: Icon, label, meta, action }: StatusCardProps) {
  const c = TONE_CLASSES[tone];
  const metaList = meta === undefined ? [] : Array.isArray(meta) ? meta : [meta];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">ステータス</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center px-4">
        {/* 円形大アイコン */}
        <div className={`size-20 rounded-full ${c.bg} mb-3 flex items-center justify-center`}>
          <Icon className={`size-10 ${c.text}`} />
        </div>

        {/* ドット付きステータスBadge */}
        <Badge
          variant="outline"
          className={`${c.bg.replace('/10', '/15')} ${c.text} ${c.border} gap-1 text-xs font-medium`}
        >
          <span className={`size-2 rounded-full ${c.dot}`} />
          {label}
        </Badge>

        {/* メタ情報（日付等） */}
        {metaList.length > 0 && (
          <div
            className={`text-muted-foreground mt-3 text-center text-xs ${metaList.length > 1 ? 'space-y-1' : ''}`}
          >
            {metaList.map((m, i) => (
              <p key={i}>{m}</p>
            ))}
          </div>
        )}

        {/* アクションボタン（AlertDialog 経由の業務アクション専用） */}
        {action && <div className="mt-4 w-full border-t pt-4">{action}</div>}
      </CardContent>
    </Card>
  );
}
