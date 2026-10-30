import { requirePermission } from "@/lib/auth/require-permission";
import TotpSetup from "./totp-setup";

export default async function SecuritySettingsPage() {
  const user = await requirePermission("index:view");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 rounded-3xl border border-blue-200 bg-white p-6 shadow-lg shadow-blue-100">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
          Account security
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">
          ตั้งค่าความปลอดภัย
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          บัญชี {user.email}
        </p>
      </header>

      <TotpSetup enabled={user.twoFactorEnabled} />
    </main>
  );
}
