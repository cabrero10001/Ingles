import type { DetectedError } from './types.js';
import { detectRuleBasedErrors } from './rules.js';
import { analyzeWithAI } from './aiHook.js';

export type AnalyzeOptions = {
  useAI?: boolean;
};

export async function analyzeWriting(text: string, opts: AnalyzeOptions = {}): Promise<DetectedError[]> {
  const ruleBased = detectRuleBasedErrors(text);
  if (opts.useAI) {
    const ai = await analyzeWithAI(text);
    return [...ruleBased, ...ai];
  }
  return ruleBased;
}
