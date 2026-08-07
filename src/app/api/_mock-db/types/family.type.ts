import type {
  EkycResult,
  FamilyRegistrationStatus,
  FamilyRelationship,
} from '@/app/api/_schemas/family-registration.schema';

export type FamilyType = {
  _seeded: boolean;
  _seed(): void;
  _brandSettings: Record<
    string,
    { family_member_limit: number; family_member_fee: number; payment_cycle: string }
  >;
  _relationships: Map<
    string,
    Array<{ child_member_id: string; relationship: FamilyRelationship; joined_at: string }>
  >;
  _registrations: Array<{
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
  }>;
  getBrandSettingsByPrimaryMemberId(primary_member_id: string): {
    brand: string;
    settings: { family_member_limit: number; family_member_fee: number; payment_cycle: string };
  };
  getFamilyMembers(primary_member_id: string): {
    brand: string;
    settings: { family_member_limit: number; family_member_fee: number; payment_cycle: string };
    members: Array<{
      id: string;
      member_number: string;
      name_kanji: string;
      relationship: FamilyRelationship;
      joined_at: string;
      status: string;
      monthly_fee: number;
      store_id: string;
      store_name: string;
    }>;
  };
  getPrimaryMemberIdForChild(child_member_id: string): string | undefined;
  getRelationshipToPrimary(
    child_member_id: string,
    primary_member_id: string,
  ): FamilyRelationship | undefined;
  listChildRelationships(
    primary_member_id: string,
  ): Array<{ child_member_id: string; relationship: FamilyRelationship; joined_at: string }>;
  listRegistrations(): Array<{
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
  }>;
  getRegistrationById(id: string):
    | {
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
      }
    | undefined;
  createRegistration(input: {
    primary_member_id: string;
    applicant: {
      name: string;
      birthday: string;
      relationship: FamilyRelationship;
      phone?: string;
      email?: string;
    };
  }): {
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
  };
  linkChildRelationship(
    primary_member_id: string,
    child_member_id: string,
    relationship: FamilyRelationship,
  ): void;
  updateRegistrationStatus(
    id: string,
    status: FamilyRegistrationStatus,
    patch?: Record<string, unknown>,
  ):
    | {
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
      }
    | undefined;
};
