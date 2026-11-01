import { loadLedger, saveLedger } from './store.js';

/**
 * Estimated list prices in USD. These are planning figures, not billing data: confirm them
 * against the Vertex AI pricing page and override per production in film.json -> pricing.
 */
export const DEFAULT_PRICING = {
  veoPerSecond: { '720p': 0.05, '1080p': 0.08 },
  imageEach: 0.04,
  textPerMInput: 0.3,
  textPerMOutput: 2.5,
  speechPerMChars: 30,
};

export function speechCost(film, characters) {
  return (characters / 1e6) * (film.pricing.speechPerMChars ?? DEFAULT_PRICING.speechPerMChars);
}

export function veoCost(film, seconds) {
  const table = film.pricing.veoPerSecond;
  return seconds * (table[film.settings.resolution] ?? table['720p']);
}

export function imageCost(film, count = 1) {
  return count * film.pricing.imageEach;
}

export function textCost(film, usage = {}) {
  const input = usage.promptTokenCount || 0;
  const output = (usage.candidatesTokenCount || 0) + (usage.thoughtsTokenCount || 0);
  return (input / 1e6) * film.pricing.textPerMInput + (output / 1e6) * film.pricing.textPerMOutput;
}

/**
 * Refuse a paid call that would take estimated spend past the production's cap.
 * reservedUsd covers jobs already started but not yet recorded (parallel clip renders).
 */
export function assertBudget(film, costUsd, what, reservedUsd = 0) {
  const ledger = loadLedger(film.slug);
  const cap = film.budget.capUsd;
  if (ledger.spentUsd + reservedUsd + costUsd > cap) {
    const err = new Error(
      `Budget cap reached: ${what} would cost ~$${costUsd.toFixed(2)}, ` +
      `spent ~$${ledger.spentUsd.toFixed(2)} of the $${cap.toFixed(2)} cap. ` +
      `Raise it with: film cap ${film.slug} <usd>`
    );
    err.code = 'BUDGET_CAP';
    throw err;
  }
}

export function record(film, { kind, model, units, costUsd, ref }) {
  const ledger = loadLedger(film.slug);
  ledger.entries.push({ at: new Date().toISOString(), kind, model, units, costUsd: Number(costUsd.toFixed(5)), ref });
  ledger.spentUsd = Number((ledger.spentUsd + costUsd).toFixed(5));
  saveLedger(film.slug, ledger);
  return ledger.spentUsd;
}
