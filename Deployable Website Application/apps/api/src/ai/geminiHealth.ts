import type { AiCapabilities } from '@scamhisn/shared';
import { config } from '../config.js';
import {
  computeCapabilities,
  FeatureUnavailableError,
  GEMINI_QUOTA,
  type GatedFeature,
} from './availability.js';
import { RefusalMemo } from './refusalMemo.js';

/**
 * Live health of every Gemini (key, model) pair, shared by link scans and image scans.
 * A pair that returns a quota or overload error is left alone for GEMINI_COOLDOWN_MS, so an
 * exhausted key costs zero further calls until its cool-down ends.
 */
const geminiCooldowns = new RefusalMemo(config.geminiCooldownMs);

export function geminiProviderId(keyIndex: number, model: string): string {
  return `gemini:key${keyIndex + 1}:${model}`;
}

/** Primary model first, then the backup model if one is configured. */
export function geminiModels(): string[] {
  const models = [config.geminiModel];
  if (config.geminiFallbackModel && config.geminiFallbackModel !== config.geminiModel) {
    models.push(config.geminiFallbackModel);
  }
  return models;
}

export function allGeminiProviderIds(): string[] {
  return geminiModels().flatMap((model) =>
    config.geminiApiKeys.map((_key, keyIndex) => geminiProviderId(keyIndex, model)),
  );
}

export function markGeminiExhausted(providerId: string): void {
  geminiCooldowns.remember(providerId, GEMINI_QUOTA);
}

export function isGeminiCoolingDown(providerId: string): boolean {
  return geminiCooldowns.isRefused(providerId, GEMINI_QUOTA);
}

export function getAiCapabilities(): AiCapabilities {
  return computeCapabilities({
    geminiProviderIds: allGeminiProviderIds(),
    coolingUntil: (id) => geminiCooldowns.until(id, GEMINI_QUOTA),
    localModel: config.localLlm?.model ?? null,
    pipeline: config.aiPipeline === 'hybrid' && config.localLlm ? 'hybrid' : 'gemini_first',
    now: Date.now(),
  });
}

/** Throws FeatureUnavailableError when a Gemini-dependent feature cannot run right now. */
export function assertFeatureAvailable(feature: GatedFeature): void {
  const availability = getAiCapabilities().features[feature];
  if (!availability.available) {
    throw new FeatureUnavailableError(feature, availability);
  }
}
