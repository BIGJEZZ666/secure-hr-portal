import Link from "next/link";
import { requirePermission } from "@/lib/auth/require-permission";
import LogoutButton from "./logout-button";

export default async function DashboardPage() {
  await requirePermission("dashboard:view");

  const overviewCards = [
    { label: "พนักงานทั้งหมด", value: "245", tone: "bg-blue-100 text-blue-800" },
    { label: "กิจกรรมเดือนนี้", value: "12", tone: "bg-cyan-100 text-cyan-800" },
    { label: "บัญชีที่ใช้งานอยู่", value: "98%", tone: "bg-emerald-100 text-emerald-800" },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-blue-200 bg-white p-6 shadow-lg shadow-blue-100 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">CEO Dashboard</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">ภาพรวมธุรกิจและทรัพยากรบุคคล</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/events" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-100">
            ดู Event
          </Link>
          <LogoutButton />
        </div>
      </div>

      <section className="grid gap-5 md:grid-cols-3">
        {overviewCards.map((card) => (
          <div key={card.label} className="rounded-3xl border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100">
            <p className="text-sm text-slate-500">{card.label}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-3xl font-black text-slate-900">{card.value}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${card.tone}`}>Live</span>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-blue-200 bg-white p-6 shadow-lg shadow-blue-100">
          <h2 className="text-xl font-bold text-slate-900">ข้อมูลสำคัญ</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
            <li>• โครงการ HR Security review และการตรวจสอบสิทธิ์ตลอดเดือน</li>
            <li>• บทบาท CEO สามารถเข้าถึงข้อมูลสรุปทั้งหมดได้</li>
            <li>• บัญชีที่ไม่มีการเคลื่อนไหวเกิน 30 วัน จะถูกยกเลิกการใช้งานและ session</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-blue-200 bg-white p-6 shadow-lg shadow-blue-100">
          <h2 className="text-xl font-bold text-slate-900">การป้องกันที่เปิดใช้งาน</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
            <li>• XSS protection via response headers and input validation</li>
            <li>• CSRF validation for authenticated state changes</li>
            <li>• Session validation and inactivity timeout control</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
