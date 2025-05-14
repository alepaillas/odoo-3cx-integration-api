// src/config/config.interface.ts
export interface ThreeCxConfig {
  url: string;
  client_id: string;
  client_secret: string;
  grant_type: string;
}

export interface AppConfig {
  threecx: ThreeCxConfig;
}
