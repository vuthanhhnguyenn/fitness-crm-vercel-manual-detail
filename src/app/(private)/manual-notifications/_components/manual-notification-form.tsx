'use client';

import { type FormEvent, useState } from 'react';
import { type FieldErrors, useFormContext, useWatch } from 'react-hook-form';

import { Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

import type { GetCrmNotificationsFormConfigResponse } from '@/lib/api/types.gen';

import {
  type ManualNotificationChannel,
  manualNotificationRequiresApproval,
} from '../_constants/manual-notification.constants';
import { type ManualNotificationFormValues } from '../_schemas/manual-notification-form.schema';
import { ManualNotificationMessageSection } from './manual-notification-message-section';
import { ManualNotificationTargetSection } from './manual-notification-target-section';
import { ManualNotificationTimingSection } from './manual-notification-timing-section';

const CHANNELS: Array<{
  value: ManualNotificationChannel;
  label: string;
  icon: typeof Smartphone;
  description: string;
}> = [
  {
    value: 'sms',
    label: 'SMS',
    icon: MessageSquare,
    description: '登録済み電話番号にSMSを送信します',
  },
  {
    value: 'push',
    label: 'プッシュ通知',
    icon: Bell,
    description: 'アプリにプッシュ通知を送信します',
  },
  {
    value: 'email',
    label: 'メール',
    icon: Mail,
    description: '登録済みメールアドレスに送信します',
  },
  {
    value: 'in_app',
    label: 'アプリ内通知',
    icon: Smartphone,
    description: 'アプリの通知センターに表示します',
  },
];

function ManualNotificationChannelsSection() {
  const form = useFormContext<ManualNotificationFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">配信チャネル</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <FormField
          control={form.control}
          name="channels"
          render={({ field }) => (
            <FormItem>
              <div className="flex flex-col gap-3">
                {CHANNELS.map((channel) => {
                  const Icon = channel.icon;
                  const checked = field.value.includes(channel.value);
                  return (
                    <div
                      key={channel.value}
                      className="flex items-center gap-3 rounded-lg border p-4"
                    >
                      <Icon className="text-muted-foreground size-4" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{channel.label}</p>
                        <p className="text-muted-foreground text-xs">{channel.description}</p>
                      </div>
                      <Switch
                        checked={checked}
                        onCheckedChange={(nextChecked) =>
                          field.onChange(
                            nextChecked
                              ? [...field.value, channel.value]
                              : field.value.filter((value) => value !== channel.value),
                          )
                        }
                        aria-label={`${channel.label}を有効化`}
                      />
                    </div>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

interface ManualNotificationFormProps {
  readonly formConfig: GetCrmNotificationsFormConfigResponse;
  readonly isEdit?: boolean;
  readonly notificationId?: string;
  readonly isSubmitting?: boolean;
  readonly onCancel: () => void;
  readonly onSubmit: (values: ManualNotificationFormValues, intent: 'save' | 'submit') => void;
}

export function ManualNotificationForm({
  formConfig,
  isEdit = false,
  notificationId,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: ManualNotificationFormProps) {
  const form = useFormContext<ManualNotificationFormValues>();
  const [activeChannel, setActiveChannel] = useState<ManualNotificationChannel>('push');
  const scrollToFirstError = useScrollToFirstError();
  const target = useWatch({ control: form.control, name: 'target' });
  const approvalRequired = manualNotificationRequiresApproval(target);
  const hasSubmitErrors =
    form.formState.submitCount > 0 && Object.keys(form.formState.errors).length > 0;
  const handleSubmit = (values: ManualNotificationFormValues) => {
    onSubmit(values, values.intent);
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const intent =
      submitter instanceof HTMLButtonElement && submitter.value === 'submit' ? 'submit' : 'save';
    form.setValue('intent', intent);
    void form.handleSubmit(handleSubmit, (errors: FieldErrors<ManualNotificationFormValues>) => {
      const enabledChannels = form.getValues('channels');
      const firstErrorChannel = CHANNELS.find(
        (channel) =>
          enabledChannels.includes(channel.value) && Boolean(errors.contents?.[channel.value]),
      )?.value;
      if (firstErrorChannel) setActiveChannel(firstErrorChannel);
      requestAnimationFrame(scrollToFirstError);
    })(event);
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleFormSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  タイトル（管理用） <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="例: 夏キャンペーン告知"
                    className="max-w-[480px]"
                    autoFocus
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {isEdit ? (
            <FormItem className="mt-3 max-w-md">
              <FormLabel>通知ID</FormLabel>
              <Input value={notificationId ?? ''} readOnly className="bg-muted" />
            </FormItem>
          ) : null}
        </CardContent>
      </Card>

      <ManualNotificationTargetSection
        approvalRequired={approvalRequired}
        formConfig={formConfig}
      />

      <ManualNotificationChannelsSection />
      <ManualNotificationMessageSection
        templates={formConfig.templates}
        activeChannel={activeChannel}
        onActiveChannelChange={setActiveChannel}
      />
      <ManualNotificationTimingSection />

      <div className="flex flex-wrap items-center justify-end gap-2 border-t p-4">
        {hasSubmitErrors ? (
          <p className="text-destructive mr-auto text-xs">未入力の項目があります</p>
        ) : null}
        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          キャンセル
        </Button>
        <Button
          type="submit"
          name="intent"
          value="save"
          size="lg"
          variant="outline"
          disabled={isSubmitting}
        >
          下書き保存
        </Button>
        <Button type="submit" name="intent" value="submit" size="lg" disabled={isSubmitting}>
          {approvalRequired ? '承認依頼を送信' : isEdit ? '変更して配信' : '配信を開始'}
        </Button>
      </div>
    </form>
  );
}
