'use client';

import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type ReactQuill from 'react-quill-new';

import dynamic from 'next/dynamic';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import type { GetCrmNotificationsFormConfigResponse } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import {
  MANUAL_NOTIFICATION_CHANNEL_LABELS,
  MANUAL_NOTIFICATION_CHANNEL_OPTIONS,
  type ManualNotificationChannel,
} from '../_constants/manual-notification.constants';
import type { ManualNotificationFormValues } from '../_schemas/manual-notification-form.schema';

type QuillProps = React.ComponentProps<typeof ReactQuill>;
const RichTextEditor = dynamic(
  async () => {
    const { default: Editor } = await import('react-quill-new');
    return function EmailEditor(props: QuillProps) {
      return <Editor {...props} />;
    };
  },
  { ssr: false },
);

export function ManualNotificationMessageSection({
  templates,
  activeChannel,
  onActiveChannelChange,
}: {
  readonly templates: GetCrmNotificationsFormConfigResponse['templates'];
  readonly activeChannel: ManualNotificationChannel;
  readonly onActiveChannelChange: (channel: ManualNotificationChannel) => void;
}) {
  const form = useFormContext<ManualNotificationFormValues>();
  const channels = useWatch({ control: form.control, name: 'channels' });
  const contentErrors = form.formState.errors.contents;
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>();
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);
  const channelHasError = (channel: ManualNotificationChannel) => Boolean(contentErrors?.[channel]);

  const applyTemplate = (id: string | null) => {
    const template = templates.find((item) => item.id === id);
    if (!template) return;
    setSelectedTemplateId(template.id);
    const { body } = template;
    const currentContents = form.getValues('contents');
    form.setValue(
      'contents',
      {
        sms: { body },
        push: { ...currentContents.push, body },
        email: { ...currentContents.email, body },
        in_app: { ...currentContents.in_app, body },
      },
      { shouldDirty: true, shouldValidate: true },
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold">チャネル別文言</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedTemplateId ?? ''} onValueChange={applyTemplate}>
              <SelectTrigger className="bg-background h-8 w-52 text-xs">
                <SelectValue placeholder="テンプレートから選択（任意）">
                  {selectedTemplate?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <RoleGatedButton
              type="button"
              variant="link"
              size="sm"
              className="px-0 text-xs"
              requiredPermission={Permission.ManualNotificationsEdit}
              disabled
              tooltip="後日対応予定"
            >
              管理 →
            </RoleGatedButton>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4">
        <Tabs
          value={activeChannel}
          onValueChange={(value) => onActiveChannelChange(value as ManualNotificationChannel)}
        >
          <TabsList>
            {MANUAL_NOTIFICATION_CHANNEL_OPTIONS.map((channel) => (
              <TabsTrigger key={channel} value={channel} className="gap-1 text-xs">
                {MANUAL_NOTIFICATION_CHANNEL_LABELS[channel]}
                {channelHasError(channel) ? (
                  <span className="bg-destructive size-1.5 rounded-full" aria-label="入力エラー" />
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {channels.includes(activeChannel) ? (
          <ChannelContentFields channel={activeChannel} />
        ) : (
          <p className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
            このチャネルはオフです。配信チャネルをオンにすると入力できます。
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ChannelContentFields({ channel }: { readonly channel: ManualNotificationChannel }) {
  const form = useFormContext<ManualNotificationFormValues>();
  const bodyName = `contents.${channel}.body` as const;
  const bodyLabel = channel === 'sms' ? 'SMS本文' : channel === 'email' ? '本文' : '通知本文';
  return (
    <div className="space-y-4">
      {channel === 'push' ? (
        <FormField
          control={form.control}
          name="contents.push.title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                通知タイトル <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="例: 夏キャンペーン開催中！"
                  className="max-w-[480px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
      {channel === 'email' ? (
        <FormField
          control={form.control}
          name="contents.email.subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                件名 <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="例: 【JOYFIT】夏キャンペーンのご案内"
                  className="max-w-[480px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
      {channel === 'in_app' ? (
        <FormField
          control={form.control}
          name="contents.in_app.title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                通知タイトル <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="例: 夏キャンペーン開催中！" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
      <FormField
        control={form.control}
        name={bodyName}
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>
                {bodyLabel} <span className="text-destructive">*</span>
              </FormLabel>
              {channel === 'sms' ? (
                <Badge variant="outline" className="text-xs">
                  {field.value.length}/70文字目安
                </Badge>
              ) : null}
            </div>
            <FormControl>
              {channel === 'email' ? (
                <div className="[&_.ql-container]:border-input [&_.ql-container]:rounded-lg [&_.ql-container]:border [&_.ql-editor]:min-h-[160px] [&_.ql-editor]:text-sm">
                  <RichTextEditor
                    theme="snow"
                    value={field.value}
                    onChange={field.onChange}
                    modules={{ toolbar: [['bold', 'italic', 'underline'], [{ list: 'bullet' }]] }}
                    formats={['bold', 'italic', 'underline', 'list']}
                    placeholder="メール本文を入力してください..."
                  />
                </div>
              ) : (
                <Textarea
                  {...field}
                  rows={channel === 'sms' ? 4 : 6}
                  placeholder={
                    channel === 'sms'
                      ? '例: 【JOYFIT】夏キャンペーン開催中！詳しくはアプリをご確認ください。'
                      : channel === 'push'
                        ? '例: 7月末まで入会金無料！この機会をお見逃しなく。'
                        : '例: 7月末まで入会金無料！詳細はこちらからご確認ください。'
                  }
                  className="min-h-28 resize-y"
                />
              )}
            </FormControl>
            {channel === 'sms' ? (
              <FormDescription>
                全角70文字以内を推奨（超過時は複数通送信になります）
              </FormDescription>
            ) : null}
            <FormMessage />
          </FormItem>
        )}
      />
      {channel === 'in_app' ? (
        <FormField
          control={form.control}
          name="contents.in_app.linkUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>リンクURL</FormLabel>
              <FormDescription>タップ時の遷移先URL（任意）</FormDescription>
              <FormControl>
                <Input {...field} placeholder="https://..." className="max-w-[480px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
    </div>
  );
}
