export type ReferralsType = {
  _seeded: boolean;
  _seed(): void;
  getForMember(memberId: string): {
    asReferrerRows: Array<{
      referee_member_id: string;
      referred_at: string;
      points_earned: number | null;
      points_status_ja: string;
    }>;
    asRefereeRow:
      | {
          referrer_member_id: string;
          referred_at: string;
          benefit_description: string;
        }
      | undefined;
  };
};
