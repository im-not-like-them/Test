import type { Announcement, User } from "@prisma/client";
import { Badge, Button, Card, Empty, Field, Input, Textarea, formatDate } from "@/components/ui";
import { deleteAnnouncement, postAnnouncement } from "@/app/sites/[site]/espace/actions";

type Item = Announcement & { author: Pick<User, "firstName" | "lastName">; classGroup?: { name: string } | null };

export function AnnouncementList({ items, viewer, redirectTo }: { items: Item[]; viewer: User; redirectTo: string }) {
  if (items.length === 0) return <Empty>Aucune annonce pour le moment.</Empty>;
  return (
    <ul className="space-y-3">
      {items.map((a) => (
        <li key={a.id}>
          <Card className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{a.title}</h3>
                  {a.classGroup && <Badge>{a.classGroup.name}</Badge>}
                  {a.isPublic && <Badge className="bg-accent/10 text-accent">Publique</Badge>}
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  {a.author.firstName} {a.author.lastName} · {formatDate(a.createdAt)}
                </p>
              </div>
              {(viewer.role === "ADMIN" || a.authorId === viewer.id) && (
                <form action={deleteAnnouncement}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="redirectTo" value={redirectTo} />
                  <Button variant="danger" className="px-2 py-1 text-xs">
                    Supprimer
                  </Button>
                </form>
              )}
            </div>
            <p className="mt-3 whitespace-pre-line text-sm text-stone-700">{a.body}</p>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export function AnnouncementForm({ classGroupId, redirectTo, allowPublic }: { classGroupId?: string; redirectTo: string; allowPublic?: boolean }) {
  return (
    <Card>
      <h2 className="mb-3 font-semibold">Nouvelle annonce</h2>
      <form action={postAnnouncement} className="space-y-3">
        {classGroupId && <input type="hidden" name="classGroupId" value={classGroupId} />}
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <Field label="Titre">
          <Input name="title" required maxLength={200} />
        </Field>
        <Field label="Message">
          <Textarea name="body" required />
        </Field>
        {allowPublic && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isPublic" className="accent-brand" />
            Afficher aussi sur le site public
          </label>
        )}
        <Button type="submit">Publier</Button>
      </form>
    </Card>
  );
}
