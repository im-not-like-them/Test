import Link from "next/link";
import { Card } from "@/components/ui";

export function ClassCard({ c, studentsLabel }: { c: { id: string; name: string; level: string; program: { name: string }; _count: { enrollments: number; courses: number } }; studentsLabel: string }) {
  return (
    <Link href={`/espace/classes/${c.id}`}>
      <Card className="h-full p-4 transition hover:border-brand/50">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">{c.level}</p>
        <h3 className="mt-1 font-semibold">{c.name}</h3>
        <p className="mt-1 text-sm text-stone-600">{c.program.name}</p>
        <p className="mt-3 text-xs text-stone-500">
          {c._count.enrollments} {studentsLabel.toLowerCase()} · {c._count.courses} cours
        </p>
      </Card>
    </Link>
  );
}
