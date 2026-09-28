import { NextResponse, type NextRequest } from "next/server";
import { SITE_HEADER, requestHost, resolveHost, rootDomain } from "@/lib/hosts";

// Chaque requête vers <slug>.<racine> (ou un domaine personnalisé) est réécrite
// en interne vers /sites/<site>/... ; l'URL affichée dans le navigateur ne change pas.
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const target = resolveHost(requestHost((name) => request.headers.get(name)), rootDomain());
  const headers = new Headers(request.headers);
  headers.delete(SITE_HEADER);

  if (target.kind === "platform") {
    // Les pages d'établissement ne sont jamais servies directement depuis le domaine racine.
    if (url.pathname === "/sites" || url.pathname.startsWith("/sites/")) {
      url.pathname = "/404";
      return NextResponse.rewrite(url, { request: { headers } });
    }
    return NextResponse.next({ request: { headers } });
  }

  headers.set(SITE_HEADER, target.site);
  url.pathname = `/sites/${encodeURIComponent(target.site)}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|robots.txt).*)"],
};
