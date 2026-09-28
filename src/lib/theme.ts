import type { CSSProperties } from "react";
import type { Tenant } from "@prisma/client";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function isHexColor(value: string): boolean {
  return HEX_RE.test(value);
}

// Variables CSS injectées sur le site de l'établissement ; Tailwind les expose
// sous les classes bg-brand, text-accent, etc.
export function tenantTheme(tenant: Pick<Tenant, "primaryColor" | "accentColor">): CSSProperties {
  return {
    "--brand": isHexColor(tenant.primaryColor) ? tenant.primaryColor : "#F77F00",
    "--accent": isHexColor(tenant.accentColor) ? tenant.accentColor : "#009E60",
  } as CSSProperties;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => w.length > 2 || /^[A-Z]/.test(w))
    .slice(0, 3)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}
