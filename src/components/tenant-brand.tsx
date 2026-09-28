import Link from "next/link";
import type { Tenant } from "@prisma/client";
import { initials } from "@/lib/theme";

export function TenantBrand({ tenant, href = "/" }: { tenant: Tenant; href?: string }) {
  return (
    <Link href={href} className="flex min-w-0 items-center gap-3">
      {tenant.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={tenant.logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-contain" />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
          {initials(tenant.name)}
        </span>
      )}
      <span className="truncate font-semibold">{tenant.name}</span>
    </Link>
  );
}
