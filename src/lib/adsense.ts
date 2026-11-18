const defaultClient = 'ca-pub-7777536386845474';
const defaultSlot = '9970802556';
const configuredEnabled = import.meta.env.PUBLIC_ADSENSE_ENABLED;

// Keep local development placeholder-only unless ads are explicitly enabled.
export const adsenseEnabled =
  configuredEnabled === 'true' || (configuredEnabled === undefined && import.meta.env.PROD);
export const adsenseClient = adsenseEnabled
  ? (import.meta.env.PUBLIC_ADSENSE_CLIENT ?? defaultClient)
  : undefined;
export const adsenseSlot = adsenseEnabled
  ? (import.meta.env.PUBLIC_ADSENSE_SLOT ?? defaultSlot)
  : undefined;
