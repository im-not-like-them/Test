import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function Button({ className, variant = "primary", ...props }: ComponentProps<"button"> & { variant?: "primary" | "secondary" | "danger" }) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50",
        variant === "primary" && "bg-brand text-white hover:brightness-110",
        variant === "secondary" && "border border-stone-300 bg-white text-stone-800 hover:bg-stone-100",
        variant === "danger" && "text-red-700 hover:bg-red-50",
        className,
      )}
      {...props}
    />
  );
}

export function ButtonLink({ className, variant = "primary", ...props }: ComponentProps<typeof Link> & { variant?: "primary" | "secondary" }) {
  return (
    <Link
      className={cx(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition",
        variant === "primary" ? "bg-brand text-white hover:brightness-110" : "border border-stone-300 bg-white text-stone-800 hover:bg-stone-100",
        className,
      )}
      {...props}
    />
  );
}

const fieldClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      {children}
      {hint && <span className="block text-xs text-stone-500">{hint}</span>}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cx(fieldClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cx(fieldClass, "min-h-24", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cx(fieldClass, className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("rounded-xl border border-stone-200 bg-white p-5 shadow-sm", className)} {...props} />;
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-stone-600">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <p
      role="status"
      className={cx(
        "mb-4 rounded-lg px-4 py-3 text-sm",
        error ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800",
      )}
    >
      {error ?? ok}
    </p>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">{children}</p>;
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700", className)}>{children}</span>;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-CI", { day: "numeric", month: "long", year: "numeric" }).format(date);
}
