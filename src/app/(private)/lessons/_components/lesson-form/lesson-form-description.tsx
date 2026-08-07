'use client';

import { useCallback, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

import dynamic from 'next/dynamic';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import type { LessonFormValues } from '../../_schemas/lesson-form.schema';

type QuillWrapperProps = React.ComponentProps<typeof ReactQuill> & {
  forwardedRef: React.Ref<ReactQuill>;
};

const ReactQuillEditor = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill-new');

    function QuillWrapper({ forwardedRef, ...props }: QuillWrapperProps) {
      return <RQ ref={forwardedRef} {...props} />;
    }

    return QuillWrapper;
  },
  { ssr: false },
);

const QUILL_FORMATS = ['header', 'bold', 'italic', 'underline', 'strike', 'list'];

const HEADING_OPTIONS = [
  { value: 'normal', label: '標準' },
  { value: '1', label: '見出し1' },
  { value: '2', label: '見出し2' },
];

const INLINE_BUTTONS = [
  { format: 'bold', label: 'B', className: 'font-bold' },
  { format: 'italic', label: 'I', className: 'italic font-serif' },
  { format: 'underline', label: 'U', className: 'underline' },
  { format: 'strike', label: 'S', className: 'line-through' },
] as const;

type InlineFormat = (typeof INLINE_BUTTONS)[number]['format'];

function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-xs font-bold">
        {number}
      </div>
      <h3 className="text-sm font-bold">{title}</h3>
    </div>
  );
}

export function LessonFormDescription() {
  const form = useFormContext<LessonFormValues>();
  const lessonType = useWatch({ control: form.control, name: 'lessonType' });
  const isPersonal = lessonType === 'personal';
  const heading = isPersonal ? 'トレーニング内容説明' : 'レッスン内容説明';
  const placeholder = isPersonal
    ? 'パーソナルトレーニングの内容・対象者・期待される効果などを記述...'
    : 'レッスンの内容・対象者・期待される効果などを記述...';

  const quillRef = useRef<ReactQuill | null>(null);
  const [activeFormats, setActiveFormats] = useState<{
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strike: boolean;
    header: string;
  }>({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    header: 'normal',
  });

  const syncActiveFormats = useCallback(() => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const current = editor.getFormat();
    setActiveFormats({
      bold: Boolean(current.bold),
      italic: Boolean(current.italic),
      underline: Boolean(current.underline),
      strike: Boolean(current.strike),
      header: current.header ? String(current.header) : 'normal',
    });
  }, []);

  const toggleInline = useCallback(
    (format: InlineFormat) => {
      const editor = quillRef.current?.getEditor();
      if (!editor) return;
      editor.focus();
      const current = editor.getFormat();
      editor.format(format, !current[format]);
      syncActiveFormats();
    },
    [syncActiveFormats],
  );

  const applyHeading = useCallback(
    (value: string | null) => {
      const editor = quillRef.current?.getEditor();
      if (!editor || !value) return;
      editor.focus();
      editor.format('header', value === 'normal' ? false : Number(value));
      syncActiveFormats();
    },
    [syncActiveFormats],
  );

  return (
    <Card>
      <CardContent className="px-6">
        <SectionHeader number={4} title={heading} />

        <div className="mb-2 flex items-center gap-0.5 rounded-lg border p-1">
          <Select value={activeFormats.header} onValueChange={applyHeading}>
            <SelectTrigger className="h-8 w-[100px] border-0 text-xs shadow-none">
              <SelectValue>
                {HEADING_OPTIONS.find((option) => option.value === activeFormats.header)?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {HEADING_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Separator orientation="vertical" className="mx-1 h-5" />
          {INLINE_BUTTONS.map((button) => (
            <Button
              key={button.format}
              type="button"
              variant="ghost"
              size="sm"
              data-active={activeFormats[button.format] ? '' : undefined}
              className={`size-7 p-0 text-xs ${button.className} data-active:bg-accent data-active:text-accent-foreground`}
              onClick={() => toggleInline(button.format)}
            >
              {button.label}
            </Button>
          ))}
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div
                  className="[&_.ql-container]:border-input [&_.ql-container]:border [&_.ql-container.ql-snow]:rounded-lg [&_.ql-editor]:min-h-[120px] [&_.ql-editor]:text-sm"
                  onCompositionStart={(event) => {
                    const root = event.currentTarget.querySelector<HTMLElement>('.ql-editor');
                    if (root) root.dataset.placeholder = '';
                  }}
                  onCompositionEnd={(event) => {
                    const root = event.currentTarget.querySelector<HTMLElement>('.ql-editor');
                    if (root) root.dataset.placeholder = placeholder;
                  }}
                >
                  <ReactQuillEditor
                    forwardedRef={quillRef}
                    theme="snow"
                    placeholder={placeholder}
                    modules={{ toolbar: false }}
                    formats={QUILL_FORMATS}
                    value={field.value ?? ''}
                    onChange={(value: string) => {
                      field.onChange(value);
                      syncActiveFormats();
                    }}
                    onBlur={field.onBlur}
                    onChangeSelection={syncActiveFormats}
                  />
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
