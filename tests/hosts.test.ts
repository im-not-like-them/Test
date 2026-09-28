import { describe, expect, it } from "vitest";
import { isValidSlug, requestHost, resolveHost } from "@/lib/hosts";

describe("resolveHost", () => {
  const root = "kalanso.ci";

  it("sert la plateforme sur le domaine racine et www", () => {
    expect(resolveHost("kalanso.ci", root)).toEqual({ kind: "platform" });
    expect(resolveHost("www.kalanso.ci", root)).toEqual({ kind: "platform" });
    expect(resolveHost(null, root)).toEqual({ kind: "platform" });
  });

  it("résout un sous-domaine en établissement", () => {
    expect(resolveHost("ul.kalanso.ci", root)).toEqual({ kind: "tenant", site: "ul" });
    expect(resolveHost("UL.Kalanso.CI:443", root)).toEqual({ kind: "tenant", site: "ul" });
  });

  it("gère localhost avec port en développement", () => {
    expect(resolveHost("localhost:3000", "localhost:3000")).toEqual({ kind: "platform" });
    expect(resolveHost("palmiers.localhost:3000", "localhost:3000")).toEqual({ kind: "tenant", site: "palmiers" });
  });

  it("refuse les sous-domaines réservés ou imbriqués", () => {
    expect(resolveHost("api.kalanso.ci", root)).toEqual({ kind: "platform" });
    expect(resolveHost("a.b.kalanso.ci", root)).toEqual({ kind: "platform" });
  });

  it("traite les autres hôtes comme domaines personnalisés", () => {
    expect(resolveHost("portail.univ-exemple.ci", root)).toEqual({ kind: "tenant", site: "portail.univ-exemple.ci" });
    expect(resolveHost("127.0.0.1:3000", root)).toEqual({ kind: "platform" });
  });
});

describe("isValidSlug", () => {
  it("accepte les adresses simples", () => {
    expect(isValidSlug("ul")).toBe(true);
    expect(isValidSlug("lycee-les-palmiers")).toBe(true);
  });
  it("refuse les formats invalides et réservés", () => {
    for (const s of ["", "a", "-ul", "ul-", "UL", "ul.ci", "admin", "www", "x".repeat(41)]) {
      expect(isValidSlug(s)).toBe(false);
    }
  });
});

describe("requestHost", () => {
  const from = (h: Record<string, string>) => (name: string) => h[name] ?? null;
  it("privilégie x-forwarded-host (proxy, requête interne de Next.js)", () => {
    expect(requestHost(from({ host: "localhost:3000", "x-forwarded-host": "ul.localhost:3000" }))).toBe("ul.localhost:3000");
    expect(requestHost(from({ host: "10.0.0.5", "x-forwarded-host": "ul.kalanso.ci, proxy.interne" }))).toBe("ul.kalanso.ci");
  });
  it("retombe sur Host sinon", () => {
    expect(requestHost(from({ host: "palmiers.kalanso.ci" }))).toBe("palmiers.kalanso.ci");
  });
});
