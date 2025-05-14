export interface OdooSystemParameter {
  id: number;
  key: string;
  value: string;
}

export interface OdooResponse<T> {
  jsonrpc: string;
  id: null;
  result?: T;
  error?: {
    code: number;
    message: string;
    data: {
      name: string;
      debug: string;
      message: string;
      arguments: unknown[];
      context: Record<string, unknown>;
    };
  };
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
