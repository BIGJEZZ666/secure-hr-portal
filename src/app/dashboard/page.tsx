import { requirePermission } from "@/lib/auth/require-permission";

export default async function DashboardPage() {
  await requirePermission("dashboard:view");

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">
        Dashboard
      </h1>
      <p className="mt-3">
        CEO Dashboard
      </p>
    </main>
  );
}
