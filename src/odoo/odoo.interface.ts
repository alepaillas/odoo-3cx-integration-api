// src/odoo/odoo.interface.ts
export interface OdooSystemParameter {
  id: number;
  key: string;
  value: string;
}

export interface OdooErrorData {
  name: string;
  debug: string;
  message: string;
  arguments: unknown[];
  context: Record<string, unknown>;
}

export interface OdooError {
  code: number;
  message: string;
  data: OdooErrorData;
}

export interface OdooResponse<T> {
  jsonrpc: string;
  id: null;
  result?: T;
  error?: OdooError;
}

export interface OdooLoginResponse {
  session_id: string;
  uid: string;
  username: string;
  partner_id: number;
  company_id: number;
  user_companies: unknown;
  db: string;
  is_admin: boolean;
  is_system: boolean;
}

export interface OdooLead {
  id?: number;
  name: string;
  contact_name?: string;
  email_from?: string;
  phone?: string;
  mobile?: string;
  street?: string;
  street2?: string;
  city?: string;
  state_id?: number;
  country_id?: number;
  zip?: string;
  description?: string;
  partner_id?: number;
  user_id?: number;
  team_id?: number;
  type?: 'lead' | 'opportunity';
}

export interface OdooLeadResponse {
  id: number;
}
