export interface TokenResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string | null;
}

export interface CallCostItem {
  SegId: number;
  GroupName: string;
  SrcDn: string;
  SrcDisplayName: string;
  StartTime: string;
  DstDn: string;
  DstDnClass: number;
  IsAnswered: boolean;
  TalkingDur: string;
  RingingDur: string;
  BillingCost: number;
  CallType: string;
}

export interface CallCostResponse {
  '@odata.context': string;
  value: CallCostItem[];
}
