export function getErrorMessage(
  error: unknown,
  fallback = 'Unexpected error',
): string {
  return error instanceof Error ? error.message : fallback;
}

export function getErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}
