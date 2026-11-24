import dns from 'node:dns/promises';
import type { DnsCheck } from '@scamhisn/shared';

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(fallback);
      });
  });
}

export async function inspectDns(
  hostname: string,
  registrableDomain: string | null,
  timeoutMs = 4000,
): Promise<DnsCheck> {
  const domainForMail = registrableDomain ?? hostname;

  const [aRecords, aaaaRecords, mxEntries, txtRecords, dmarcRecords] = await Promise.all([
    withTimeout(dns.resolve4(hostname), timeoutMs, [] as string[]),
    withTimeout(dns.resolve6(hostname), timeoutMs, [] as string[]),
    withTimeout(dns.resolveMx(domainForMail), timeoutMs, [] as Array<{ exchange: string; priority: number }>),
    withTimeout(dns.resolveTxt(domainForMail), timeoutMs, [] as string[][]),
    withTimeout(dns.resolveTxt(`_dmarc.${domainForMail}`), timeoutMs, [] as string[][]),
  ]);

  const flatTxt = txtRecords.map((parts) => parts.join(''));
  const flatDmarc = dmarcRecords.map((parts) => parts.join(''));

  const hasSpf = flatTxt.some((record) => /^v=spf1\b/i.test(record.trim()));
  const hasDmarc = flatDmarc.some((record) => /^v=dmarc1\b/i.test(record.trim()));

  return {
    aRecords: aRecords.slice(0, 10),
    aaaaRecords: aaaaRecords.slice(0, 10),
    mxRecords: mxEntries
      .sort((a, b) => a.priority - b.priority)
      .map((m) => m.exchange)
      .slice(0, 8),
    hasSpf,
    hasDmarc,
  };
}
