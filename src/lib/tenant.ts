import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Tenant } from "@prisma/client";
import { prisma } from "@/lib/db";
import { SITE_HEADER } from "@/lib/hosts";

export const getTenantBySite = cache(async (site: string): Promise<Tenant | null> => {
  const key = decodeURIComponent(site).toLowerCase();
  return key.includes(".")
    ? prisma.tenant.findUnique({ where: { customDomain: key } })
    : prisma.tenant.findUnique({ where: { slug: key } });
});

/**
 * Établissement de la requête courante, tel que résolu par le middleware.
 * Utilisé par les server actions, qui ne reçoivent pas les paramètres de route.
 */
export const currentTenant = cache(async (): Promise<Tenant> => {
  const site = (await headers()).get(SITE_HEADER);
  if (!site) notFound();
  const tenant = await getTenantBySite(site);
  if (!tenant) notFound();
  return tenant;
});
