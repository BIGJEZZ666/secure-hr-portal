import { requirePermission } from "@/lib/auth/require-permission";

export default async function ManageEventsPage() {
  await requirePermission("events:manage");

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">
        Event Management
      </h1>
      <p className="mt-3">
        Manage company events
      </p>
    </main>
  );
}
