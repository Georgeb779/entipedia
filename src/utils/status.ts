export const resolveStatusValue = <T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | null => {
  if (typeof value !== "string") {
    return null;
  }

  return (allowed as readonly string[]).includes(value) ? (value as T) : null;
};
