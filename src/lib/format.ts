const ENGLISH_INTEGER_FORMATTER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  useGrouping: true,
});

/** Deterministic on the server and client so currency text can hydrate safely. */
export function formatYen(amount: number) {
  return `¥${ENGLISH_INTEGER_FORMATTER.format(amount)}`;
}
