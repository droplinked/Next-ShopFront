/**
 * Pure JS twin of the commission formatter in
 * src/app/(routes)/publisher-invite/[token]/components/ProgramHighlights.tsx
 *
 * Mirrors the implementation so the test file can import without
 * pulling React into the runner. Keeps the format spec pinned.
 */

export function formatCommission(program) {
  if (program.commissionType === 'FLAT' && typeof program.commissionRate === 'number') {
    const sym = program.commissionCurrency || 'USD';
    return `${sym} ${program.commissionRate.toFixed(2)} / sale`;
  }
  if (program.commissionType === 'PERCENT' && typeof program.commissionRate === 'number') {
    const pct = program.commissionRate <= 1
      ? program.commissionRate * 100
      : program.commissionRate;
    return `${pct.toFixed(pct % 1 === 0 ? 0 : 1)}%`;
  }
  if (typeof program.commissionRate === 'number') {
    const pct = program.commissionRate <= 1
      ? program.commissionRate * 100
      : program.commissionRate;
    return `${pct.toFixed(pct % 1 === 0 ? 0 : 1)}%`;
  }
  return 'Commission TBD';
}
