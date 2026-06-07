const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function getDurationFromEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const ADMIN_SESSION_MAX_AGE_MS = getDurationFromEnv(
  'SESSION_MAX_AGE_MS',
  7 * ONE_DAY_MS,
);

export const REMEMBER_ME_SESSION_MAX_AGE_MS = getDurationFromEnv(
  'REMEMBER_ME_MAX_AGE_MS',
  30 * ONE_DAY_MS,
);
