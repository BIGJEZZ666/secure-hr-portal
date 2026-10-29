import { requirePermission } from "@/lib/auth/require-permission";
import LogoutButton from "./logout-button";

export default async function DashboardPage() {
  await requirePermission("dashboard:view");

  return (
    <main className="p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Dashboard
          </h1>
          <p className="mt-3">
            CEO Dashboard
          </p>
        </div>

        <LogoutButton />
      </div>
    </main>
  );
}
