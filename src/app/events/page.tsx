import { requirePermission } from "@/lib/auth/require-permission";

export default async function EventsPage() {
  await requirePermission("events:view");
  return (
    <main>
      <h1>Events</h1>
      <p>View company events</p>
    </main>
  );
}
