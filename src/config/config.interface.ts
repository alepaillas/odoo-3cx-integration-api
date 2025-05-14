// src/config/config.interface.ts
export interface ThreeCxConfig {
  url: string;
  client_id: string;
  client_secret: string;
  grant_type: string;
  group_filter: string;
  call_class: string;
}
export interface OdooConfig {
  url: string;
  api_key: string;
}
export interface AppConfig {
  threecx: ThreeCxConfig;
}
