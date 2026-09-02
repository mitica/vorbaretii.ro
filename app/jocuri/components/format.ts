/**
 * Mici ajutoare de limbă pentru textele jocurilor. Logică pură, testată în
 * scripts/test-games.ts.
 */

/**
 * Numeralul cu „de": „21 de încercări", dar „19 încercări". Regula: de la 20 în
 * sus, cu excepția numerelor terminate în 01–19. Întoarce doar partea de
 * dinaintea substantivului: `${numeralDe(48)} întrebări` → „48 de întrebări".
 */
export function numeralDe(count: number): string {
  const lastTwo = Math.abs(count) % 100;
  const needsDe = count !== 0 && (lastTwo === 0 || lastTwo > 19);
  return needsDe ? `${count} de` : `${count}`;
}

/** „o încercare", „3 încercări", „20 de încercări" — acordul cu numeralul. */
export function tries(count: number): string {
  if (count === 1) return "o încercare";
  return `${numeralDe(count)} încercări`;
}
