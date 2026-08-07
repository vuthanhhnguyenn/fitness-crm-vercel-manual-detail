import type {
  EkycResult,
  FamilyRegistrationStatus,
  FamilyRelationship,
} from '@/app/api/_schemas/family-registration.schema';
import type {
  CreateMemberRequest,
  UpdateBasicInfoRequest,
  UpdateHealthInfoRequest,
  UpdateMarketingConsentRequest,
  UpdateMemberRequest,
} from '@/app/api/_schemas/member.schema';
import type { DirectEnrollmentRequest as DirectEnrollmentRequestType } from '@/app/api/_schemas/membership-application.schema';

import { Brand, GetContractsResponse, MemberStatus, MemberType } from '@/lib/api/types.gen';

import type {
  MembershipApplication,
  MembershipApplicationStatus,
} from '@/types/api/membership-application.type';

import type { DbType } from '../_db.types';
import {
  type ContractRow,
  DEFAULT_MEMBER_MAIN_CONTRACT,
  type Member,
  type MemberProfile,
  type MemberRow,
  type MembershipApplicationDetails,
  buildMemberContractData,
  createMember,
  familyRelationshipToJa,
  memberToListItem,
  resolveBrand,
  resolveContractTypeFromMemberType,
  resolveMainBrand,
  toIsoDate,
} from '../seeds/membership.seed';

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
        const storeRows = db.stores._rows;
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
        for (let i = 1; i <= 200; i++) {
          const id = `M-${String(i).padStart(5, '0')}`;
          const name = names[i % names.length];
          const store = storeRows[i % storeRows.length]!;
          const memberType = (
            ['regular', 'family', 'corporate', 'one_day_member'] as MemberProfile['member_type'][]
          )[i % 4]!;
          const preferredContractId =
            memberType === 'one_day_member'
              ? 'MC007'
              : memberType === 'family'
                ? 'MC011'
                : memberType === 'corporate'
                  ? 'MC003'
                  : DEFAULT_MEMBER_MAIN_CONTRACT_ID;
          const mainContract = byId.get(preferredContractId) ?? defaultContract;
          const displayName = mainContract?.name ?? DEFAULT_MEMBER_MAIN_CONTRACT;
          const mainContractId = mainContract?.id ?? DEFAULT_MEMBER_MAIN_CONTRACT_ID;
          const phone = `090${String(1000 + (i % 9000)).slice(-4)}${String(1000 + (i % 9000)).slice(-4)}`;
          const email = `member${String(i).padStart(5, '0')}@example.jp`;
          const member = {
            name_kanji: name.kanji,
            name_kana: name.kana,
            phone,
            email,
            birthday: `199${i % 10}-0${(i % 9) + 1}-15`,
            gender: i % 2 === 0 ? 'male' : ('female' as MemberRow['basic_info']['gender']),
            member_type: memberType,
            status: (
              [
                'active',
                'suspended',
                'withdrawn',
                'gate_stop',
                'pending_withdrawal',
                'force_withdrawn',
              ] as MemberProfile['status'][]
            )[i % 6],
            contract_type: resolveContractTypeFromMemberType(memberType),
            store_name: store.name,
            store_id: store.id,
            brand: store.brand as Brand,
            contract_name: displayName,
            contract_id: mainContractId,
            joined_at: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
            last_visit_date:
              i % 5 === 0
                ? undefined
                : toIsoDate(new Date(now.getTime() - ((i * 3) % 420) * dayMs)),
            has_unpaid: i % 7 === 0,
            in_cancellation_period: i % 6 === 4,
            is_option_restricted: i % 7 === 0,
            emergency_contact_name: name.kanji,
            emergency_contact_relationship: '配偶者',
            emergency_contact_phone: '09087654321',
            gate_stop_info: null as MemberProfile['gate_stop_info'],
          };
          if (member.status === 'gate_stop') {
            member.gate_stop_info = {
              scope: 'own_store_only',
              reason: 'unpaid',
              terminal_message: '未納金のため、入館を制限します。',
              lock_after_message: true,
              set_at: new Date().toISOString(),
              set_by: 'スタッフ',
            };
          }
          this._members.push(createMember(id, member));
        }
      },

      get(id: string): Member | undefined {
        this._seed();
        return this._members.find((m) => m.basic_info.id === id);
      },

      getList() {
        this._seed();
        return this._members.map(memberToListItem);
      },

      getSummary() {
        this._seed();
        const all = this._members;
        const total = all.length;
        const active = all.filter((m) => m.profile.status === 'active').length;
        const suspended = all.filter((m) => m.profile.status === 'suspended').length;
        const unpaidMembers = all.filter((m) => m._listMeta?.has_unpaid === true);
        const pending_withdrawal = all.filter(
          (m) => m.profile.status === 'pending_withdrawal',
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

      createFromApplication(application: MembershipApplicationDetails): Member {
        this._seed();
        const db = getDb();
        const nextNumber = this._members.length + 1;
        const id = `M-${String(nextNumber).padStart(5, '0')}`;
        db.stores._seed();
        const storeRows = db.stores._rows;
        const store = storeRows[nextNumber % storeRows.length]!;
        const now = new Date();
        const memberType = (['regular', 'family', 'corporate'] as MemberProfile['member_type'][])[
          nextNumber % 3
        ]!;
        const rawPlan =
          application.contract_details?.plan_name || application.contract_details?.plan_id || '';
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
          name_kana: application.applicant_name || '',
          phone: application.applicant_phone || '',
          email: application.applicant_email || '',
          birthday: application.birthday || '',
          gender: application.gender || 'other',
          member_type: memberType,
          status: 'active',
          contract_type: resolveContractTypeFromMemberType(memberType),
          store_name: store.name,
          store_id: store.id,
          brand: nextNumber % 2 === 0 ? 'fit365' : 'joyfit',
          joined_at: toIsoDate(now),
          contract_name: displayName,
          contract_id: mainContractId,
          last_visit_date: toIsoDate(new Date(application.contract_details?.start_date ?? now)),
          has_unpaid: false,
          in_cancellation_period: false,
          is_option_restricted: false,
          emergency_contact_name: application.emergency_contact_name || '',
          emergency_contact_relationship: application.emergency_contact_relationship || '',
          emergency_contact_phone: application.emergency_contact_phone || '',
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
        const store = primary?.profile.store_id
          ? { id: primary.profile.store_id, name: primary.profile.store_name }
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
          brand: primary?.profile.brand ?? (nextNumber % 2 === 0 ? 'fit365' : 'joyfit'),
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

      create(body: CreateMemberRequest): Member {
        this._seed();
        const db = getDb();
        db.contracts._seed();
        db.stores._seed();
        db.mainContracts._seed();
        const nextNumber = this._members.length + 1;
        const id = `M-${String(nextNumber).padStart(5, '0')}`;
        const storeRows = db.stores._rows;
        const profileInfo = body.profile_info;
        const joinedAt = profileInfo?.join_date ?? toIsoDate(new Date());
        const memberType: MemberProfile['member_type'] = profileInfo?.member_type ?? 'regular';
        const mainContracts = db.mainContracts.getList();
        const defaultContract =
          mainContracts.find((contract) => contract.id === DEFAULT_MEMBER_MAIN_CONTRACT_ID) ??
          mainContracts[0];
        const selectedContract =
          mainContracts.find((contract) => contract.id === profileInfo?.contract_name) ??
          mainContracts.find((contract) => contract.name === profileInfo?.contract_name) ??
          defaultContract;
        const contractName = selectedContract?.name ?? DEFAULT_MEMBER_MAIN_CONTRACT;
        const existingContract = db.contracts.getByPlanName(contractName);
        const contractId =
          existingContract?.contract_id ?? `contract-member-${String(nextNumber).padStart(5, '0')}`;
        if (!existingContract) {
          db.contracts.create({
            contract_id: contractId,
            data: buildMemberContractData({
              plan_name: contractName,
              start_date: joinedAt,
              monthly_fee: selectedContract?.price_including_tax ?? 0,
              created_at: new Date().toISOString(),
            }),
          });
        }
        const joinStoreId = profileInfo?.join_store?.trim();
        const selectedStore =
          joinStoreId != null && joinStoreId !== ''
            ? storeRows.find((row) => row.id === joinStoreId || row.store_id === joinStoreId)
            : undefined;
        const resolvedStore = selectedStore;
        const normalizedBrand = profileInfo?.brand?.trim();
        const brand =
          normalizedBrand && resolvedStore
            ? resolveBrand(normalizedBrand, resolvedStore.brand as Brand)
            : ('' as MemberProfile['brand']);
        const row = createMember(id, {
          name_kanji: body.name_kanji,
          name_kana: body.name_kana,
          phone: body.phone,
          email: body.email,
          birthday: body.birthday ?? '1990-01-01',
          gender: body.gender ?? 'other',
          member_type: memberType,
          status: 'active',
          contract_type: resolveContractTypeFromMemberType(memberType),
          store_name: resolvedStore?.name ?? '',
          store_id: resolvedStore?.id ?? '',
          brand,
          joined_at: joinedAt,
          contract_name: contractName,
          contract_id: contractId,
          last_visit_date: undefined,
          has_unpaid: false,
          in_cancellation_period: false,
          is_option_restricted: false,
          emergency_contact_name: body.emergency_contact?.name ?? '',
          emergency_contact_relationship: body.emergency_contact?.relationship ?? '',
          emergency_contact_phone: body.emergency_contact?.phone ?? '',
        });

        row.basic_info.birthday = body.birthday ?? row.basic_info.birthday;
        row.basic_info.postal_code = body.postal_code ?? row.basic_info.postal_code;
        row.basic_info.prefecture = body.prefecture ?? row.basic_info.prefecture;
        row.basic_info.city = body.city ?? row.basic_info.city;
        row.basic_info.address = body.address ?? row.basic_info.address;
        row.basic_info.building = body.building ?? row.basic_info.building;
        row.basic_info.notes = body.notes ?? row.basic_info.notes;
        row.profile.contract_id = contractId;
        row.profile.contract_name = profileInfo?.contract_name ?? row.profile.contract_name;
        row.profile.join_route = profileInfo?.join_route ?? row.profile.join_route;
        row.profile.referrer_member_id =
          profileInfo?.referrer_member_id ?? row.profile.referrer_member_id;
        row.ekyc = {
          ...(row.ekyc ?? { verified: false }),
          photoUrl: profileInfo?.photo_url ?? row.ekyc?.photoUrl,
        };
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
        const idx = this._members.findIndex((m) => m.basic_info.id === id);
        if (idx === -1) return undefined;
        const current = this._members[idx];
        const updated: MemberRow = {
          ...current,
          basic_info: {
            ...current.basic_info,
            ...body,
            emergency_contact: body.emergency_contact ?? current.basic_info.emergency_contact,
          },
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
        const idx = this._members.findIndex((m) => m.basic_info.id === id);
        if (idx === -1) return undefined;
        const current = this._members[idx];
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
          mainContracts.find((contract) => contract.name === current.profile.contract_name) ??
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
                plan_name: body.contract_name,
                start_date: body.join_date ?? current.profile.joined_at,
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

        const updated: MemberRow = {
          ...current,
          profile: {
            ...current.profile,
            member_type: body.member_type ?? current.profile.member_type,
            joined_at: body.join_date ?? current.profile.joined_at,
            store_id: body.join_store ?? current.profile.store_id,
            store_name:
              body.join_store != null
                ? (db.stores.getById(body.join_store)?.name ?? current.profile.store_name)
                : current.profile.store_name,
            brand: resolveBrand(body.brand, current.profile.brand),
            main_brand: resolveMainBrand(resolveBrand(body.brand, current.profile.brand)),
            contract_id: nextContractId ?? current.profile.contract_id,
            contract_name: nextContractDisplayName,
            join_route: body.join_route ?? current.profile.join_route,
            referrer_member_id: body.referrer_member_id ?? current.profile.referrer_member_id,
          },
          ekyc: {
            ...(current.ekyc ?? { verified: false }),
            photoUrl: body.photo_url ?? current.ekyc?.photoUrl,
          },
          _listMeta: current._listMeta
            ? {
                ...current._listMeta,
                contract_id: nextContractId ?? current._listMeta.contract_id,
                contract_type: nextContractType ?? current._listMeta.contract_type,
                contract_name: nextContractDisplayName,
              }
            : {
                contract_id:
                  nextContractId ?? current.profile.contract_id ?? DEFAULT_MEMBER_MAIN_CONTRACT_ID,
                contract_name: nextContractDisplayName,
                contract_type:
                  nextContractType ??
                  resolveContractTypeFromMemberType(current.profile.member_type),
                last_visit_date: undefined,
                has_unpaid: false,
              },
        };
        this._members[idx] = updated;
        return updated;
      },

      updateHealthInfo(id: string, body: UpdateHealthInfoRequest): Member | undefined {
        this._seed();
        const idx = this._members.findIndex((m) => m.basic_info.id === id);
        if (idx === -1) return undefined;
        const current = this._members[idx];
        const updated: MemberRow = {
          ...current,
          health_info: {
            ...current.health_info,
            ...body,
          },
        };
        this._members[idx] = updated;
        return updated;
      },

      updateMarketingConsent(id: string, body: UpdateMarketingConsentRequest): Member | undefined {
        this._seed();
        const idx = this._members.findIndex((m) => m.basic_info.id === id);
        if (idx === -1) return undefined;
        const current = this._members[idx];
        const updated: MemberRow = {
          ...current,
          consent: {
            ...(current.consent ?? {
              member_agreement: { version: '1.0', agreed_at: new Date().toISOString() },
              privacy_policy: { version: '1.0', agreed_at: new Date().toISOString() },
              marketing_consent: { email: false, sms: false, push: false },
            }),
            marketing_consent: {
              ...(current.consent?.marketing_consent ?? { email: false, sms: false, push: false }),
              ...body,
            },
          },
        };
        this._members[idx] = updated;
        return updated;
      },

      anonymizePersonalData(id: string): Member | undefined {
        this._seed();
        const idx = this._members.findIndex((m) => m.basic_info.id === id);
        if (idx === -1) return undefined;
        const current = this._members[idx];
        const updated: MemberRow = {
          ...current,
          basic_info: {
            ...current.basic_info,
            name_kanji: '削除済み 会員',
            name_kana: 'サクジョズミ カイイン',
            email: 'deleted@example.com',
            phone: '000-0000-0000',
            postal_code: '000-0000',
            prefecture: '',
            city: '',
            address: '',
            building: '',
          },
        };
        this._members[idx] = updated;
        return updated;
      },

      handleSuspendRelease(input: { id: string; resume_month: string }): Member | undefined {
        this._seed();
        const db = getDb();
        const idx = this._members.findIndex((m) => m.basic_info.id === input.id);
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
          const listIdx = db.memberLeaves._rows.findIndex((r) => r.id === suspensionLeave.id);
          if (listIdx !== -1) {
            db.memberLeaves._rows[listIdx] = {
              ...db.memberLeaves._rows[listIdx]!,
              status: 'completed',
            };
          }
        }
        const updated: MemberRow = {
          ...this._members[idx]!,
          profile: {
            ...this._members[idx]!.profile,
            status: MemberStatus.ACTIVE,
          },
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
        const idx = this._members.findIndex((m) => m.basic_info.id === input.id);
        if (idx === -1) return undefined;
        if (
          this._members[idx].profile.status == MemberStatus.ACTIVE ||
          this._members[idx].profile.status == MemberStatus.GATE_STOP
        ) {
          db.memberLeaves.create({
            member_id: input.id,
            scheduled_date: input.scheduled_date,
            reason: input.reason,
          });
        }
        const updated: MemberRow = {
          ...this._members[idx]!,
          profile: {
            ...this._members[idx]!.profile,
            status: MemberStatus.PENDING_WITHDRAWAL,
          },
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
        const idx = this._members.findIndex((m) => m.basic_info.id === input.id);
        if (idx === -1) return undefined;
        const member = this._members[idx]!;

        db.memberLeaves.create({
          member_id: input.id,
          scheduled_date: new Date().toISOString().slice(0, 10),
          reason: input.reason,
        });

        const updated: MemberRow = {
          ...member,
          profile: {
            ...member.profile,
            status: MemberStatus.FORCE_WITHDRAWN,
            is_black_listed: true,
          },
        };
        this._members[idx] = updated;

        const blRow = db.memberBlacklist.create({
          memberId: member.basic_info.member_number,
          memberName: member.basic_info.name_kanji,
          storeName: member.profile.store_name,
          registrationSource: 'forced_withdrawal',
          manualReason: null,
          unpaidAmount: 0,
          memo: input.reason,
          registeredBy: 'System',
          matchConditions: {
            nameAndBirthdate: true,
            email: false,
            phone: false,
            address: false,
          },
        });

        return { member: updated, blacklistId: blRow.id };
      },

      handleTransfer(input: {
        id: string;
        to_store_id: string;
        to_store_name: string;
        reason?: string;
      }): { member: Member; transfer_id: string } | undefined {
        this._seed();
        const db = getDb();
        const idx = this._members.findIndex((m) => m.basic_info.id === input.id);
        if (idx === -1) return undefined;
        const member = this._members[idx]!;
        const transfer = db.transfers.create({
          member_id: input.id,
          member_name: member.basic_info.name_kanji,
          from_store_id: member.profile.store_id,
          from_store_name: member.profile.store_name,
          to_store_id: input.to_store_id,
          to_store_name: input.to_store_name,
          brand: member.profile.brand,
          reason: input.reason,
        });
        return { member, transfer_id: transfer.id };
      },

      setGateStop(input: {
        id: string;
        scope: string;
        reason: string;
        terminal_message?: string;
        lock_after_message: boolean;
        set_by?: string;
      }): Member | undefined {
        this._seed();
        const idx = this._members.findIndex((m) => m.basic_info.id === input.id);
        if (idx === -1) return undefined;
        const updated: MemberRow = {
          ...this._members[idx]!,
          profile: {
            ...this._members[idx]!.profile,
            status: MemberStatus.GATE_STOP,
            gate_stop_info: {
              scope: input.scope as 'all_stores' | 'own_store_only',
              reason: input.reason as 'nuisance' | 'unpaid' | 'fraudulent_use' | 'other',
              terminal_message: input.terminal_message,
              lock_after_message: input.lock_after_message,
              set_at: new Date().toISOString(),
              set_by: input.set_by ?? 'スタッフ',
            },
          },
        };
        this._members[idx] = updated;
        return updated;
      },

      releaseGateStop(id: string): Member | undefined {
        this._seed();
        const idx = this._members.findIndex((m) => m.basic_info.id === id);
        if (idx === -1) return undefined;
        const updated: MemberRow = {
          ...this._members[idx]!,
          profile: {
            ...this._members[idx]!.profile,
            status: MemberStatus.ACTIVE,
            gate_stop_info: null,
          },
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
        const idx = this._members.findIndex((m) => m.basic_info.id === input.id);
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
          profile: {
            ...this._members[idx]!.profile,
            status: MemberStatus.SUSPENDED,
          },
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

      getByMemberId(memberId: string): GetContractsResponse | undefined {
        this._seed();
        const db = getDb();
        const member = db.members._members.find((m) => m.basic_info.id === memberId);
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
        data: GetContractsResponse;
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
          const member = db.members._members.find((m) => m.basic_info.id === input.member_id);
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
            member.profile.contract_id = row.contract_id;
            member.profile.contract_name = normalizedPlan;
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
          plan_name: displayName,
          start_date: application.start_date,
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

    membershipApplications: {
      _applications: [] as MembershipApplication[],
      _details: {} as Record<string, MembershipApplicationDetails>,
      _seeded: false,

      _seed(): void {
        if (this._seeded) return;
        this._seeded = true;

        const seed: MembershipApplication[] = [
          {
            id: 'APP-2026-0001',
            applicant_name: '山田 太郎',
            store_name: 'FIT365八潮店',
            plan_name: 'レギュラー会員',
            application_date: '2026-03-30T09:15:00+09:00',
            status: 'pending',
            blacklist_match: false,
            start_date: '2026-04-01',
            brand_name: 'FIT365',
            campaign: '春の入会キャンペーン',
          },
          {
            id: 'APP-2026-0002',
            applicant_name: '佐藤 花子',
            store_name: 'FIT365草加店',
            plan_name: 'デイタイム会員',
            application_date: '2026-03-30T10:32:00+09:00',
            status: 'pending',
            blacklist_match: false,
            start_date: '2026-04-02',
            brand_name: 'FIT365',
            campaign: 'なし',
          },
          {
            id: 'APP-2026-0003',
            applicant_name: '鈴木 一郎',
            store_name: 'FIT365越谷店',
            plan_name: 'ナイト会員',
            application_date: '2026-03-30T11:08:00+09:00',
            status: 'pending',
            blacklist_match: true,
            start_date: '2026-04-01',
            brand_name: 'FIT365',
            campaign: 'なし',
          },
          {
            id: 'APP-2026-0004',
            applicant_name: '田中 美咲',
            store_name: 'FIT365八潮店',
            plan_name: 'ウィークエンド会員',
            application_date: '2026-03-30T11:45:00+09:00',
            status: 'pending',
            blacklist_match: false,
            start_date: '2026-04-05',
            brand_name: 'FIT365',
            campaign: '春の入会キャンペーン',
          },
          {
            id: 'APP-2026-0005',
            applicant_name: '伊藤 健二',
            store_name: 'FIT365草加店',
            plan_name: 'レギュラー会員（学生）',
            application_date: '2026-03-30T13:20:00+09:00',
            status: 'pending',
            blacklist_match: false,
            start_date: '2026-04-01',
            brand_name: 'FIT365',
            campaign: '学生割引キャンペーン',
          },
          {
            id: 'APP-2026-0006',
            applicant_name: '松本 奈々',
            store_name: 'ジョイフィット24越谷店',
            plan_name: 'レギュラー会員',
            application_date: '2026-03-30T14:05:00+09:00',
            status: 'pending',
            blacklist_match: false,
            start_date: '2026-04-01',
            brand_name: 'JOYFIT',
            campaign: 'なし',
          },
          {
            id: 'APP-2026-0007',
            applicant_name: '高橋 正男',
            store_name: 'ジョイフィット24草加店',
            plan_name: 'デイタイム会員',
            application_date: '2026-03-30T14:50:00+09:00',
            status: 'pending',
            blacklist_match: true,
            start_date: '2026-04-14',
            brand_name: 'JOYFIT',
            campaign: '春の入会キャンペーン',
          },
          {
            id: 'APP-2026-0008',
            applicant_name: '渡辺 由美子',
            store_name: 'FIT365八潮店',
            plan_name: 'レギュラー会員',
            application_date: '2026-03-30T08:05:00+09:00',
            status: 'approved',
            blacklist_match: false,
            start_date: '2026-04-01',
            brand_name: 'FIT365',
            campaign: 'なし',
          },
          {
            id: 'APP-2026-0009',
            applicant_name: '中村 拓也',
            store_name: 'FIT365越谷店',
            plan_name: 'デイタイム会員',
            application_date: '2026-03-30T07:42:00+09:00',
            status: 'approved',
            blacklist_match: false,
            start_date: '2026-04-01',
            brand_name: 'FIT365',
            campaign: 'なし',
          },
          {
            id: 'APP-2026-0010',
            applicant_name: '小林 優子',
            store_name: 'ジョイフィット24越谷店',
            plan_name: 'ナイト会員',
            application_date: '2026-03-30T09:55:00+09:00',
            status: 'approved',
            blacklist_match: false,
            start_date: '2026-04-01',
            brand_name: 'JOYFIT',
            campaign: '法人会員キャンペーン',
          },
          {
            id: 'APP-2026-0011',
            applicant_name: '加藤 次郎',
            store_name: 'FIT365八潮店',
            plan_name: 'レギュラー会員（シニア）',
            application_date: '2026-03-29T14:20:00+09:00',
            status: 'pending',
            blacklist_match: false,
            start_date: '2026-04-01',
            brand_name: 'FIT365',
            campaign: 'シニア割引キャンペーン',
          },
          {
            id: 'APP-2026-0012',
            applicant_name: '吉田 恵子',
            store_name: 'FIT365越谷店',
            plan_name: 'レギュラー会員',
            application_date: '2026-03-29T09:55:00+09:00',
            status: 'rejected',
            blacklist_match: false,
            start_date: '2026-04-01',
            brand_name: 'FIT365',
            campaign: 'なし',
          },
          {
            id: 'APP-2026-0013',
            applicant_name: '山本 直人',
            store_name: 'FIT365草加店',
            plan_name: 'ウィークエンド会員',
            application_date: '2026-03-28T11:22:00+09:00',
            status: 'cancelled',
            blacklist_match: false,
            start_date: '2026-04-01',
            brand_name: 'FIT365',
            campaign: 'なし',
          },
          {
            id: 'APP-2026-0014',
            applicant_name: '木村 幸子',
            store_name: 'ジョイフィット24草加店',
            plan_name: 'レギュラー会員',
            application_date: '2026-03-28T08:50:00+09:00',
            status: 'approved',
            blacklist_match: false,
            start_date: '2026-04-07',
            brand_name: 'JOYFIT',
            campaign: 'なし',
          },
          {
            id: 'APP-2026-0015',
            applicant_name: '石川 雄介',
            store_name: 'FIT365八潮店',
            plan_name: 'デイタイム会員',
            application_date: '2026-03-27T16:30:00+09:00',
            status: 'rejected',
            blacklist_match: false,
            start_date: '2026-04-01',
            brand_name: 'FIT365',
            campaign: '春の入会キャンペーン',
          },
          {
            id: 'APP-2026-0016',
            applicant_name: '前田 由香',
            store_name: 'FIT365八潮店',
            plan_name: 'レギュラー会員',
            application_date: '2026-03-30T15:40:00+09:00',
            status: 'review',
            blacklist_match: true,
            start_date: '2026-04-01',
            brand_name: 'FIT365',
            campaign: '学生割引キャンペーン',
          },
          {
            id: 'APP-2026-0017',
            applicant_name: '若林 みなみ',
            store_name: 'ジョイフィット24越谷店',
            plan_name: 'レギュラー会員（学生）',
            application_date: '2026-03-30T10:00:00+09:00',
            status: 'pending',
            blacklist_match: false,
            start_date: '2026-04-01',
            brand_name: 'JOYFIT',
            campaign: '学生割引キャンペーン',
            is_minor: true,
          },
          {
            id: 'APP-2026-0018',
            applicant_name: '青木 太一',
            store_name: 'FIT365草加店',
            plan_name: 'レギュラー会員',
            application_date: '2026-03-30T09:00:00+09:00',
            status: 'pending',
            blacklist_match: false,
            start_date: '2026-04-01',
            brand_name: 'FIT365',
            campaign: 'なし',
            is_proxy: true,
          },
          {
            id: 'APP-2026-0019',
            applicant_name: '小川 拓海',
            store_name: 'ジョイフィット24越谷店',
            plan_name: 'レギュラー会員',
            application_date: '2026-03-30T12:30:00+09:00',
            status: 'pending',
            blacklist_match: false,
            start_date: '2026-04-01',
            brand_name: 'JOYFIT',
            campaign: 'なし',
          },
        ];

        this._applications.push(...seed);

        function maskPhone(real: string) {
          return real.replace(/(\d{3})-(\d{4})-(\d{4})/, '$1-****-$3');
        }
        function maskEmail(real: string) {
          const [local, domain] = real.split('@');
          return `${local.slice(0, 2)}***@${domain}`;
        }
        function maskAddress(real: string) {
          return real.replace(/(\d+-\d+-\d+)$/, '***');
        }

        const FEE_ROWS_JOYFIT = [
          { label: '入会金', amount: 2200 },
          { label: '登録事務手数料', amount: 3300 },
          { label: '初月会費（日割）', amount: 990 },
          { label: '翌月会費', amount: 7700 },
        ];
        const FEE_ROWS_FIT365 = [
          { label: 'カード発行料', amount: 5500 },
          { label: '初月会費（日割）', amount: 990 },
          { label: '翌月会費', amount: 7700 },
        ];

        const SPECIAL_DETAILS: Record<string, Record<string, unknown>> = {
          'APP-2026-0003': {
            blacklist_conditions: ['氏名＆生年月日一致', '電話番号一致'],
            timeline: [
              {
                id: 'tl-0003-2',
                kind: 'system',
                date: '2026/03/25 11:00',
                operator: 'システム',
                content: 'ブラックリスト照合で一致を検出しました。',
              },
              {
                id: 'tl-0003-1',
                kind: 'system',
                date: '2026/03/25 10:30',
                operator: 'システム',
                content: '申請受付（アプリ経由）',
              },
            ],
          },
          'APP-2026-0007': {
            blacklist_conditions: ['氏名＆生年月日一致'],
            timeline: [
              {
                id: 'tl-0007-1',
                kind: 'system',
                date: '2026/03/26 14:00',
                operator: 'システム',
                content: '申請受付（アプリ経由）',
              },
            ],
          },
          'APP-2026-0008': {
            approved_by: '管理者A',
            approved_at: '2026/03/26 15:30',
            timeline: [
              {
                id: 'tl-0008-3',
                kind: 'system',
                date: '2026/03/26 15:30',
                operator: '管理者A',
                content: '入会申請を承認しました。会員登録完了通知を送信しました。',
              },
              {
                id: 'tl-0008-2',
                kind: 'memo',
                date: '2026/03/26 15:00',
                operator: '管理者A',
                content: '本人確認書類を目視確認済み。',
              },
              {
                id: 'tl-0008-1',
                kind: 'system',
                date: '2026/03/26 14:00',
                operator: 'システム',
                content: '申請受付（アプリ経由）',
              },
            ],
          },
          'APP-2026-0016': {
            blacklist_conditions: ['氏名＆生年月日一致', '住所一致'],
            timeline: [
              {
                id: 'tl-0016-1',
                kind: 'system',
                date: '2026/03/30 15:40',
                operator: 'システム',
                content: '申請受付（アプリ経由）',
              },
            ],
          },
          'APP-2026-0017': {
            applicant_kana: 'ワカバヤシ ミナミ',
            birth_date: '2009/05/15',
            age: 16,
            gender_label: '女性',
            parental_consent: true,
            timeline: [
              {
                id: 'tl-0017-1',
                kind: 'system',
                date: '2026/03/30 10:00',
                operator: 'システム',
                content: '申請受付（アプリ経由）',
              },
            ],
          },
          'APP-2026-0018': {
            application_source: '管理画面',
            proxy_applicant: '管理者A（STAFF-001）',
            agreement_date: '2026/03/30 09:00',
            timeline: [
              {
                id: 'tl-0018-1',
                kind: 'system',
                date: '2026/03/30 09:00',
                operator: '管理者A',
                content: '管理画面から代理申請を登録',
              },
            ],
          },
        };

        for (const app of seed) {
          const phoneReal = '090-1234-5678';
          const emailReal = `${app.id.toLowerCase().replaceAll('-', '')}@example.jp`;
          const addressReal = '東京都渋谷区1-2-3';
          const special = SPECIAL_DETAILS[app.id] ?? {};
          const feeRows = app.brand_name === 'FIT365' ? FEE_ROWS_FIT365 : FEE_ROWS_JOYFIT;
          const monthlyFee = 7700;

          this._details[app.id] = {
            applicant_kana: (special.applicant_kana as string) ?? 'ヤマダ タロウ',
            birth_date: (special.birth_date as string) ?? '1990/01/15',
            age: (special.age as number) ?? 36,
            gender_label: (special.gender_label as string) ?? '男性',
            phone: maskPhone(phoneReal),
            phone_real: phoneReal,
            email_masked: maskEmail(emailReal),
            email_real: emailReal,
            address: maskAddress(addressReal),
            address_real: addressReal,
            blacklist_conditions: (special.blacklist_conditions as string[]) ?? [],
            usage_start_date: app.start_date.replaceAll('-', '/'),
            monthly_fee: monthlyFee,
            options: ['タオル'],
            fee_rows: feeRows,
            payment_method: 'クレジットカード',
            card_last4: '1234',
            application_source: (special.application_source as string) ?? 'アプリ',
            updated_at: '2026/03/30 09:20',
            parental_consent: (special.parental_consent as boolean) ?? false,
            proxy_applicant: special.proxy_applicant as string | undefined,
            agreement_date: special.agreement_date as string | undefined,
            approved_by: special.approved_by as string | undefined,
            approved_at: special.approved_at as string | undefined,
            rejected_by: special.rejected_by as string | undefined,
            rejected_at: special.rejected_at as string | undefined,
            rejected_reason: special.rejected_reason as string | undefined,
            timeline: (special.timeline as MembershipApplicationDetails['timeline']) ?? [
              {
                id: `tl-${app.id}-1`,
                kind: 'system' as const,
                date: '2026/03/30 09:15',
                operator: 'システム',
                content: '申請受付（アプリ経由）',
              },
            ],
          };
        }
      },

      getAll(): MembershipApplication[] {
        this._seed();
        return [...this._applications];
      },

      getById(id: string): MembershipApplication | undefined {
        this._seed();
        return this._applications.find((a) => a.id === id);
      },

      getDetails(id: string) {
        this._seed();
        return this._details[id] ?? {};
      },

      updateDetails(id: string, patch: Record<string, any>) {
        this._seed();
        const exists = this._applications.some((a) => a.id === id);
        if (!exists) return undefined;
        this._details[id] = { ...(this._details[id] ?? {}), ...patch };
        return this._details[id];
      },

      updateStatus(
        id: string,
        status: MembershipApplicationStatus,
      ): MembershipApplication | undefined {
        this._seed();
        const idx = this._applications.findIndex((a) => a.id === id);
        if (idx === -1) return undefined;
        this._applications[idx] = { ...this._applications[idx], status };
        return this._applications[idx];
      },

      addMemo(
        id: string,
        content: string,
        operator: string,
      ): MembershipApplicationDetails['timeline'] | undefined {
        this._seed();
        const exists = this._applications.some((a) => a.id === id);
        if (!exists) return undefined;

        const details = this._details[id] ?? {};
        const timeline = (details.timeline ?? []) as NonNullable<
          MembershipApplicationDetails['timeline']
        >;

        const now = new Date();
        const dateStr = now.toLocaleString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });

        const newMemo = {
          id: `tl-${Date.now()}-memo`,
          kind: 'memo' as const,
          date: dateStr.replace(/\//g, '/'),
          operator,
          content,
        };

        const updatedTimeline = [newMemo, ...timeline];
        this._details[id] = { ...details, timeline: updatedTimeline };

        return updatedTimeline;
      },

      deleteMemo(id: string, memoId: string): boolean {
        this._seed();
        const exists = this._applications.some((a) => a.id === id);
        if (!exists) return false;

        const details = this._details[id];
        if (!details || !details.timeline) return false;

        const memoIndex = details.timeline.findIndex((entry) => entry.id === memoId);
        if (memoIndex === -1) return false;

        const updatedTimeline = details.timeline.filter((_, idx) => idx !== memoIndex);
        this._details[id] = { ...details, timeline: updatedTimeline };

        return true;
      },

      createDirect(data: DirectEnrollmentRequestType, blMatched: boolean): MembershipApplication {
        this._seed();
        const id = `APP-DIRECT-${Date.now()}`;
        const newApp: MembershipApplication = {
          id,
          applicant_name: `${data.applicant.last_name_kanji}${data.applicant.first_name_kanji}`,
          status: 'pending',
          blacklist_match: blMatched,
          brand_name: data.contract.brand,
          store_name: data.contract.store_id,
          plan_name: data.contract.plan_id,
          campaign: data.contract.campaign_id ?? 'なし',
          application_date: new Date().toISOString(),
          start_date: data.contract.start_date,
          is_proxy: true,
        };
        this._applications.push(newApp);
        this._details[id] = {
          applicant_name: newApp.applicant_name,
          proxy_applicant: '管理者A（STAFF-001）',
          agreement_date: new Date().toISOString(),
          payment_method: data.contract.payment_method,
          usage_start_date: data.contract.start_date,
          timeline: [],
        };
        return newApp;
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
            (m.profile.member_type === MemberType.REGULAR ||
              m.profile.member_type === MemberType.CORPORATE ||
              m.profile.member_type === MemberType.ONE_DAY_MEMBER) &&
            m.profile.status === MemberStatus.ACTIVE,
        );
        const familyCandidates = members.filter((m) => m.profile.member_type === MemberType.FAMILY);

        for (let i = 0; i < primaries.length; i++) {
          const p = primaries[i]!;
          const childCount = i % 4;
          const rels: Array<{
            child_member_id: string;
            relationship: FamilyRelationship;
            joined_at: string;
          }> = [];
          for (let j = 0; j < childCount; j++) {
            const child = familyCandidates[(i * 3 + j) % familyCandidates.length]!;
            rels.push({
              child_member_id: child.basic_info.id,
              relationship: (
                ['spouse', 'child', 'parent', 'sibling', 'grandparent', 'grandchild'] as const
              )[(i + j) % 6]!,
              joined_at: child.profile.joined_at,
            });
          }
          if (rels.length) this._relationships.set(p.basic_info.id, rels);
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
        let childIdx = 0;
        for (const { type, count } of typeGroups) {
          const typePrimaries = members.filter(
            (m) => m.profile.member_type === type && m.profile.status === MemberStatus.ACTIVE,
          );
          for (let k = 0; k < Math.min(count, typePrimaries.length); k++) {
            const p = typePrimaries[k]!;
            if (this._relationships.has(p.basic_info.id)) continue;
            const numChildren = (k % 3) + 1;
            const rels: Array<{
              child_member_id: string;
              relationship: FamilyRelationship;
              joined_at: string;
            }> = [];
            for (let j = 0; j < numChildren; j++) {
              const child = familyCandidates[childIdx % familyCandidates.length]!;
              childIdx++;
              rels.push({
                child_member_id: child.basic_info.id,
                relationship: relationships[(k + j) % relationships.length]!,
                joined_at: child.profile.joined_at,
              });
            }
            this._relationships.set(p.basic_info.id, rels);
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
            primary_member_id: primary.basic_info.id,
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

      getBrandSettingsByPrimaryMemberId(primary_member_id: string) {
        this._seed();
        const db = getDb();
        const primary = db.members.get(primary_member_id);
        const mainBrand = primary?.profile.main_brand ?? 'fit365';
        const settings = this._brandSettings[mainBrand] ?? this._brandSettings[Brand.FIT365];
        const brand = primary?.profile.brand ?? Brand.FIT365;
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
              id: child.basic_info.id,
              member_number: child.basic_info.member_number,
              name_kanji: child.basic_info.name_kanji,
              relationship: r.relationship,
              joined_at: r.joined_at,
              status: child.profile.status,
              monthly_fee: settings.family_member_fee,
              store_id: child.profile.store_id,
              store_name: child.profile.store_name,
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
        patch?: Record<string, any>,
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
              referee.profile.status === MemberStatus.ACTIVE ||
              referee.profile.status === MemberStatus.SUSPENDED;
            const withdrew =
              referee.profile.status === MemberStatus.WITHDRAWN ||
              referee.profile.status === MemberStatus.FORCE_WITHDRAWN;
            const points = joined ? 300 * k : null;
            const points_status_ja = joined
              ? `付与済み（${points}P）`
              : withdrew
                ? '退会により対象外'
                : '未付与';
            batch.push({
              referee_member_id: referee.basic_info.id,
              referred_at: referredAt,
              points_earned: points,
              points_status_ja,
            });
            if (!this._refereeToReferrer.has(referee.basic_info.id)) {
              this._refereeToReferrer.set(referee.basic_info.id, {
                referrer_member_id: referrer.basic_info.id,
                referred_at: referredAt,
                benefit_description: '初月会費50%オフ（紹介特典）',
              });
            }
          }
          if (batch.length) this._byReferrer.set(referrer.basic_info.id, batch);
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

      const memberType = member.profile.member_type;

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
                id: child.basic_info.id,
                member_number: child.basic_info.member_number,
                name: child.basic_info.name_kanji,
                relationship: familyRelationshipToJa(r.relationship),
                status: child.profile.status,
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
                id: parent.basic_info.id,
                member_number: parent.basic_info.member_number,
                name: parent.basic_info.name_kanji,
                relationship: relEnum ? familyRelationshipToJa(relEnum) : '—',
                status: parent.profile.status,
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
        corporate = {
          corporate_detail_member_id: member.basic_info.id,
          corporate_name: `${member.basic_info.name_kanji}（法人契約）`,
          corporate_number: `7${String(member.basic_info.id.replace(/\D/g, '') || '0')
            .padStart(12, '0')
            .slice(0, 12)}`,
          contract_type: '法人団体契約（標準）',
          company_discount: { applied: true, rate_percent: 20 },
          contact_department: '総務・人事部',
          contact_name: '営業 一郎',
        };
      } else if (memberType === MemberType.ONE_DAY_MEMBER) {
        const corpMember = db.members._members.find(
          (m) => m.profile.member_type === MemberType.CORPORATE,
        );
        if (corpMember) {
          corporate = {
            corporate_detail_member_id: corpMember.basic_info.id,
            corporate_name: 'サンプル株式会社（社割提携法人）',
            corporate_number: '7010001056789',
            contract_type: '社員優待（法人付帯）',
            company_discount: { applied: true, rate_percent: 15 },
            contact_department: '人事部',
            contact_name: corpMember.basic_info.name_kanji,
          };
        }
      }

      const { asReferrerRows, asRefereeRow } = db.referrals.getForMember(memberId);
      const referralsMapped = asReferrerRows
        .map((r) => {
          const refMember = db.members.get(r.referee_member_id);
          if (!refMember) return undefined;
          const st = refMember.profile.status;
          let membership_status_ja = '未入会';
          if (st === MemberStatus.ACTIVE) membership_status_ja = '入会済み（利用中）';
          else if (st === MemberStatus.SUSPENDED) membership_status_ja = '入会済み（休会中）';
          else if (st === MemberStatus.WITHDRAWN || st === MemberStatus.FORCE_WITHDRAWN)
            membership_status_ja = '退会済み';
          return {
            id: refMember.basic_info.id,
            member_number: refMember.basic_info.member_number,
            name: refMember.basic_info.name_kanji,
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
              id: ref.basic_info.id,
              member_number: ref.basic_info.member_number,
              name: ref.basic_info.name_kanji,
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
