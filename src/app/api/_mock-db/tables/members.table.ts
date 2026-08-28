import type {
  EkycResult,
  FamilyRegistrationStatus,
  FamilyRelationship,
} from '@/app/api/_schemas/family-registration.schema';
import type {
  GateStopReason,
  GateStopSetPattern,
  GetMemberDetailResponse,
  UpdateBasicInfoRequest,
  UpdateHealthInfoRequest,
  UpdateMarketingConsentRequest,
  UpdateMemberRequest,
} from '@/app/api/_schemas/member.schema';
import type { MembershipApplication } from '@/app/api/_schemas/membership-application.schema';
import { formatISODateLocal } from '@/utils/date.util';

import { Brand, type MainBrand, MemberStatus, MemberType } from '@/lib/api/types.gen';

import type { DbType } from '../_db.types';
import {
  type ContractRow,
  DEFAULT_MEMBER_MAIN_CONTRACT,
  type Member,
  type MemberProfile,
  type MemberRow,
  buildMemberContractData,
  createMember,
  familyRelationshipToJa,
  joinJapaneseName,
  memberToListItem,
  resolveBrand,
  resolveContractTypeFromMemberType,
  resolveMainBrand,
  splitJapaneseName,
  toIsoDate,
} from '../seeds/membership.seed';
import type { TransferRow } from '../seeds/transfer.seed';
import type { ContractsRecord } from '../types/contracts.type';
import type { MembershipApplicationDetail } from '../types/membership-applications.type';
import { MEMBERLESS_STORE_CODE } from './store.table';

const DEFAULT_MEMBER_MAIN_CONTRACT_ID = 'MC001';

export function createMembersTables(getDb: () => DbType) {
  return {
    members: {
      _members: [] as MemberRow[],
      _seeded: false,

      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        const db = getDb();
        db.stores._seed();
        // The member-free store is held out of the round-robin below; assigning members to
        // it would destroy the empty scope it exists to provide, and including it would also
        // shift every other member onto a different store.
        const storeRows = db.stores._rows.filter((s) => s.club_code !== MEMBERLESS_STORE_CODE);
        const names = [
          { kanji: '佐藤 花子', kana: 'サトウ ハナコ' },
          { kanji: '鈴木 太郎', kana: 'スズキ タロウ' },
          { kanji: '田中 美咲', kana: 'タナカ ミサキ' },
          { kanji: '山田 健太', kana: 'ヤマダ ケンタ' },
          { kanji: '中村 由美', kana: 'ナカムラ ユミ' },
        ];
        const now = new Date();
        const dayMs = 24 * 60 * 60 * 1000;
        db.mainContracts._seed();
        const mainContracts = db.mainContracts.getList();
        const defaultContract =
          mainContracts.find((contract) => contract.id === DEFAULT_MEMBER_MAIN_CONTRACT_ID) ??
          mainContracts[0];
        const byId = new Map(mainContracts.map((contract) => [contract.id, contract]));
        // Promotion codes used at enrollment. These are campaign master **codes**
        // (`db.campaigns`), not campaign names: the filter matches on the code, and
        // the screen resolves the display name from the master — QA01 §4-3 (backend
        // answer 2026-08-10). Pulled live from the campaign seed so the two never
        // drift apart; a trailing `undefined` keeps ~1/4 of members with no code.
        db.campaigns._seed();
        const seedPromoCodes: (string | undefined)[] = [
          ...db.campaigns
            .getList()
            .map((campaign) => campaign.campaign_code)
            .filter((code): code is string => !!code),
          undefined,
        ];
        for (let i = 1; i <= 200; i++) {
          const id = `M-${String(i).padStart(5, '0')}`;
          const name = names[i % names.length];
          const store = storeRows[i % storeRows.length]!;
          const memberType = (
            ['regular', 'family', 'corporate', 'one_day_member'] as MemberProfile['member_type'][]
          )[i % 4]!;
          const preferredContractId =
            memberType === 'one_day_member'
              ? 'MC005'
              : memberType === 'family'
                ? 'MC011'
                : memberType === 'corporate'
                  ? 'MC007'
                  : DEFAULT_MEMBER_MAIN_CONTRACT_ID;
          const mainContract = byId.get(preferredContractId) ?? defaultContract;
          const displayName = mainContract?.name ?? DEFAULT_MEMBER_MAIN_CONTRACT;
          const mainContractId = mainContract?.id ?? DEFAULT_MEMBER_MAIN_CONTRACT_ID;
          const phone = `090${String(1000 + (i % 9000)).slice(-4)}${String(1000 + (i % 9000)).slice(-4)}`;
          const email = `member${String(i).padStart(5, '0')}@example.jp`;
          // Spread join dates across 今月/先月/今年/昨年/older so the 入会期間 filter returns results
          const joinBucket = i % 5;
          const joinDay = (i % 28) + 1;
          const joinedDate =
            joinBucket === 0
              ? new Date(now.getFullYear(), now.getMonth(), joinDay)
              : joinBucket === 1
                ? new Date(now.getFullYear(), now.getMonth() - 1, joinDay)
                : joinBucket === 2
                  ? new Date(now.getFullYear(), 0, joinDay)
                  : joinBucket === 3
                    ? new Date(now.getFullYear() - 1, i % 12, joinDay)
                    : new Date(now.getFullYear() - 2, i % 12, joinDay);
          const promotionCode = seedPromoCodes[i % seedPromoCodes.length];
          // The three statuses that have no slot in the 6-way cycle below. They are
          // rare in practice, so a thin bucket each is enough to exercise the label
          // mapping and the grouped status filter.
          const rareStatus: MemberProfile['status'] | undefined =
            i % 50 === 9
              ? 'provisional'
              : i % 50 === 19
                ? 'pending_suspended'
                : i % 50 === 29
                  ? 'withdrawal_pending_processing'
                  : undefined;
          // Gate stop is orthogonal to member status, so the seed must contain
          // gate-stopped members on more than one status — otherwise the
          // 「ゲートストップ」 filter and the status filter can never be told apart.
          // `i % 30 === 7` lands only on `i % 6 === 1` (suspended) members.
          // A 仮会員 has not completed enrolment, so a gate stop on them is nonsense.
          const hasGateStop = (i % 6 === 3 || i % 30 === 7) && rareStatus !== 'provisional';
          const member = {
            name_kanji: name.kanji,
            name_kana: name.kana,
            phone,
            email,
            birthday: `199${i % 10}-0${(i % 9) + 1}-15`,
            // 020-member-form: cycle through all 4 gender values so 回答しない
            // (prefer_not_to_say) members exist in the seed for manual round-trip checks
            gender: (['male', 'female', 'other', 'prefer_not_to_say'] as MemberProfile['gender'][])[
              i % 4
            ]!,
            member_type: memberType,
            // The `i % 6 === 3` slot used to be the `gate_stop` status. Gate stop is
            // now an orthogonal flag (see `hasGateStop` above), so that slot holds a
            // plain active member who also carries a stop — same population, correct
            // shape.
            status:
              rareStatus ??
              (
                [
                  'active',
                  'suspended',
                  'withdrawn',
                  'active',
                  'pending_withdrawal',
                  'forced_withdrawal',
                ] as MemberProfile['status'][]
              )[i % 6],
            contract_type: resolveContractTypeFromMemberType(memberType),
            store_name: store.name,
            store_id: store.id,
            brand: store.brand as Brand,
            contract_name: displayName,
            contract_id: mainContractId,
            joined_at: toIsoDate(joinedDate),
            last_visit_date:
              i % 5 === 0
                ? undefined
                : toIsoDate(new Date(now.getTime() - ((i * 3) % 420) * dayMs)),
            has_unpaid: i % 7 === 0,
            promotion_code: promotionCode,
            // `i % 6 === 4` are the pending_withdrawal members. `i % 30 === 18` adds
            // *active* members so the 移籍申請「解約手数料期間中」block is observable at all —
            // 移籍申請 is only offered while the member is active, so without this second
            // bucket that acceptance scenario could never be reproduced.
            in_cancellation_period: i % 6 === 4 || i % 30 === 18,
            is_option_restricted: i % 7 === 0,
            emergency_contact_name: name.kanji,
            emergency_contact_relationship: '配偶者',
            emergency_contact_phone: '09087654321',
            gate_stop_info: null as MemberProfile['gate_stop_info'],
            usage_start_date: undefined as string | undefined,
            cancellation_fee_until: undefined as string | undefined,
            active_suspension: undefined as NonNullable<
              GetMemberDetailResponse['currentMainContract']
            >['activeSuspension'],
            pending_withdrawal: undefined as NonNullable<
              GetMemberDetailResponse['currentMainContract']
            >['pendingWithdrawal'],
            active_penalty: null as GetMemberDetailResponse['activePenalty'],
            blacklist_info: null as GetMemberDetailResponse['blacklist'],
          };
          if (hasGateStop) {
            member.gate_stop_info = {
              pattern: 'always_deny',
              reasonCategory: 'unpaid',
              // Audit only — which store's staff set it. A gate stop always covers
              // every store, so this is never a scope.
              setAtStore: { storeId: store.id, code: store.id, name: store.name },
              messageType: 'deny_after_confirm',
              message: '未納金のため、入館を制限します。',
              setAt: new Date().toISOString(),
              setBy: { staffId: 'staff-mock', displayName: 'スタッフ' },
            };
          }
          if (member.in_cancellation_period) {
            // JOYFIT: 12 months from the contract start (A-01 制限事項)
            member.cancellation_fee_until = formatISODateLocal(
              new Date(joinedDate.getFullYear() + 1, joinedDate.getMonth(), joinedDate.getDate()),
            );
          }
          if (member.status === 'suspended') {
            // FR-016: the 休会解除 sheet renders these read-only, so every suspended
            // member needs an active suspension or the sheet shows only placeholders.
            member.active_suspension = {
              suspensionApplicationId: `${id}-susp-001`,
              startDate: formatISODateLocal(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
              endDate: formatISODateLocal(new Date(now.getFullYear(), now.getMonth() + 3, 0)),
            };
          }
          if (member.status === 'pending_withdrawal') {
            member.pending_withdrawal = {
              withdrawalApplicationId: `${id}-wd-001`,
              scheduledWithdrawalDate: formatISODateLocal(
                new Date(now.getFullYear(), now.getMonth() + 1, 0),
              ),
            };
            // G-A needs both sides of the cancellability rule present in the seed:
            // usage not yet started → 退会取り消し allowed; already started → blocked.
            member.usage_start_date =
              i % 12 === 4
                ? formatISODateLocal(new Date(now.getFullYear(), now.getMonth() + 2, 1))
                : formatISODateLocal(new Date(now.getFullYear(), now.getMonth() - 2, 1));
          }
          if (i % 30 === 12) {
            // D-01 FR-010 reservation penalty. Bucket chosen so it only ever lands on
            // an active member (i % 30 === 12 ⊂ i % 6 === 0) — the penalty is orthogonal
            // to member status, but an active member is where it is worth demonstrating.
            const appliedAt = new Date(now.getTime() - 6 * dayMs);
            const weekStart = new Date(now.getTime() - 13 * dayMs);
            const weekEnd = new Date(now.getTime() - 7 * dayMs);
            member.active_penalty = {
              penaltyType: 'studio',
              endAt: new Date(now.getTime() + dayMs).toISOString(),
              noShowCount: 2,
              appliedAt: appliedAt.toISOString(),
              // D-01 FR-010: the two no-shows behind `noShowCount`, shown read-only in the
              // 予約ペナルティ解除 sheet.
              triggeringReservations: [
                `${formatISODateLocal(new Date(now.getTime() - 12 * dayMs)).replace(/-/g, '/')} 19:00 ヨガ基礎`,
                `${formatISODateLocal(new Date(now.getTime() - 9 * dayMs)).replace(/-/g, '/')} 10:00 ピラティス`,
              ],
              targetWeek: `${formatISODateLocal(weekStart).replace(/-/g, '/')}〜${formatISODateLocal(weekEnd).replace(/-/g, '/')}`,
            };
          }
          if (member.status === 'forced_withdrawal' || i % 12 === 8) {
            // A-01 FR-016: forced withdrawal always carries an automatic blacklist entry.
            // `i % 12 === 8` additionally covers plain `withdrawn` members (i % 6 === 2) so the
            // blacklist-blocked 個人情報削除 / 再入会 paths have a subject, while the other
            // withdrawn members stay clean for the happy path.
            member.blacklist_info = {
              blacklistId: `${id}-bl-001`,
              isActive: true,
              reason:
                member.status === 'forced_withdrawal' ? '2ヶ月連続未納による強制退会' : '迷惑行為',
              registeredAt: new Date(now.getTime() - 30 * dayMs).toISOString(),
              registeredBy: {
                staffId: 'staff-mock',
                displayName: member.status === 'forced_withdrawal' ? 'System' : '管理者A',
              },
            };
          }
          this._members.push(createMember(id, member));
        }

        /*
         * Layout / output-escaping fixtures. Both carry a leave-eligible status, so the
         * A-03 seed derives an application for each and their names reach the list cell,
         * the detail head-up card and the confirmation dialogs — the places a hostile or
         * over-long value actually has to survive. Appended after the 200 generated
         * members so no existing id, store or status assignment moves.
         */
        const fixtureStore = storeRows[0]!;
        const hostileNameFixtures: {
          id: string;
          nameKanji: string;
          nameKana: string;
          status: MemberProfile['status'];
        }[] = [
          {
            id: 'M-00201',
            // 255 characters with no break point at all — the harsher of the two layout
            // cases in the shared GUI checklist (the spaced variant is covered by M-00202).
            nameKanji: '長'.repeat(255),
            nameKana: 'ナガ'.repeat(30),
            // A cancellable withdrawal rather than a suspension, so the 255-character name
            // also has to survive the confirmation dialog — a fixed-width surface where an
            // over-long value can push the footer buttons out of reach.
            status: 'pending_withdrawal',
          },
          {
            id: 'M-00202',
            // Must render as literal text everywhere it is echoed, never as markup.
            nameKanji: '<script>alert(1)</script><img src=x onerror=alert(2)> 山田 太郎',
            nameKana: 'スクリプト タロウ',
            status: 'pending_withdrawal',
          },
        ];

        for (const fixture of hostileNameFixtures) {
          this._members.push(
            createMember(fixture.id, {
              name_kanji: fixture.nameKanji,
              name_kana: fixture.nameKana,
              phone: '09099998888',
              email: `${fixture.id.toLowerCase()}@example.jp`,
              birthday: '1990-01-15',
              gender: 'prefer_not_to_say',
              member_type: 'regular',
              contract_type: resolveContractTypeFromMemberType('regular'),
              status: fixture.status,
              store_id: fixtureStore.id,
              store_name: fixtureStore.name,
              brand: fixtureStore.brand as Brand,
              contract_name: DEFAULT_MEMBER_MAIN_CONTRACT,
              contract_id: DEFAULT_MEMBER_MAIN_CONTRACT_ID,
              joined_at: toIsoDate(new Date(now.getFullYear() - 1, 0, 15)),
              last_visit_date: toIsoDate(new Date(now.getTime() - 5 * dayMs)),
              has_unpaid: false,
              emergency_contact_name: fixture.nameKanji,
              emergency_contact_relationship: '配偶者',
              emergency_contact_phone: '09087654321',
              in_cancellation_period: false,
              is_option_restricted: false,
              // A cancellable withdrawal, so the fixture name also reaches the
              // cancellation dialog where a long value could push the buttons off-screen.
              usage_start_date:
                fixture.status === 'pending_withdrawal'
                  ? formatISODateLocal(new Date(now.getFullYear() + 1, now.getMonth(), 1))
                  : undefined,
              active_suspension:
                fixture.status === 'suspended'
                  ? {
                      suspensionApplicationId: `${fixture.id}-susp-001`,
                      startDate: formatISODateLocal(
                        new Date(now.getFullYear(), now.getMonth() - 1, 1),
                      ),
                      endDate: formatISODateLocal(
                        new Date(now.getFullYear(), now.getMonth() + 3, 0),
                      ),
                    }
                  : undefined,
              pending_withdrawal:
                fixture.status === 'pending_withdrawal'
                  ? {
                      withdrawalApplicationId: `${fixture.id}-wd-001`,
                      scheduledWithdrawalDate: formatISODateLocal(
                        new Date(now.getFullYear(), now.getMonth() + 1, 0),
                      ),
                    }
                  : undefined,
            }),
          );
        }
      },

      /**
       * The 家族会員 block of the member detail response.
       *
       * Resolved from the PARENT, so opening a child's page lists their siblings
       * too. Order is guaranteed — parent first, then member number ascending —
       * and withdrawn members are left out (backend design answer 2026-08-10,
       * QA02 §2.1).
       */
      buildFamilyBundle(member_id: string): GetMemberDetailResponse['family'] {
        this._seed();
        const db = getDb();
        const ownChildren = db.family.listChildRelationships(member_id);
        const parentId =
          ownChildren.length > 0 ? member_id : db.family.getPrimaryMemberIdForChild(member_id);

        if (!parentId) {
          return { role: 'none', parent: null, members: [], remainingSlots: null };
        }

        const isListed = (row: MemberRow | undefined): row is MemberRow =>
          !!row &&
          row.memberStatus !== MemberStatus.WITHDRAWN &&
          row.memberStatus !== MemberStatus.FORCED_WITHDRAWAL;

        const toEntry = (row: MemberRow) => ({
          memberId: row.memberId,
          memberNumber: row.memberNumber,
          displayName: joinJapaneseName(row.personalInfo.lastName, row.personalInfo.firstName),
          isSelf: row.memberId === member_id,
          memberStatus: row.memberStatus,
        });

        const parentRow = this._members.find((m) => m.memberId === parentId);
        const childRows = db.family
          .listChildRelationships(parentId)
          .map((rel) => this._members.find((m) => m.memberId === rel.child_member_id))
          .filter(isListed)
          .sort((a, b) => a.memberNumber.localeCompare(b.memberNumber));

        const members = [
          ...(isListed(parentRow) ? [toEntry(parentRow)] : []),
          ...childRows.map(toEntry),
        ];

        // Read the limit straight off the parent's brand group. Going through
        // `getBrandSettingsByPrimaryMemberId` would call back into `members.get()`,
        // which calls this function — an infinite loop.
        const limit = db.family.getFamilyMemberLimit(parentRow?.brandGroup);
        return {
          role: parentId === member_id ? 'parent' : 'child',
          parent:
            parentId === member_id || !parentRow
              ? null
              : {
                  memberId: parentRow.memberId,
                  memberNumber: parentRow.memberNumber,
                  displayName: joinJapaneseName(
                    parentRow.personalInfo.lastName,
                    parentRow.personalInfo.firstName,
                  ),
                },
          members,
          remainingSlots: Math.max(limit - childRows.length, 0),
        };
      },

      // Deliberately does NOT attach `family`: other tables call `get()` while
      // resolving family data, so building the bundle here would recurse. The
      // member-detail route calls `buildFamilyBundle` itself.
      get(id: string): Member | undefined {
        this._seed();
        return this._members.find((m) => m.memberId === id);
      },

      getList() {
        this._seed();
        return this._members.map(memberToListItem);
      },

      getSummary() {
        this._seed();
        const all = this._members;
        const total = all.length;
        const active = all.filter((m) => m.memberStatus === 'active').length;
        const suspended = all.filter((m) => m.memberStatus === 'suspended').length;
        const unpaidMembers = all.filter((m) => m._listMeta?.has_unpaid === true);
        const pending_withdrawal = all.filter(
          (m) => m.memberStatus === 'pending_withdrawal',
        ).length;
        return {
          active_count: active,
          active_change_percent: 5.8,
          suspended_count: suspended,
          suspended_percent: total > 0 ? Math.round((suspended / total) * 1000) / 10 : 0,
          unpaid_count: unpaidMembers.length,
          unpaid_total_yen: unpaidMembers.length * 15700,
          scheduled_withdrawal_count: pending_withdrawal,
          withdrawal_rate_percent:
            total > 0 ? Math.round((pending_withdrawal / total) * 1000) / 10 : 0,
        };
      },

      createFromApplication(application: MembershipApplicationDetail): Member {
        this._seed();
        const db = getDb();
        const nextNumber = this._members.length + 1;
        const id = `M-${String(nextNumber).padStart(5, '0')}`;
        const now = new Date();
        // Regular member — the enrolment application never carries a family/
        // corporate classification (both left the admin form in v5, research R8).
        const memberType: MemberProfile['member_type'] = 'regular';
        const rawPlan = application.plan_name || application.plan_id || '';
        db.mainContracts._seed();
        const mainContracts = db.mainContracts.getList();
        const defaultContract =
          mainContracts.find((contract) => contract.id === DEFAULT_MEMBER_MAIN_CONTRACT_ID) ??
          mainContracts[0];
        const selectedContract =
          mainContracts.find((contract) => contract.id === rawPlan) ??
          mainContracts.find((contract) => contract.name === rawPlan) ??
          defaultContract;
        const displayName = selectedContract?.name ?? DEFAULT_MEMBER_MAIN_CONTRACT;
        const mainContractId = selectedContract?.id ?? DEFAULT_MEMBER_MAIN_CONTRACT_ID;
        const row = createMember(id, {
          name_kanji: application.applicant_name || '',
          name_kana: application.applicant_kana || '',
          phone: application.phone_real || '',
          email: application.email_real || '',
          birthday: application.birth_date || '',
          gender: 'other',
          member_type: memberType,
          status: 'active',
          contract_type: resolveContractTypeFromMemberType(memberType),
          store_name: application.store_name,
          store_id: application.store_id,
          brand: resolveBrand(application.brand_name, 'fit365'),
          joined_at: toIsoDate(now),
          contract_name: displayName,
          contract_id: mainContractId,
          last_visit_date: toIsoDate(new Date(application.usage_start_date ?? now)),
          has_unpaid: false,
          in_cancellation_period: false,
          is_option_restricted: false,
          emergency_contact_name: '',
          emergency_contact_relationship: '',
          emergency_contact_phone: '',
        });
        this._members.push(row);
        return row;
      },

      createFromFamilyRegistration(registration: {
        applicant_name: string;
        relationship: FamilyRelationship;
        applicant?: { birthday?: string; phone?: string; email?: string };
        primary_member_id: string;
      }): MemberRow {
        this._seed();
        const db = getDb();
        const nextNumber = this._members.length + 1;
        const id = `M-${String(nextNumber).padStart(5, '0')}`;
        const primary = this.get(registration.primary_member_id);
        db.stores._seed();
        const storeRows = db.stores._rows;
        const fallbackStore = storeRows[nextNumber % storeRows.length]!;
        const store = primary?.primaryStore.storeId
          ? { id: primary.primaryStore.storeId, name: primary.primaryStore.name }
          : { id: fallbackStore.id, name: fallbackStore.name };
        db.mainContracts._seed();
        const contracts = db.mainContracts.getList();
        const displayName =
          contracts[nextNumber % contracts.length]?.name ?? DEFAULT_MEMBER_MAIN_CONTRACT;
        const mainContractId =
          contracts.find((contract) => contract.name === displayName)?.id ??
          DEFAULT_MEMBER_MAIN_CONTRACT_ID;
        const now = new Date();
        const row = createMember(id, {
          name_kanji: registration.applicant_name,
          name_kana: registration.applicant_name,
          phone:
            registration.applicant?.phone ??
            `090${String(1000 + (nextNumber % 9000)).slice(-4)}${String(2000 + (nextNumber % 8000)).slice(-4)}`,
          email:
            registration.applicant?.email ??
            `family${String(nextNumber).padStart(5, '0')}@example.jp`,
          birthday: registration.applicant?.birthday ?? '',
          gender: 'male',
          member_type: 'family' as MemberProfile['member_type'],
          status: 'active' as MemberProfile['status'],
          contract_type: 'family',
          store_name: store.name,
          store_id: store.id,
          brand: primary?.primaryStore.brandEnum ?? (nextNumber % 2 === 0 ? 'fit365' : 'joyfit'),
          joined_at: toIsoDate(now),
          contract_name: displayName,
          contract_id: mainContractId,
          last_visit_date: undefined,
          has_unpaid: false,
          in_cancellation_period: false,
          is_option_restricted: false,
          emergency_contact_name: registration.applicant_name,
          emergency_contact_relationship: registration.relationship,
          emergency_contact_phone: registration.applicant?.phone ?? '',
        });
        this._members.push(row);
        return row;
      },

      update(id: string, body: UpdateMemberRequest): Member | undefined {
        this._seed();
        if (body.basic_info) {
          this.updateBasicInfo(id, body.basic_info);
        }
        if (body.profile_info) {
          this.updateProfileInfo(id, body.profile_info);
        }
        return this.get(id);
      },

      updateBasicInfo(id: string, body: UpdateBasicInfoRequest): Member | undefined {
        this._seed();
        const idx = this._members.findIndex((m) => m.memberId === id);
        if (idx === -1) return undefined;
        const current = this._members[idx]!;
        const personalInfo = { ...current.personalInfo };
        if (body.last_name !== undefined) personalInfo.lastName = body.last_name;
        if (body.first_name !== undefined) personalInfo.firstName = body.first_name;
        if (body.last_name_kana !== undefined) personalInfo.lastNameKana = body.last_name_kana;
        if (body.first_name_kana !== undefined) personalInfo.firstNameKana = body.first_name_kana;
        if (body.birthday !== undefined) personalInfo.dateOfBirth = body.birthday;
        if (body.gender !== undefined) personalInfo.gender = body.gender;
        if (body.postal_code !== undefined) personalInfo.postalCode = body.postal_code;
        if (body.prefecture !== undefined) personalInfo.prefecture = body.prefecture;
        if (body.city !== undefined) personalInfo.city = body.city;
        if (body.address !== undefined) personalInfo.streetAddress = body.address;
        if (body.building !== undefined) personalInfo.building = body.building;
        if (body.phone !== undefined) personalInfo.phone = body.phone;
        if (body.email !== undefined) personalInfo.email = body.email;
        if (body.emergency_contact !== undefined) {
          personalInfo.emergencyContact = body.emergency_contact;
        }
        const updated: MemberRow = {
          ...current,
          personalInfo,
          memo: body.notes ?? current.memo,
        };
        this._members[idx] = updated;
        return updated;
      },

      updateProfileInfo(
        id: string,
        body: NonNullable<UpdateMemberRequest['profile_info']>,
      ): Member | undefined {
        this._seed();
        const db = getDb();
        const idx = this._members.findIndex((m) => m.memberId === id);
        if (idx === -1) return undefined;
        const current = this._members[idx]!;
        const nextContractType = body.member_type
          ? resolveContractTypeFromMemberType(body.member_type)
          : current._listMeta?.contract_type;
        db.mainContracts._seed();
        const mainContracts = db.mainContracts.getList();
        const defaultContract =
          mainContracts.find((contract) => contract.id === DEFAULT_MEMBER_MAIN_CONTRACT_ID) ??
          mainContracts[0];
        const selectedInitialContract =
          mainContracts.find((contract) => contract.id === body.contract_name) ??
          mainContracts.find((contract) => contract.name === body.contract_name) ??
          mainContracts.find((contract) => contract.name === current._listMeta?.contract_name) ??
          mainContracts.find((contract) => contract.name === current.contractName) ??
          defaultContract;
        let nextContractDisplayName = selectedInitialContract?.name ?? DEFAULT_MEMBER_MAIN_CONTRACT;
        let nextContractId = current._listMeta?.contract_id;

        if (body.contract_name) {
          db.contracts._seed();
          let contract = db.contracts.getByPlanName(body.contract_name);
          if (!contract) {
            const newContractId = `contract-member-${id}-${Date.now()}`;
            contract = db.contracts.create({
              contract_id: newContractId,
              data: buildMemberContractData({
                contract_id: newContractId,
                plan_name: body.contract_name,
                start_date: body.join_date ?? current.enrolledAt,
                monthly_fee:
                  mainContracts.find((item) => item.name === body.contract_name)
                    ?.price_including_tax ??
                  mainContracts.find((item) => item.id === body.contract_name)
                    ?.price_including_tax ??
                  defaultContract?.price_including_tax ??
                  0,
                created_at: new Date().toISOString(),
              }),
            });
          }
          nextContractId = contract.contract_id;
          nextContractDisplayName =
            mainContracts.find((item) => item.name === contract.data.main_contract.plan_name)
              ?.name ??
            mainContracts.find((item) => item.id === contract.data.main_contract.plan_name)?.name ??
            defaultContract?.name ??
            DEFAULT_MEMBER_MAIN_CONTRACT;
        }

        const nextBrand = resolveBrand(body.brand, current.primaryStore.brandEnum);
        const nextStoreId = body.join_store ?? current.primaryStore.storeId;
        const nextStoreName =
          body.join_store != null
            ? (db.stores.getById(body.join_store)?.name ?? current.primaryStore.name)
            : current.primaryStore.name;
        const updated: MemberRow = {
          ...current,
          memberType: body.member_type ?? current.memberType,
          enrolledAt: body.join_date ?? current.enrolledAt,
          brandGroup: resolveMainBrand(nextBrand),
          contractName: nextContractDisplayName,
          joinRoute: body.join_route ?? current.joinRoute,
          // The sub-brand now lives on the store the member belongs to.
          primaryStore: {
            ...current.primaryStore,
            storeId: nextStoreId,
            name: nextStoreName,
            brandEnum: nextBrand,
          },
          currentMainContract: current.currentMainContract
            ? {
                ...current.currentMainContract,
                contractId: nextContractId ?? current.currentMainContract.contractId,
              }
            : current.currentMainContract,
          personalInfo: {
            ...current.personalInfo,
            facePhotoUrl: body.photo_url ?? current.personalInfo.facePhotoUrl,
          },
          referral: body.referrer_member_id
            ? {
                ...current.referral,
                byMember: {
                  memberId: body.referrer_member_id,
                  memberNumber: body.referrer_member_id,
                },
              }
            : current.referral,
          _listMeta: current._listMeta
            ? {
                ...current._listMeta,
                contract_id: nextContractId ?? current._listMeta.contract_id,
                contract_type: nextContractType ?? current._listMeta.contract_type,
                contract_name: nextContractDisplayName,
              }
            : {
                contract_id:
                  nextContractId ??
                  current.currentMainContract?.contractId ??
                  DEFAULT_MEMBER_MAIN_CONTRACT_ID,
                contract_name: nextContractDisplayName,
                contract_type:
                  nextContractType ?? resolveContractTypeFromMemberType(current.memberType),
                last_visit_date: undefined,
                has_unpaid: false,
              },
        };
        this._members[idx] = updated;
        return updated;
      },

      updateHealthInfo(id: string, body: UpdateHealthInfoRequest): Member | undefined {
        this._seed();
        const idx = this._members.findIndex((m) => m.memberId === id);
        if (idx === -1) return undefined;
        const current = this._members[idx]!;
        const updated: MemberRow = {
          ...current,
          _healthInfo: {
            ...current._healthInfo,
            ...body,
          },
        };
        this._members[idx] = updated;
        return updated;
      },

      updateMarketingConsent(id: string, body: UpdateMarketingConsentRequest): Member | undefined {
        this._seed();
        const idx = this._members.findIndex((m) => m.memberId === id);
        if (idx === -1) return undefined;
        const current = this._members[idx]!;
        const updated: MemberRow = {
          ...current,
          _marketingConsent: {
            ...(current._marketingConsent ?? { email: false, sms: false, push: false }),
            ...body,
          },
        };
        this._members[idx] = updated;
        return updated;
      },

      anonymizePersonalData(id: string): Member | undefined {
        this._seed();
        const idx = this._members.findIndex((m) => m.memberId === id);
        if (idx === -1) return undefined;
        const current = this._members[idx]!;
        const [lastName, firstName] = splitJapaneseName('削除済み 会員');
        const [lastNameKana, firstNameKana] = splitJapaneseName('サクジョズミ カイイン');
        const updated: MemberRow = {
          ...current,
          anonymizedAt: new Date().toISOString(),
          personalInfo: {
            ...current.personalInfo,
            lastName,
            firstName,
            lastNameKana,
            firstNameKana,
            email: 'deleted@example.com',
            phone: '000-0000-0000',
            postalCode: '000-0000',
            prefecture: '',
            city: '',
            streetAddress: '',
            building: '',
          },
        };
        this._members[idx] = updated;
        return updated;
      },

      handleSuspendRelease(input: { id: string; resume_month: string }): Member | undefined {
        this._seed();
        const db = getDb();
        const idx = this._members.findIndex((m) => m.memberId === input.id);
        if (idx === -1) return undefined;
        const suspensionLeave = db.memberLeaves
          .list()
          .find(
            (l) =>
              l.member_id === input.id &&
              l.type === 'suspension' &&
              (l.status === 'suspended' || l.status === 'suspension_scheduled'),
          );
        if (suspensionLeave) {
          (
            db.memberLeaves as unknown as {
              _updateDetail: (id: string, patch: Record<string, unknown>) => void;
            }
          )._updateDetail(suspensionLeave.id, { status: 'completed' });
          // A completed application leaves the A-03 list entirely (spec Q-10) — the
          // list carries only the four in-flight display states.
          db.memberLeaves._rows = db.memberLeaves._rows.filter((r) => r.id !== suspensionLeave.id);
        }
        const updated: MemberRow = {
          ...this._members[idx]!,
          memberStatus: MemberStatus.ACTIVE,
        };
        this._members[idx] = updated;
        return updated;
      },

      handleWithdrawal(input: {
        id: string;
        scheduled_date: string;
        reason: string;
      }): Member | undefined {
        this._seed();
        const db = getDb();
        const idx = this._members.findIndex((m) => m.memberId === input.id);
        if (idx === -1) return undefined;
        // A gate-stopped member is active underneath, so the plain ACTIVE check now
        // covers what the removed GATE_STOP status used to cover as well.
        if (this._members[idx].memberStatus === MemberStatus.ACTIVE) {
          db.memberLeaves.create({
            member_id: input.id,
            scheduled_date: input.scheduled_date,
            reason: input.reason,
          });
        }
        const current = this._members[idx]!;
        const updated: MemberRow = {
          ...current,
          memberStatus: MemberStatus.PENDING_WITHDRAWAL,
          // The banner / 退会予定 badge read the contract's pending application, so the
          // application has to land there too — the status alone is not enough.
          currentMainContract: current.currentMainContract
            ? {
                ...current.currentMainContract,
                pendingWithdrawal: {
                  withdrawalApplicationId: `${input.id}-wd-001`,
                  scheduledWithdrawalDate: input.scheduled_date,
                },
              }
            : current.currentMainContract,
        };
        this._members[idx] = updated;
        return updated;
      },

      /** 退会取り消し: revert to 有効 and drop the pending application (A-01 FR-020). */
      handleWithdrawCancel(id: string): Member | undefined {
        this._seed();
        const idx = this._members.findIndex((m) => m.memberId === id);
        if (idx === -1) return undefined;
        const current = this._members[idx]!;
        const updated: MemberRow = {
          ...current,
          memberStatus: MemberStatus.ACTIVE,
          currentMainContract: current.currentMainContract
            ? { ...current.currentMainContract, pendingWithdrawal: undefined }
            : current.currentMainContract,
        };
        this._members[idx] = updated;
        return updated;
      },

      handleForceWithdrawal(input: {
        id: string;
        reason: string;
      }): { member: Member; blacklistId: string } | undefined {
        this._seed();
        const db = getDb();
        const idx = this._members.findIndex((m) => m.memberId === input.id);
        if (idx === -1) return undefined;
        const member = this._members[idx]!;

        db.memberLeaves.create({
          member_id: input.id,
          scheduled_date: new Date().toISOString().slice(0, 10),
          reason: input.reason,
        });

        /**
         * A-01 FR-016 — forced withdrawal and blacklist registration happen together.
         * This is the *only* writer of `source: 'forced_withdrawal'`; the operator path
         * (`create`) can never produce one (FR-049). `createAuto` also fixes the reason
         * categories to `['unpaid']` and records the event with a null actor, both per
         * the v0.4 contract.
         */
        const blRow = db.memberBlacklist.createAuto(input.id);
        // The two writes are one operation: a member may not be left FORCE_WITHDRAWN
        // pointing at a blacklist entry that was never created.
        if (!blRow) return undefined;

        /**
         * The denormalised block mirrors the entry that was actually written, exactly as
         * the manual-registration route does — `reason` carries the reason **category**
         * (`unpaid` here, fixed by `createAuto`), while the operator's free-text
         * withdrawal reason belongs in `memo`.
         */
        const updated: MemberRow = {
          ...member,
          memberStatus: MemberStatus.FORCED_WITHDRAWAL,
          blacklist: {
            blacklistId: blRow.id,
            isActive: blRow.is_active,
            reason: blRow.reason_categories[0],
            memo: input.reason,
            registeredAt: blRow.registered_at,
            registeredBy: {
              staffId: blRow.registered_by.staff_id,
              displayName: blRow.registered_by.display_name,
            },
          },
        };
        this._members[idx] = updated;

        return { member: updated, blacklistId: blRow.id };
      },

      handleTransfer(input: {
        id: string;
        to_store_id: string;
        to_store_name: string;
        reason?: string;
        is_proxy?: boolean;
        proxy_agreed_at?: string;
        proxy_method?: string;
      }): { member: Member; transfer_id: string } | undefined {
        this._seed();
        const db = getDb();
        const idx = this._members.findIndex((m) => m.memberId === input.id);
        if (idx === -1) return undefined;
        const member = this._members[idx]!;
        // A-02 FR-006: seed the new request's auto-transfer eligibility from the member's own
        // constraints, so the 自動移籍可否 column and the exclusion alerts have real data instead
        // of defaulting every created transfer to "eligible".
        const exclusionReasons: TransferRow['exclusion_reasons'] = [];
        if (member.constraints.hasUnpaidFee || member.unpaidAmount > 0) {
          exclusionReasons.push('unpaid');
        }
        if (member.constraints.inCancellationPeriod) {
          exclusionReasons.push('campaign_lock');
        }
        const transfer = db.transfers.create({
          member_id: input.id,
          member_name: joinJapaneseName(
            member.personalInfo.lastName,
            member.personalInfo.firstName,
          ),
          from_store_id: member.primaryStore.storeId,
          from_store_name: member.primaryStore.name,
          to_store_id: input.to_store_id,
          to_store_name: input.to_store_name,
          brand: member.primaryStore.brandEnum,
          reason: input.reason,
          applicant_name: input.is_proxy
            ? 'スタッフ'
            : joinJapaneseName(member.personalInfo.lastName, member.personalInfo.firstName),
          applicant_role: input.is_proxy ? 'スタッフ' : '会員本人',
          exclusion_reasons: exclusionReasons,
          unpaid_amount: member.unpaidAmount > 0 ? member.unpaidAmount : null,
          campaign_lock_remaining_days: member.constraints.inCancellationPeriod ? 30 : null,
          is_proxy: input.is_proxy,
          proxy_agreed_at: input.proxy_agreed_at,
          proxy_method: input.proxy_method,
        });
        return { member, transfer_id: transfer.id };
      },

      setGateStop(input: {
        id: string;
        pattern: GateStopSetPattern;
        reasonCategory: GateStopReason;
        message?: string;
        messageType: 'allow_after_confirm' | 'deny_after_confirm';
        set_by?: string;
      }): Member | undefined {
        this._seed();
        const idx = this._members.findIndex((m) => m.memberId === input.id);
        if (idx === -1) return undefined;
        const current = this._members[idx]!;
        // Gate stop is orthogonal to `memberStatus`: setting it leaves the member's
        // own status (active / suspended / …) untouched, so a suspended member stays
        // suspended while gate-stopped — backend design answer 2026-08-10 (QA01 §1-2).
        const updated: MemberRow = {
          ...current,
          gateStop: {
            pattern: input.pattern,
            reasonCategory: input.reasonCategory,
            setAtStore: {
              storeId: current.primaryStore.storeId,
              code: current.primaryStore.code,
              name: current.primaryStore.name,
            },
            messageType: input.messageType,
            message: input.message,
            setAt: new Date().toISOString(),
            setBy: { staffId: 'staff-mock', displayName: input.set_by ?? 'スタッフ' },
          },
        };
        this._members[idx] = updated;
        return updated;
      },

      releaseGateStop(id: string): Member | undefined {
        this._seed();
        const idx = this._members.findIndex((m) => m.memberId === id);
        if (idx === -1) return undefined;
        // Clearing the gate stop restores nothing on `memberStatus` — it was never
        // changed when the stop was applied.
        const updated: MemberRow = {
          ...this._members[idx]!,
          gateStop: null,
        };
        this._members[idx] = updated;
        return updated;
      },

      handleSuspension(input: {
        id: string;
        start_month: string;
        end_month: string;
        reason?: string;
        is_proxy?: boolean;
        proxy_agreed_at?: string;
        proxy_method?: string;
      }): Member | undefined {
        this._seed();
        const db = getDb();
        const idx = this._members.findIndex((m) => m.memberId === input.id);
        if (idx === -1) return undefined;
        db.memberLeaves.createSuspension({
          member_id: input.id,
          start_month: input.start_month,
          end_month: input.end_month,
          reason: input.reason,
          is_proxy: input.is_proxy,
          proxy_agreed_at: input.proxy_agreed_at,
          proxy_method: input.proxy_method,
        });
        const updated: MemberRow = {
          ...this._members[idx]!,
          memberStatus: MemberStatus.SUSPENDED,
        };
        this._members[idx] = updated;
        return updated;
      },
    },

    contracts: {
      _contracts: [] as ContractRow[],
      _seeded: false,

      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        const db = getDb();
        const now = new Date().toISOString();
        db.mainContracts._seed();
        for (const masterContract of db.mainContracts.getList()) {
          const name = masterContract.name;
          const monthlyFee = masterContract.price_including_tax;
          this._contracts.push({
            contract_id: masterContract.id,
            created_at: now,
            data: buildMemberContractData({
              contract_id: masterContract.id,
              plan_name: name,
              start_date: '2024-01-01',
              monthly_fee: monthlyFee,
              created_at: now,
            }),
          });
        }
      },

      getById(contractId: string): ContractRow | undefined {
        this._seed();
        return this._contracts.find((c) => c.contract_id === contractId);
      },

      getByPlanName(planName: string): ContractRow | undefined {
        this._seed();
        return this._contracts.find((c) => c.data.main_contract.plan_name === planName);
      },

      getByMemberId(memberId: string): ContractsRecord | undefined {
        this._seed();
        const db = getDb();
        const member = db.members._members.find((m) => m.memberId === memberId);
        const contractId = member?._listMeta?.contract_id;
        if (contractId) {
          return this.getById(contractId)?.data;
        }
        return this._contracts.find((c) => c.member_id === memberId)?.data;
      },

      getByApplicationId(applicationId: string): ContractRow | undefined {
        this._seed();
        return this._contracts.find((c) => c.application_id === applicationId);
      },

      create(input: {
        contract_id: string;
        member_id?: string;
        application_id?: string;
        data: ContractsRecord;
      }): ContractRow {
        this._seed();
        const db = getDb();
        const now = new Date().toISOString();
        const row: ContractRow = {
          contract_id: input.contract_id,
          member_id: input.member_id,
          application_id: input.application_id,
          created_at: now,
          data: input.data,
        };
        const existingIndex = this._contracts.findIndex((c) => c.contract_id === input.contract_id);
        if (existingIndex >= 0) {
          this._contracts[existingIndex] = row;
        } else {
          this._contracts.unshift(row);
        }

        if (input.member_id) {
          const member = db.members._members.find((m) => m.memberId === input.member_id);
          if (member?._listMeta) {
            db.mainContracts._seed();
            const mainContracts = db.mainContracts.getList();
            const normalizedPlan =
              mainContracts.find((item) => item.name === row.data.main_contract.plan_name)?.name ??
              mainContracts.find((item) => item.id === row.data.main_contract.plan_name)?.name ??
              DEFAULT_MEMBER_MAIN_CONTRACT;
            const nextContractType =
              normalizedPlan.includes('1Day') || row.data.main_contract.plan_name.includes('1Day')
                ? 'one_day_member'
                : member._listMeta.contract_type;
            member._listMeta.contract_id = row.contract_id;
            member._listMeta.contract_name = normalizedPlan;
            member._listMeta.contract_type = nextContractType;
            if (member.currentMainContract) {
              member.currentMainContract.contractId = row.contract_id;
            }
            member.contractName = normalizedPlan;
          }
        }
        return row;
      },

      createFromApprovedApplication(input: {
        application: MembershipApplication;
        member_id: string;
      }): { member_id: string; contract_id: string } {
        this._seed();
        const db = getDb();
        const { application, member_id } = input;
        const contractId = `CONTRACT-${application.id}`;
        const createdAt = new Date().toISOString();
        db.mainContracts._seed();
        const mainContracts = db.mainContracts.getList();
        const selectedContract =
          mainContracts.find((item) => item.id === application.plan_name) ??
          mainContracts.find((item) => item.name === application.plan_name) ??
          mainContracts.find((item) => item.id === DEFAULT_MEMBER_MAIN_CONTRACT_ID) ??
          mainContracts[0];
        const displayName = selectedContract?.name ?? DEFAULT_MEMBER_MAIN_CONTRACT;
        const monthlyFee = selectedContract?.price_including_tax ?? 0;

        const data = buildMemberContractData({
          contract_id: selectedContract?.id ?? contractId,
          plan_name: displayName,
          start_date: application.usage_start_date,
          monthly_fee: monthlyFee,
          created_at: createdAt,
        });

        this.create({
          contract_id: contractId,
          application_id: application.id,
          data,
          member_id,
        });

        return { member_id, contract_id: contractId };
      },
    },

    family: {
      _seeded: false,
      _brandSettings: {
        [Brand.JOYFIT]: {
          family_member_limit: 3,
          family_member_fee: 0,
          payment_cycle: 'monthly' as const,
        },
        [Brand.FIT365]: {
          family_member_limit: 5,
          family_member_fee: 0,
          payment_cycle: 'monthly' as const,
        },
      },
      _relationships: new Map<
        string,
        Array<{ child_member_id: string; relationship: FamilyRelationship; joined_at: string }>
      >(),
      _registrations: [] as Array<{
        id: string;
        created_at: string;
        status: FamilyRegistrationStatus;
        primary_member_id: string;
        applicant_name: string;
        relationship: FamilyRelationship;
        invite_expires_at?: string;
        risk_score?: number;
        risk_reason?: string;
        ekyc?: EkycResult;
        applicant?: { birthday?: string; phone?: string; email?: string };
        rejection_reason?: string;
        staff_id?: string;
        child_member_id?: string;
      }>,

      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        const db = getDb();
        db.members._seed();

        const members = db.members._members;
        const primaries = members.filter(
          (m) =>
            (m.memberType === MemberType.REGULAR ||
              m.memberType === MemberType.CORPORATE ||
              m.memberType === MemberType.ONE_DAY_MEMBER) &&
            m.memberStatus === MemberStatus.ACTIVE,
        );
        // Each family member belongs to exactly ONE group. The pool is consumed in
        // order and never wraps around: reusing a candidate would put the same
        // person under two different parents, which made the 家族会員 block disagree
        // with itself depending on whose page you opened (QA02 ★5).
        const familyCandidates = members.filter((m) => m.memberType === MemberType.FAMILY);
        let candidateIdx = 0;
        const takeCandidates = (count: number) => {
          const taken = familyCandidates.slice(candidateIdx, candidateIdx + count);
          candidateIdx += taken.length;
          return taken;
        };

        for (let i = 0; i < primaries.length; i++) {
          const p = primaries[i]!;
          const rels: Array<{
            child_member_id: string;
            relationship: FamilyRelationship;
            joined_at: string;
          }> = takeCandidates(i % 4).map((child, j) => ({
            child_member_id: child.memberId,
            relationship: (
              ['spouse', 'child', 'parent', 'sibling', 'grandparent', 'grandchild'] as const
            )[(i + j) % 6]!,
            joined_at: child.enrolledAt,
          }));
          if (rels.length) this._relationships.set(p.memberId, rels);
        }

        const typeGroups: Array<{ type: MemberType; count: number }> = [
          { type: MemberType.REGULAR, count: 15 },
          { type: MemberType.CORPORATE, count: 10 },
          { type: MemberType.ONE_DAY_MEMBER, count: 8 },
        ];
        const relationships: FamilyRelationship[] = [
          'spouse',
          'child',
          'parent',
          'sibling',
          'grandparent',
          'grandchild',
        ];
        for (const { type, count } of typeGroups) {
          const typePrimaries = members.filter(
            (m) => m.memberType === type && m.memberStatus === MemberStatus.ACTIVE,
          );
          for (let k = 0; k < Math.min(count, typePrimaries.length); k++) {
            const p = typePrimaries[k]!;
            if (this._relationships.has(p.memberId)) continue;
            // Same pool as above — once it runs dry no further groups are created,
            // rather than handing an already-placed member to a second parent.
            const rels = takeCandidates((k % 3) + 1).map((child, j) => ({
              child_member_id: child.memberId,
              relationship: relationships[(k + j) % relationships.length]!,
              joined_at: child.enrolledAt,
            }));
            if (rels.length) this._relationships.set(p.memberId, rels);
          }
        }

        const statuses: FamilyRegistrationStatus[] = [
          'awaiting_acceptance',
          'awaiting_profile',
          'pending_review',
          'approved',
          'rejected',
          'completed',
          'declined',
          'expired',
          'invited',
        ];
        const riskReasons = [
          'ブラックリスト一致',
          '重複申込',
          '顔認証失敗',
          '本人確認書類不備',
          '過去に不正利用の記録あり',
        ];
        const documentTypes = ['運転免許証', 'マイナンバーカード', 'パスポート', '健康保険証'];
        const now = new Date();

        for (let i = 1; i <= 200; i++) {
          const created = new Date(now.getFullYear(), now.getMonth() - (i % 12), (i % 28) + 1);
          created.setHours(10 + (i % 8), (i * 7) % 60, 0, 0);
          const primary = primaries[i % primaries.length]!;
          const status = statuses[i % statuses.length]!;
          const inviteExpires = new Date(created);
          inviteExpires.setDate(inviteExpires.getDate() + 7);
          const hasRisk = status === 'pending_review' || status === 'rejected';
          const riskScore = hasRisk
            ? 70 + (i % 30)
            : status === 'approved' || status === 'completed'
              ? 10 + (i % 40)
              : undefined;
          const riskReason = hasRisk ? riskReasons[i % riskReasons.length] : undefined;
          const hasEkyc = ['pending_review', 'approved', 'rejected', 'completed'].includes(status);
          const ekycVerified = status === 'approved' || status === 'completed';
          const verifiedAt = new Date(created);
          verifiedAt.setMinutes(verifiedAt.getMinutes() + 30);
          const faceSimilarity = ekycVerified ? 88 + (i % 12) : 40 + (i % 30);
          const ekyc: EkycResult | undefined = hasEkyc
            ? {
                verified: ekycVerified,
                verified_at: verifiedAt.toISOString(),
                face_photo_url: `https://example.com/ekyc/face/FR-${String(i).padStart(5, '0')}.jpg`,
                id_document_url: `https://example.com/ekyc/id/FR-${String(i).padStart(5, '0')}.jpg`,
                document_type: documentTypes[i % documentTypes.length],
                face_match: { similarity: faceSimilarity, passed: faceSimilarity >= 80 },
                blacklist_check: {
                  matched: hasRisk && riskReason === 'ブラックリスト一致',
                  reason:
                    hasRisk && riskReason === 'ブラックリスト一致'
                      ? '過去に不正利用の記録あり'
                      : undefined,
                },
              }
            : undefined;

          this._registrations.push({
            id: `FR-${String(i).padStart(5, '0')}`,
            created_at: created.toISOString(),
            status,
            primary_member_id: primary.memberId,
            applicant_name: `家族申請者${String(i).padStart(3, '0')}`,
            relationship: (
              ['spouse', 'child', 'parent', 'sibling', 'grandparent', 'grandchild'] as const
            )[i % 6]!,
            invite_expires_at:
              status === 'expired'
                ? new Date(created.getTime() + 2 * 24 * 3600 * 1000).toISOString()
                : inviteExpires.toISOString(),
            risk_score: riskScore,
            risk_reason: riskReason,
            ekyc,
            applicant: {
              birthday: `199${i % 10}-0${(i % 9) + 1}-15`,
              phone: `090${String(1000 + (i % 9000)).slice(-4)}${String(2000 + (i % 8000)).slice(-4)}`,
              email: `family${String(i).padStart(5, '0')}@example.jp`,
            },
            ...(status === 'rejected'
              ? { rejection_reason: 'リスクスコアが高すぎます', staff_id: 'staff-001' }
              : {}),
          });
        }
      },

      /** Family-size cap for a brand group, without touching the member table. */
      getFamilyMemberLimit(brandGroup: MainBrand | undefined): number {
        const settings = this._brandSettings[brandGroup ?? Brand.FIT365];
        return (
          settings?.family_member_limit ?? this._brandSettings[Brand.FIT365].family_member_limit
        );
      },

      getBrandSettingsByPrimaryMemberId(primary_member_id: string) {
        this._seed();
        const db = getDb();
        const primary = db.members.get(primary_member_id);
        const mainBrand = primary?.brandGroup ?? 'fit365';
        const settings = this._brandSettings[mainBrand] ?? this._brandSettings[Brand.FIT365];
        const brand = primary?.primaryStore.brandEnum ?? Brand.FIT365;
        return { brand, settings };
      },

      getFamilyMembers(primary_member_id: string) {
        this._seed();
        const db = getDb();
        const { brand, settings } = this.getBrandSettingsByPrimaryMemberId(primary_member_id);
        const rels = this._relationships.get(primary_member_id) ?? [];
        const members = rels
          .map((r) => {
            const child = db.members.get(r.child_member_id);
            if (!child) return undefined;
            return {
              id: child.memberId,
              member_number: child.memberNumber,
              name_kanji: joinJapaneseName(
                child.personalInfo.lastName,
                child.personalInfo.firstName,
              ),
              relationship: r.relationship,
              joined_at: r.joined_at,
              status: child.memberStatus,
              monthly_fee: settings.family_member_fee,
              store_id: child.primaryStore.storeId,
              store_name: child.primaryStore.name,
            };
          })
          .filter(Boolean);
        return { brand, settings, members };
      },

      getPrimaryMemberIdForChild(child_member_id: string): string | undefined {
        this._seed();
        for (const [primaryId, rels] of this._relationships) {
          if (rels.some((r) => r.child_member_id === child_member_id)) return primaryId;
        }
        return undefined;
      },

      getRelationshipToPrimary(child_member_id: string, primary_member_id: string) {
        this._seed();
        const rels = this._relationships.get(primary_member_id) ?? [];
        return rels.find((r) => r.child_member_id === child_member_id)?.relationship;
      },

      listChildRelationships(primary_member_id: string) {
        this._seed();
        return [...(this._relationships.get(primary_member_id) ?? [])];
      },

      listRegistrations() {
        this._seed();
        return [...this._registrations];
      },

      getRegistrationById(id: string) {
        this._seed();
        return this._registrations.find((r) => r.id === id);
      },

      createRegistration(input: {
        primary_member_id: string;
        applicant: {
          name: string;
          birthday: string;
          relationship: FamilyRelationship;
          phone?: string;
          email?: string;
        };
      }) {
        this._seed();
        const now = new Date().toISOString();
        const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
        const next = this._registrations.length + 1;
        const row = {
          id: `FR-${String(next).padStart(5, '0')}`,
          created_at: now,
          status: 'awaiting_profile' as FamilyRegistrationStatus,
          primary_member_id: input.primary_member_id,
          applicant_name: input.applicant.name,
          relationship: input.applicant.relationship,
          invite_expires_at: inviteExpiresAt,
          risk_score: undefined as number | undefined,
          risk_reason: undefined as string | undefined,
          ekyc: undefined as EkycResult | undefined,
          applicant: {
            birthday: input.applicant.birthday,
            phone: input.applicant.phone,
            email: input.applicant.email,
          },
        };
        this._registrations.unshift(row);
        return row;
      },

      linkChildRelationship(
        primary_member_id: string,
        child_member_id: string,
        relationship: FamilyRelationship,
      ) {
        this._seed();
        const existing = this._relationships.get(primary_member_id) ?? [];
        if (existing.some((r) => r.child_member_id === child_member_id)) return;
        existing.push({ child_member_id, relationship, joined_at: toIsoDate(new Date()) });
        this._relationships.set(primary_member_id, existing);
      },

      updateRegistrationStatus(
        id: string,
        status: FamilyRegistrationStatus,
        patch?: Record<string, unknown>,
      ) {
        this._seed();
        const idx = this._registrations.findIndex((r) => r.id === id);
        if (idx === -1) return undefined;
        this._registrations[idx] = { ...this._registrations[idx], status, ...(patch ?? {}) };
        return this._registrations[idx];
      },
    },

    referrals: {
      _seeded: false,
      _byReferrer: new Map<
        string,
        Array<{
          referee_member_id: string;
          referred_at: string;
          points_earned: number | null;
          points_status_ja: string;
        }>
      >(),
      _refereeToReferrer: new Map<
        string,
        { referrer_member_id: string; referred_at: string; benefit_description: string }
      >(),

      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;
        const db = getDb();
        db.members._seed();
        const members = db.members._members;
        for (let i = 0; i < members.length - 2; i++) {
          if (i % 11 !== 0) continue;
          const referrer = members[i]!;
          const batch: Array<{
            referee_member_id: string;
            referred_at: string;
            points_earned: number | null;
            points_status_ja: string;
          }> = [];
          const referredAt = `2024-06-${String((i % 27) + 1).padStart(2, '0')}`;
          for (let k = 1; k <= 2; k++) {
            const referee = members[i + k];
            if (!referee) break;
            const joined =
              referee.memberStatus === MemberStatus.ACTIVE ||
              referee.memberStatus === MemberStatus.SUSPENDED;
            const withdrew =
              referee.memberStatus === MemberStatus.WITHDRAWN ||
              referee.memberStatus === MemberStatus.FORCED_WITHDRAWAL;
            const points = joined ? 300 * k : null;
            const points_status_ja = joined
              ? `付与済み（${points}P）`
              : withdrew
                ? '退会により対象外'
                : '未付与';
            batch.push({
              referee_member_id: referee.memberId,
              referred_at: referredAt,
              points_earned: points,
              points_status_ja,
            });
            if (!this._refereeToReferrer.has(referee.memberId)) {
              this._refereeToReferrer.set(referee.memberId, {
                referrer_member_id: referrer.memberId,
                referred_at: referredAt,
                benefit_description: '初月会費50%オフ（紹介特典）',
              });
            }
          }
          if (batch.length) this._byReferrer.set(referrer.memberId, batch);
        }
      },

      getForMember(memberId: string) {
        this._seed();
        return {
          asReferrerRows: this._byReferrer.get(memberId) ?? [],
          asRefereeRow: this._refereeToReferrer.get(memberId),
        };
      },
    },

    getMemberRelationships(memberId: string) {
      const db = getDb();
      db.members._seed();
      db.family._seed();
      db.referrals._seed();

      const member = db.members.get(memberId);
      if (!member) return null;

      const memberType = member.memberType;

      let family:
        | {
            role: 'primary';
            children: Array<{
              id: string;
              member_number: string;
              name: string;
              relationship: string;
              status: MemberProfile['status'];
            }>;
            current_count: number;
            max_count: number;
          }
        | {
            role: 'family_child';
            parent: {
              id: string;
              member_number: string;
              name: string;
              relationship: string;
              status: MemberProfile['status'];
            };
          }
        | null = null;

      const childRows = db.family.listChildRelationships(memberId);
      if (childRows.length > 0) {
        const { settings } = db.family.getBrandSettingsByPrimaryMemberId(memberId);
        family = {
          role: 'primary',
          current_count: childRows.length,
          max_count: settings.family_member_limit,
          children: childRows
            .map((r) => {
              const child = db.members.get(r.child_member_id);
              if (!child) return undefined;
              return {
                id: child.memberId,
                member_number: child.memberNumber,
                name: joinJapaneseName(child.personalInfo.lastName, child.personalInfo.firstName),
                relationship: familyRelationshipToJa(r.relationship),
                status: child.memberStatus,
              };
            })
            .filter((x): x is NonNullable<typeof x> => Boolean(x)),
        };
      } else if (memberType === MemberType.FAMILY) {
        const primaryId = db.family.getPrimaryMemberIdForChild(memberId);
        if (primaryId) {
          const parent = db.members.get(primaryId);
          const relEnum = db.family.getRelationshipToPrimary(memberId, primaryId);
          if (parent) {
            family = {
              role: 'family_child',
              parent: {
                id: parent.memberId,
                member_number: parent.memberNumber,
                name: joinJapaneseName(parent.personalInfo.lastName, parent.personalInfo.firstName),
                relationship: relEnum ? familyRelationshipToJa(relEnum) : '—',
                status: parent.memberStatus,
              },
            };
          }
        }
      }

      let corporate: {
        corporate_detail_member_id: string;
        corporate_name: string;
        corporate_number: string;
        contract_type: string;
        company_discount: { applied: boolean; rate_percent: number | null };
        contact_department: string;
        contact_name: string;
      } | null = null;

      if (memberType === MemberType.CORPORATE) {
        const memberNameKanji = joinJapaneseName(
          member.personalInfo.lastName,
          member.personalInfo.firstName,
        );
        corporate = {
          corporate_detail_member_id: member.memberId,
          corporate_name: `${memberNameKanji}（法人契約）`,
          corporate_number: `7${String(member.memberId.replace(/\D/g, '') || '0')
            .padStart(12, '0')
            .slice(0, 12)}`,
          contract_type: '法人団体契約（標準）',
          company_discount: { applied: true, rate_percent: 20 },
          contact_department: '総務・人事部',
          contact_name: '営業 一郎',
        };
      } else if (memberType === MemberType.ONE_DAY_MEMBER) {
        const corpMember = db.members._members.find((m) => m.memberType === MemberType.CORPORATE);
        if (corpMember) {
          corporate = {
            corporate_detail_member_id: corpMember.memberId,
            corporate_name: 'サンプル株式会社（社割提携法人）',
            corporate_number: '7010001056789',
            contract_type: '社員優待（法人付帯）',
            company_discount: { applied: true, rate_percent: 15 },
            contact_department: '人事部',
            contact_name: joinJapaneseName(
              corpMember.personalInfo.lastName,
              corpMember.personalInfo.firstName,
            ),
          };
        }
      }

      const { asReferrerRows, asRefereeRow } = db.referrals.getForMember(memberId);
      const referralsMapped = asReferrerRows
        .map((r) => {
          const refMember = db.members.get(r.referee_member_id);
          if (!refMember) return undefined;
          const st = refMember.memberStatus;
          let membership_status_ja = '未入会';
          if (st === MemberStatus.ACTIVE) membership_status_ja = '入会済み（利用中）';
          else if (st === MemberStatus.SUSPENDED) membership_status_ja = '入会済み（休会中）';
          else if (st === MemberStatus.WITHDRAWN || st === MemberStatus.FORCED_WITHDRAWAL)
            membership_status_ja = '退会済み';
          return {
            id: refMember.memberId,
            member_number: refMember.memberNumber,
            name: joinJapaneseName(
              refMember.personalInfo.lastName,
              refMember.personalInfo.firstName,
            ),
            referred_at: r.referred_at,
            membership_status: membership_status_ja,
            points_status: r.points_status_ja,
            points_earned: r.points_earned,
          };
        })
        .filter((x): x is NonNullable<typeof x> => Boolean(x));

      const totalPoints = referralsMapped.reduce((acc, r) => acc + (r.points_earned ?? 0), 0);

      let as_referee: {
        referrer: {
          id: string;
          member_number: string;
          name: string;
          referred_at: string;
          referral_benefit: string;
        };
      } | null = null;
      if (asRefereeRow) {
        const ref = db.members.get(asRefereeRow.referrer_member_id);
        if (ref) {
          as_referee = {
            referrer: {
              id: ref.memberId,
              member_number: ref.memberNumber,
              name: joinJapaneseName(ref.personalInfo.lastName, ref.personalInfo.firstName),
              referred_at: asRefereeRow.referred_at,
              referral_benefit: asRefereeRow.benefit_description,
            },
          };
        }
      }

      return {
        family,
        corporate,
        referral: {
          as_referrer: {
            referrals: referralsMapped,
            summary: { total_referrals: referralsMapped.length, total_points: totalPoints },
          },
          as_referee,
        },
      };
    },
  };
}
