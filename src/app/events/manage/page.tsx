import Link from "next/link";
import { requirePermission } from "@/lib/auth/require-permission";
import { eventRepository } from "@/lib/events/event-repository";
import EventManager from "./event-manager";

export default async function ManageEventsPage() {
  const user = await requirePermission("events:manage");
  const events = await eventRepository.list();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-blue-200 bg-white p-6 shadow-lg shadow-blue-100 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
            {user.role} Access
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">จัดการกิจกรรมและการประชุม</h1>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/events"
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-100"
          >
            ดูกิจกรรมทั้งหมด
          </Link>
          <Link
            href={user.role === "CEO" ? "/dashboard" : "/index"}
            className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>

      <EventManager initialEvents={events} />
    </main>
  );
}
