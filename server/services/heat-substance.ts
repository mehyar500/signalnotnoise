const HEAT_SIGNALS = [
  { pattern: /unprecedented/gi, weight: 0.15 },
  { pattern: /shocking/gi, weight: 0.2 },
  { pattern: /breaking/gi, weight: 0.1 },
  { pattern: /bombshell/gi, weight: 0.25 },
  { pattern: /slammed/gi, weight: 0.15 },
  { pattern: /outrage/gi, weight: 0.2 },
  { pattern: /crisis/gi, weight: 0.15 },
  { pattern: /you won't believe/gi, weight: 0.25 },
  { pattern: /everyone is saying/gi, weight: 0.2 },
  { pattern: /could be catastrophic/gi, weight: 0.2 },
  { pattern: /!{2,}/g, weight: 0.1 },
  { pattern: /\b[A-Z]{4,}\b/g, weight: 0.05 },
  { pattern: /devastating/gi, weight: 0.15 },
  { pattern: /explosive/gi, weight: 0.2 },
  { pattern: /terrifying/gi, weight: 0.2 },
  { pattern: /unbelievable/gi, weight: 0.15 },
  { pattern: /fury/gi, weight: 0.15 },
  { pattern: /chaos/gi, weight: 0.15 },
  { pattern: /panic/gi, weight: 0.15 },
  { pattern: /alarming/gi, weight: 0.12 },
  { pattern: /urgent/gi, weight: 0.1 },
  { pattern: /extreme/gi, weight: 0.1 },
];

const SUBSTANCE_SIGNALS = [
  { pattern: /\$[\d,]+/g, weight: 0.2 },
  { pattern: /\d+%/g, weight: 0.2 },
  { pattern: /\d{1,3}(,\d{3})+/g, weight: 0.15 },
  { pattern: /"[^"]{10,}"/g, weight: 0.2 },
  { pattern: /according to/gi, weight: 0.15 },
  { pattern: /study|research|report/gi, weight: 0.15 },
  { pattern: /data shows/gi, weight: 0.15 },
  { pattern: /percent/gi, weight: 0.1 },
  { pattern: /billion|million|trillion/gi, weight: 0.15 },
  { pattern: /officials? said/gi, weight: 0.1 },
  { pattern: /announced/gi, weight: 0.08 },
  { pattern: /legislation|bill|law/gi, weight: 0.1 },
  { pattern: /voted?\s+\d+/gi, weight: 0.15 },
  { pattern: /per\s+capita/gi, weight: 0.12 },
  { pattern: /year-over-year|YoY/gi, weight: 0.12 },
];

function scoreSignals(text: string, signals: typeof HEAT_SIGNALS): number {
  let score = 0;
  for (const signal of signals) {
    const matches = text.match(signal.pattern);
    if (matches) {
      score += signal.weight * Math.min(matches.length, 3);
    }
  }
  return Math.min(score, 1);
}

export function analyzeHeatSubstance(text: string): { heat: number; substance: number; label: string } {
  const heat = scoreSignals(text, HEAT_SIGNALS);
  const substance = scoreSignals(text, SUBSTANCE_SIGNALS);

  let label: string;
  if (heat > 0.5 && substance < 0.3) label = 'High heat, low substance. Read skeptically.';
  else if (heat > 0.5 && substance > 0.5) label = 'High heat, high substance.';
  else if (heat < 0.3 && substance > 0.5) label = 'Low heat, high substance. Quality reporting.';
  else if (heat < 0.3 && substance < 0.3) label = 'Neutral coverage.';
  else label = 'Balanced coverage.';

  return { heat: Math.round(heat * 100) / 100, substance: Math.round(substance * 100) / 100, label };
}
