import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenantBySite } from "@/lib/tenant";
import { tenantTheme } from "@/lib/theme";

type Props = { children: React.ReactNode; params: Promise<{ site: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tenant = await getTenantBySite((await params).site);
  return tenant ? { title: tenant.name, description: tenant.tagline ?? undefined } : {};
}

export default async function TenantLayout({ children, params }: Props) {
  const tenant = await getTenantBySite((await params).site);
  if (!tenant) notFound();
  return (
    <div style={tenantTheme(tenant)} className="min-h-screen">
      {children}
    </div>
  );
}
