const LEVELS = { debug: 10, info: 20, log: 20, warn: 30, error: 40 };
const CUR = LEVELS[(process.env.LOG_LEVEL || 'info').toLowerCase()] ?? 20;
export const debug = (...a) => { if (CUR <= 10) console.debug('[srv]', ...a) };
export const info  = (...a) => { if (CUR <= 20) console.info('[srv]', ...a) };
export const log   = (...a) => { if (CUR <= 20) console.log('[srv]', ...a) };
export const warn  = (...a) => { if (CUR <= 30) console.warn('[srv]', ...a) };
export const error = (...a) => console.error('[srv]', ...a);
