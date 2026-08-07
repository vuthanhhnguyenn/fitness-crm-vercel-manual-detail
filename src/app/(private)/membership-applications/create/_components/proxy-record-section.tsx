import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export function ProxyRecordSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>代理申請記録</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <FormItem>
              <FormLabel>合意日時</FormLabel>
              <FormControl>
                <Input placeholder="2026/03/30 09:00（自動記録）" readOnly />
              </FormControl>
            </FormItem>
          </div>
          <div className="flex flex-col gap-1">
            <FormItem>
              <FormLabel>合意日時</FormLabel>
              <FormControl>
                <Input placeholder="管理者A（STAFF-001）" readOnly />
              </FormControl>
            </FormItem>
          </div>
        </div>
        <p className="text-muted-foreground text-xs">
          代理申請者と合意日時は、操作ログから自動記録されます。
        </p>
      </CardContent>
    </Card>
  );
}
