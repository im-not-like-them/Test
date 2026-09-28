// Résolution du site (établissement) à partir du nom d'hôte de la requête.
// Ce module ne touche pas à la base : il est utilisé par le middleware.

export type HostTarget =
  | { kind: "platform" }
  | { kind: "tenant"; site: string };

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$/;

// Sous-domaines réservés à la plateforme, jamais attribuables à un établissement.
export const RESERVED_SLUGS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "static",
  "assets",
  "mail",
  "support",
  "status",
  "docs",
  "blog",
]);

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug) && !RESERVED_SLUGS.has(slug);
}

function stripPort(host: string): string {
  return host.replace(/:\d+$/, "");
}

export function resolveHost(rawHost: string | null, rootDomain: string): HostTarget {
  if (!rawHost) return { kind: "platform" };
  const host = stripPort(rawHost.trim().toLowerCase());
  const root = stripPort(rootDomain.trim().toLowerCase());

  if (host === root || host === `www.${root}`) return { kind: "platform" };

  if (host.endsWith(`.${root}`)) {
    const sub = host.slice(0, -(root.length + 1));
    // Un seul niveau de sous-domaine : a.b.racine n'est pas un établissement.
    if (!sub.includes(".") && isValidSlug(sub)) return { kind: "tenant", site: sub };
    return { kind: "platform" };
  }

  // Tout autre hôte est traité comme un domaine personnalisé (ex. portail.univ-exemple.ci).
  // IPs brutes et hôtes sans point retombent sur la plateforme.
  if (!host.includes(".") || /^[\d.]+$/.test(host)) return { kind: "platform" };
  return { kind: "tenant", site: host };
}

/**
 * Hôte d'origine de la requête. On privilégie x-forwarded-host : il est posé par
 * les reverse proxies en production, et c'est le seul en-tête qui conserve l'hôte
 * de l'établissement quand Next.js refait une requête interne (rendu après la
 * redirection d'une server action, envoyée à localhost).
 */
export function requestHost(get: (name: string) => string | null): string | null {
  const forwarded = get("x-forwarded-host")?.split(",")[0]?.trim();
  return forwarded || get("host");
}

// En-tête interne posé par le middleware ; toute valeur envoyée par le client est écrasée.
export const SITE_HEADER = "x-kalanso-site";

export function rootDomain(): string {
  return process.env.ROOT_DOMAIN ?? "localhost:3000";
}

export function tenantUrl(slug: string, path = "/"): string {
  const protocol = process.env.PROTOCOL ?? "http";
  return `${protocol}://${slug}.${rootDomain()}${path}`;
}

export function platformUrl(path = "/"): string {
  const protocol = process.env.PROTOCOL ?? "http";
  return `${protocol}://${rootDomain()}${path}`;
}
