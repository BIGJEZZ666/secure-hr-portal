import Link from "next/link";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";
import LogoutButton from "./dashboard/logout-button";

export default async function AppHeader() {
  const cookieStore = await cookies();
  const hasSessionCookie = Boolean(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  return (
    <header className="border-b border-blue-100 bg-white/90 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/index" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 font-black text-white">
            HR
          </span>
          <span>
            <span className="block font-bold text-slate-900">Secure HR Portal</span>
            <span className="block text-xs text-blue-700">ระบบบริหารทรัพยากรบุคคล</span>
          </span>
        </Link>

        <nav aria-label="เมนูหลัก" className="flex flex-wrap items-center gap-2">
          <Link href="/index" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-800">
            หน้าหลัก
          </Link>
          <Link href="/events" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-800">
            กิจกรรม
          </Link>
          {hasSessionCookie ? (
            <>
              <Link href="/settings/security" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-800">
                ความปลอดภัย
              </Link>
              <LogoutButton />
            </>
          ) : (
            <Link href="/login" className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
              เข้าสู่ระบบ
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
