import tls from 'node:tls';
import type { TlsCheck } from '@scamhisn/shared';

function formatCertEntity(entity: tls.PeerCertificate['issuer'] | undefined): string | null {
  if (!entity) return null;
  const rawValues = [entity.O, entity.CN].flatMap((v) =>
    Array.isArray(v) ? v : v !== undefined ? [v] : [],
  );
  const parts = rawValues.map((v) => v.trim()).filter(Boolean);
  if (parts.length > 0) return Array.from(new Set(parts)).join(' — ');
  return null;
}

function parseSubjectAltNames(subjectaltname: string | undefined): string[] {
  if (!subjectaltname) return [];
  return subjectaltname
    .split(',')
    .map((entry) => entry.trim().replace(/^DNS:|^IP Address:/i, ''))
    .filter(Boolean)
    .slice(0, 25);
}

/**
 * Inspects SSL/TLS certificate metadata and validity using Node.js built-in `tls` module.
 * Uses `rejectUnauthorized: false` solely for inspection while recording strict authorization
 * diagnostics (`authorized`, `authorizationError`, `checkServerIdentity`, self-signed, expiry).
 */
export async function inspectTls(targetUrl: URL, timeoutMs = 6000): Promise<TlsCheck> {
  if (targetUrl.protocol !== 'https:') {
    return {
      isHttps: false,
      checked: true,
      valid: false,
      authorized: false,
      authorizationError: 'Plain HTTP connection (no TLS encryption)',
      selfSigned: false,
      expired: false,
      notYetValid: false,
      hostnameMismatch: false,
      issuer: null,
      subject: null,
      subjectAltNames: [],
      validFrom: null,
      validTo: null,
      daysRemaining: null,
      protocol: null,
      error: null,
    };
  }

  const host = targetUrl.hostname.replace(/^\[|\]$/g, '');
  const port = targetUrl.port ? Number.parseInt(targetUrl.port, 10) : 443;

  return new Promise<TlsCheck>((resolve) => {
    let settled = false;
    const finish = (result: TlsCheck) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const socket = tls.connect({
      host,
      port,
      servername: /^[0-9.]+$/.test(host) || host.includes(':') ? undefined : host,
      rejectUnauthorized: false,
      timeout: timeoutMs,
    });

    const timer = setTimeout(() => {
      socket.destroy();
      finish({
        isHttps: true,
        checked: false,
        valid: false,
        authorized: false,
        authorizationError: 'TLS_TIMEOUT',
        selfSigned: false,
        expired: false,
        notYetValid: false,
        hostnameMismatch: false,
        issuer: null,
        subject: null,
        subjectAltNames: [],
        validFrom: null,
        validTo: null,
        daysRemaining: null,
        protocol: null,
        error: `TLS handshake timed out after ${timeoutMs}ms`,
      });
    }, timeoutMs);

    socket.once('secureConnect', () => {
      clearTimeout(timer);
      try {
        const cert = socket.getPeerCertificate(false);
        const authorized = socket.authorized;
        const authorizationError = socket.authorizationError
          ? String(socket.authorizationError)
          : null;
        const protocol = socket.getProtocol() ?? null;

        if (!cert || Object.keys(cert).length === 0) {
          socket.destroy();
          finish({
            isHttps: true,
            checked: true,
            valid: false,
            authorized: false,
            authorizationError: authorizationError ?? 'NO_PEER_CERTIFICATE',
            selfSigned: false,
            expired: false,
            notYetValid: false,
            hostnameMismatch: false,
            issuer: null,
            subject: null,
            subjectAltNames: [],
            validFrom: null,
            validTo: null,
            daysRemaining: null,
            protocol,
            error: 'Server returned no TLS certificate',
          });
          return;
        }

        const now = Date.now();
        const validFromDate = cert.valid_from ? new Date(cert.valid_from) : null;
        const validToDate = cert.valid_to ? new Date(cert.valid_to) : null;

        const validFrom =
          validFromDate && !Number.isNaN(validFromDate.getTime())
            ? validFromDate.toISOString()
            : null;
        const validTo =
          validToDate && !Number.isNaN(validToDate.getTime())
            ? validToDate.toISOString()
            : null;

        const daysRemaining =
          validToDate && !Number.isNaN(validToDate.getTime())
            ? Math.floor((validToDate.getTime() - now) / (1000 * 60 * 60 * 24))
            : null;

        const expired =
          (validToDate !== null && !Number.isNaN(validToDate.getTime()) && now > validToDate.getTime()) ||
          authorizationError === 'CERT_HAS_EXPIRED';

        const notYetValid =
          (validFromDate !== null && !Number.isNaN(validFromDate.getTime()) && now < validFromDate.getTime()) ||
          authorizationError === 'CERT_NOT_YET_VALID';

        let hostnameMismatch = false;
        try {
          const identityErr = tls.checkServerIdentity(host, cert);
          hostnameMismatch = Boolean(identityErr);
        } catch {
          hostnameMismatch = true;
        }

        const issuerStr = formatCertEntity(cert.issuer);
        const subjectStr = formatCertEntity(cert.subject);
        const selfSigned =
          authorizationError === 'DEPTH_ZERO_SELF_SIGNED_CERT' ||
          authorizationError === 'SELF_SIGNED_CERT_IN_CHAIN' ||
          (!authorized &&
            issuerStr !== null &&
            subjectStr !== null &&
            issuerStr.toLowerCase() === subjectStr.toLowerCase());

        const valid = authorized && !expired && !notYetValid && !hostnameMismatch && !selfSigned;

        socket.destroy();
        finish({
          isHttps: true,
          checked: true,
          valid,
          authorized,
          authorizationError,
          selfSigned,
          expired,
          notYetValid,
          hostnameMismatch,
          issuer: issuerStr,
          subject: subjectStr,
          subjectAltNames: parseSubjectAltNames(cert.subjectaltname),
          validFrom,
          validTo,
          daysRemaining,
          protocol,
          error: null,
        });
      } catch (err) {
        socket.destroy();
        finish({
          isHttps: true,
          checked: false,
          valid: false,
          authorized: false,
          authorizationError: 'TLS_INSPECTION_ERROR',
          selfSigned: false,
          expired: false,
          notYetValid: false,
          hostnameMismatch: false,
          issuer: null,
          subject: null,
          subjectAltNames: [],
          validFrom: null,
          validTo: null,
          daysRemaining: null,
          protocol: null,
          error: err instanceof Error ? err.message : 'Unknown TLS inspection error',
        });
      }
    });

    socket.once('error', (err) => {
      clearTimeout(timer);
      socket.destroy();
      finish({
        isHttps: true,
        checked: false,
        valid: false,
        authorized: false,
        authorizationError: (err as NodeJS.ErrnoException).code ?? 'TLS_CONNECTION_ERROR',
        selfSigned: false,
        expired: false,
        notYetValid: false,
        hostnameMismatch: false,
        issuer: null,
        subject: null,
        subjectAltNames: [],
        validFrom: null,
        validTo: null,
        daysRemaining: null,
        protocol: null,
        error: err.message,
      });
    });
  });
}
