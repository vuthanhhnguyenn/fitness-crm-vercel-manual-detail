'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { toSelectItems } from '@/utils/app.util';
import { formatDateYYYYMMDD } from '@/utils/date.util';
import { zodResolver } from '@hookform/resolvers/zod';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldBan, TriangleAlert, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

import { useDebounce } from '@/hooks/use-debounce.hook';

import { SearchableSelect } from '@/components/common/searchable-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmBlacklistQueryKey,
  getCrmMembersByIdQueryKey,
  getCrmMembersInfiniteOptions,
  getCrmMembersOptions,
  getCrmMembersQueryKey,
  postCrmMembersByIdBlacklistMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmMembersResponse } from '@/lib/api/types.gen';

import {
  BLACKLIST_REASON_OPTIONS,
  MEMBER_NUMBER_MAX_LENGTH,
} from '../_constants/blacklist.constants';
import {
  REGISTER_BLACKLIST_DEFAULT_VALUES,
  RegisterBlacklistFormSchema,
  type RegisterBlacklistFormValues,
} from '../_schemas/register-blacklist-form.schema';

type MemberOption = NonNullable<GetCrmMembersResponse['members']>[number];

/** One page of combobox results; more are appended on scroll (FR-038). */
const MEMBER_SEARCH_PAGE_SIZE = 20;

interface BlacklistRegisterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * FR-039 / FR-042 — the avatar the combobox rows and the identity card share.
 *
 * `Avatar` rather than `next/image`: `face_photo_url` is null for most seeded members, and
 * the shared primitive already degrades to initials. Pointing an `<Image>` at a
 * placeholder path instead would 404 on every member without a photo.
 */
function MemberAvatar({
  member,
  className,
}: Readonly<{ member: MemberOption; className: string }>) {
  const initials = member.name_kanji
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('');
  return (
    <Avatar className={`shrink-0 ${className}`}>
      <AvatarImage src={member.face_photo_url ?? undefined} alt={member.name_kanji} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}

export function BlacklistRegisterSheet({
  open,
  onOpenChange,
}: Readonly<BlacklistRegisterSheetProps>) {
  const queryClient = useQueryClient();

  const form = useForm<RegisterBlacklistFormValues>({
    resolver: zodResolver(RegisterBlacklistFormSchema),
    defaultValues: REGISTER_BLACKLIST_DEFAULT_VALUES,
  });

  // ── Member resolution ──────────────────────────────────────────────────────
  const [memberNumberInput, setMemberNumberInput] = useState('');
  /** Set only by the combobox; the number field resolves through the lookup query below. */
  const [pickedMember, setPickedMember] = useState<MemberOption | null>(null);
  const [comboOpen, setComboOpen] = useState(false);
  const [comboSearch, setComboSearch] = useState('');

  const debouncedNumber = useDebounce(memberNumberInput.trim(), 300);

  /**
   * FR-036 — the 会員番号 field resolves by exact member number. `match_mode=prefix` makes
   * the mock behave like the real endpoint, whose search is `ILIKE 'kw%'` on every field
   * except the unique keys, which match exactly (FR-038a).
   */
  const {
    data: lookupData,
    isFetching: isLookingUp,
    isError: lookupFailed,
  } = useQuery({
    ...getCrmMembersOptions({
      query: { search: debouncedNumber, match_mode: 'prefix', limit: 5 },
    }),
    enabled: open && debouncedNumber.length > 0,
  });

  const lookupHit = useMemo(() => {
    if (!debouncedNumber) return null;
    const candidates = lookupData?.members ?? [];
    return (
      candidates.find((m) => m.member_number.toLowerCase() === debouncedNumber.toLowerCase()) ??
      null
    );
  }, [lookupData, debouncedNumber]);

  /**
   * `idle` while the field is empty, then `found` / `not_found` once a lookup settles.
   * Kept out of render-time derivation so the destructive border does not flash while a
   * request is still in flight.
   *
   * `error` is deliberately a state of its own: a lookup that could not run must never
   * fall through to `not_found`, which would tell the operator the member does not exist
   * when the system simply failed to check.
   */
  const lookupStatus: 'idle' | 'pending' | 'found' | 'not_found' | 'error' = !debouncedNumber
    ? 'idle'
    : isLookingUp
      ? 'pending'
      : lookupFailed
        ? 'error'
        : lookupHit
          ? 'found'
          : 'not_found';

  /**
   * The resolved member is **derived**, not synchronised into state. Mirroring the lookup
   * result into a `useState` inside an effect would cascade a render on every settled
   * query for no gain — the value is a pure function of what the operator typed.
   *
   * The combobox pick wins only while the number field still holds that member's number;
   * FR-037 then falls out for free, because editing the field away invalidates the pick.
   */
  const selectedMember: MemberOption | null =
    lookupHit ?? (pickedMember?.member_number === memberNumberInput ? pickedMember : null);

  // ── Combobox search (name / kana / phone / email) ──────────────────────────
  const debouncedCombo = useDebounce(comboSearch, 300);
  /**
   * FR-038 – FR-041 — paged, not a single capped request. The member table is the largest
   * in the CRM, so a fixed `limit` would silently truncate the result to its first page and
   * hide matches the operator searched for. The search itself stays server-side; the
   * combobox only appends pages as the list is scrolled.
   */
  const {
    data: searchData,
    isFetching: isSearching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    ...getCrmMembersInfiniteOptions({
      query: {
        search: debouncedCombo || undefined,
        match_mode: 'prefix',
        limit: MEMBER_SEARCH_PAGE_SIZE,
      },
    }),
    enabled: open && comboOpen,
    initialPageParam: 1,
    getNextPageParam: (lastPage: GetCrmMembersResponse, allPages) => {
      const loadedPages = allPages.length;
      return loadedPages < (lastPage.pagination?.total_pages ?? 0) ? loadedPages + 1 : undefined;
    },
  });
  const searchResults = useMemo(
    () => searchData?.pages.flatMap((page) => page.members ?? []) ?? [],
    [searchData],
  );

  const handleSelectFromCombo = (member: MemberOption | null) => {
    if (!member) return;
    setPickedMember(member);
    setMemberNumberInput(member.member_number);
    setComboOpen(false);
    setComboSearch('');
  };

  /**
   * FR-050a — the member-list projection already reports an active entry, so an
   * already-listed member is refused here rather than after a round-trip. The server's
   * one-active-row guard still runs (FR-050); this only closes the common case.
   */
  const isAlreadyBlacklisted = selectedMember?.has_blacklist === true;

  // ── Submit ─────────────────────────────────────────────────────────────────
  const resetAll = () => {
    form.reset(REGISTER_BLACKLIST_DEFAULT_VALUES);
    setMemberNumberInput('');
    setPickedMember(null);
    setComboSearch('');
    setComboOpen(false);
  };

  const { mutate, isPending } = useMutation({
    ...postCrmMembersByIdBlacklistMutation(),
    onSuccess: (_data, variables) => {
      toast.success('ブラックリストに登録しました');
      void queryClient.invalidateQueries({ queryKey: getCrmBlacklistQueryKey() });
      /**
       * FR-050a — the member lookups carry `has_blacklist`, which the registration just
       * flipped. Leaving them cached would let the very next lookup offer this member
       * again with no warning, pushing the duplicate all the way to the server's 409.
       */
      void queryClient.invalidateQueries({ queryKey: getCrmMembersQueryKey() });
      /**
       * That member's own detail too: it gates 個人情報削除 / 再入会 on the same registration,
       * so a copy cached before this Sheet ran would still present the member as unlisted.
       */
      void queryClient.invalidateQueries({
        queryKey: getCrmMembersByIdQueryKey({ path: { id: variables.path.id } }),
      });
      onOpenChange(false);
      resetAll();
    },
  });

  const onSubmit = (data: RegisterBlacklistFormValues) => {
    if (!selectedMember) return;
    mutate({
      path: { id: selectedMember.id },
      // FR-043 — V0's control is single-select; the contract takes an array.
      body: { reason_categories: [data.reason], memo: data.memo?.trim() || undefined },
    });
  };

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    // FR-052 — closing resets every field, not just the form ones.
    if (!next) resetAll();
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {/*
        FR-034 — 480 px wide. The `max-w` has to carry the same `data-[side=right]:`
        variant as SheetContent's own `data-[side=right]:sm:max-w-sm`: tailwind-merge
        cannot dedupe a plain `sm:max-w-*` against a variant-prefixed one, and the base
        rule's attribute selector also outranks a bare class — so an unprefixed override
        silently loses and the Sheet renders at 384 px.
      */}
      <SheetContent className="flex w-120 flex-col gap-0 overflow-hidden p-0 data-[side=right]:sm:max-w-120">
        <div className="shrink-0 border-b px-6 py-4">
          <SheetHeader className="gap-0 p-0">
            <SheetTitle className="text-sm font-semibold">ブラックリスト手動登録</SheetTitle>
            <SheetDescription className="sr-only">
              対象会員をブラックリストに手動登録します
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          <Form {...form}>
            <form id="blacklist-register-form" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-4 py-4">
                {/* 会員番号 — autofill (FR-035 – FR-037) */}
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">
                    会員番号
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    placeholder="例：M-00001"
                    maxLength={MEMBER_NUMBER_MAX_LENGTH}
                    value={memberNumberInput}
                    onChange={(e) => setMemberNumberInput(e.target.value)}
                    className={
                      lookupStatus === 'found'
                        ? 'border-success focus-visible:ring-success/30'
                        : lookupStatus === 'not_found' || lookupStatus === 'error'
                          ? 'border-destructive focus-visible:ring-destructive/30'
                          : ''
                    }
                  />
                  {lookupStatus === 'not_found' && (
                    <p className="text-destructive text-xs">該当する会員が見つかりません</p>
                  )}
                  {lookupStatus === 'error' && (
                    <p className="text-destructive text-xs">
                      会員情報の取得に失敗しました。通信状況をご確認のうえ、再度お試しください。
                    </p>
                  )}
                  {lookupStatus === 'idle' && (
                    <p className="text-muted-foreground text-xs">
                      会員番号を入力すると氏名・生年月日・顔写真が自動反映されます
                    </p>
                  )}
                </div>

                {/* 氏名・カナ・電話番号での検索 (FR-038 – FR-041) */}
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground text-sm font-medium">
                    または氏名・カナ・電話番号で検索
                  </Label>
                  <SearchableSelect<MemberOption>
                    value={selectedMember?.id ?? null}
                    valueLabel={
                      selectedMember
                        ? `${selectedMember.name_kanji}（${selectedMember.member_number}）`
                        : undefined
                    }
                    options={searchResults}
                    placeholder="ID・氏名・カナ・電話番号・メールで検索"
                    searchPlaceholder="ID・氏名・カナ・電話番号・メールで検索..."
                    emptyMessage="該当する会員が見つかりません"
                    loadingMessage="会員を読み込み中..."
                    open={comboOpen}
                    onOpenChange={setComboOpen}
                    onSearchChange={setComboSearch}
                    onSelect={handleSelectFromCombo}
                    getOptionKey={(m) => m.id}
                    getOptionLabel={(m) => m.name_kanji}
                    getOptionKeywords={(m) =>
                      [m.member_number, m.name_kanji, m.name_kana].filter(Boolean).join(' ')
                    }
                    renderOption={(m) => (
                      <div className="flex items-center gap-3 py-1">
                        <MemberAvatar member={m} className="size-9" />
                        <div className="flex min-w-0 flex-col">
                          <span className="text-sm font-medium">{m.name_kanji}</span>
                          <span className="text-muted-foreground truncate text-xs">
                            {[m.member_number, m.name_kana, m.store_name]
                              .filter(Boolean)
                              .join(' ・ ')}
                          </span>
                        </div>
                      </div>
                    )}
                    // The first page replaces the list with a loading row; a later page
                    // appends below it, so the two states must not share one flag.
                    isLoading={isSearching && !isFetchingNextPage}
                    hasMore={hasNextPage}
                    isLoadingMore={isFetchingNextPage}
                    onLoadMore={() => void fetchNextPage()}
                  />

                  {/* Resolved identity card (FR-042) */}
                  {selectedMember && (
                    <div className="border-success/30 bg-success/10 mt-1 flex items-center gap-3 rounded-md border p-3">
                      <MemberAvatar member={selectedMember} className="size-20" />
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <UserCheck className="text-success size-3 shrink-0" />
                          <span className="text-sm font-medium">{selectedMember.name_kanji}</span>
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {selectedMember.name_kana}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          生年月日：{formatDateYYYYMMDD(selectedMember.date_of_birth, '—')}
                        </span>
                        <span className="text-muted-foreground font-mono text-xs">
                          {/* A member with no primary store must not leave a dangling ` / `;
                              degrades to an em dash like the list column and head-up card. */}
                          ID: {selectedMember.member_number} / {selectedMember.store_name || '—'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Already-listed block (FR-050a) */}
                  {isAlreadyBlacklisted && (
                    <Alert className="border-destructive/20 bg-destructive/10 text-destructive">
                      <ShieldBan className="size-4" />
                      <AlertDescription className="text-sm">
                        この会員はすでにブラックリストに登録されています。
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* 登録理由 (FR-043) */}
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        登録理由
                        <span className="text-destructive ml-1">*</span>
                      </FormLabel>
                      {/* `?? ''` keeps the Select controlled from first render: an
                          undefined default would make Base UI switch it from uncontrolled
                          to controlled the moment a reason is picked. */}
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ''}
                        items={toSelectItems(BLACKLIST_REASON_OPTIONS)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="理由を選択してください" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BLACKLIST_REASON_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* メモ (FR-044) */}
                <FormField
                  control={form.control}
                  name="memo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        メモ
                        <span className="bg-muted text-muted-foreground ml-1.5 inline-flex items-center rounded-sm px-1.5 py-0.5 align-middle text-xs leading-none font-medium">
                          任意
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          maxLength={TEXTAREA_MAX_LENGTH}
                          placeholder="補足情報を入力してください"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="-mx-6 w-[calc(100%+48px)]" />

              {/* FR-045 — the deletion-invariant warning (A-01 L267-L269) */}
              <div className="py-4">
                <Alert className="border-warning/20 bg-warning/10 text-warning">
                  <TriangleAlert className="size-4" />
                  <AlertDescription className="text-sm">
                    ブラックリストに登録された会員の個人情報は削除できなくなります
                  </AlertDescription>
                </Alert>
              </div>
            </form>
          </Form>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t p-4">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => handleOpenChange(false)}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            form="blacklist-register-form"
            variant="destructive"
            size="lg"
            className="flex-1"
            // FR-047 / FR-050a — no member resolved, or the member is already listed.
            disabled={!selectedMember || isAlreadyBlacklisted || isPending}
          >
            {isPending ? '登録中...' : '登録'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
