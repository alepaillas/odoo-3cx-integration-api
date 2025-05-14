// src/config/configuration.ts
export default () => ({
  threecx: {
    url: process.env.THREECX_URL,
    client_id: process.env.THREECX_CLIENT_ID,
    client_secret: process.env.THREECX_CLIENT_SECRET,
    grant_type: process.env.THREECX_GRANT_TYPE,
    group_filter: process.env.THREECX_GROUP_FILTER,
    call_class: process.env.THREECX_CALL_CLASS,
  },
});
