/**
 * Remembers that a provider refused an option (for example Google Search grounding, which the
 * Gemini free tier does not offer for every model) so later scans skip straight to what works
 * instead of spending one failed API call per scan rediscovering it.
 */
export class RefusalMemo {
  private readonly refusedUntil = new Map<string, number>();

  constructor(
    private readonly coolDownMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  private key(providerId: string, option: string): string {
    return `${providerId}|${option}`;
  }

  remember(providerId: string, option: string): void {
    this.refusedUntil.set(this.key(providerId, option), this.now() + this.coolDownMs);
  }

  /** Epoch milliseconds at which the refusal expires, or null when it is not refused. */
  until(providerId: string, option: string): number | null {
    return this.isRefused(providerId, option)
      ? (this.refusedUntil.get(this.key(providerId, option)) ?? null)
      : null;
  }

  isRefused(providerId: string, option: string): boolean {
    const until = this.refusedUntil.get(this.key(providerId, option));
    if (until === undefined) return false;
    if (this.now() >= until) {
      this.refusedUntil.delete(this.key(providerId, option));
      return false;
    }
    return true;
  }
}
