import { Globe, Smartphone } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface BannerChannelSectionProps {
  webEnabled: boolean;
  mobileEnabled: boolean;
  onChannelChange: (field: 'webEnabled' | 'mobileEnabled', value: boolean) => void;
}

export function BannerChannelSection({
  webEnabled,
  mobileEnabled,
  onChannelChange,
}: BannerChannelSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">掲載チャネル</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Globe className="text-muted-foreground size-4" />
              <div className="flex flex-col gap-0.5">
                <Label className="text-sm font-medium">WEBサイト</Label>
                <p className="text-muted-foreground text-xs">公式WEBサイトにバナーを表示します</p>
              </div>
            </div>
            <Switch
              checked={webEnabled}
              onCheckedChange={(value) => onChannelChange('webEnabled', value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Smartphone className="text-muted-foreground size-4" />
              <div className="flex flex-col gap-0.5">
                <Label className="text-sm font-medium">モバイルアプリ</Label>
                <p className="text-muted-foreground text-xs">公式アプリにバナーを表示します</p>
              </div>
            </div>
            <Switch
              checked={mobileEnabled}
              onCheckedChange={(value) => onChannelChange('mobileEnabled', value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
