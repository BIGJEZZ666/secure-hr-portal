import Link from "next/link";
import { eventRepository } from "@/lib/events/event-repository";
import type { EventAudience } from "@/lib/events/types";
import { filterEventsForRole } from "@/lib/events/visibility";
import { requirePermission } from "@/lib/auth/require-permission";

const audienceLabels: Record<EventAudience, string> = {
  ALL_STAFF: "พนักงานทุกคน",
  LEADERS: "CEO และ HR",
  EMPLOYEES: "พนักงาน",
};

function formatEventDate(value: string): string {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

export default async function EventsPage() {
  const user = await requirePermission("events:view");
  const visibleEvents = filterEventsForRole(
    await eventRepository.list(),
    user.role,
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 rounded-3xl border border-blue-200 bg-white p-6 shadow-lg shadow-blue-100 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Events</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">กิจกรรมและการประชุม</h1>
        </div>

        <div className="flex flex-wrap gap-3">
          {(user.role === "CEO" || user.role === "HR") && (
            <Link
              href="/events/manage"
              className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              ไปหน้าจัดการกิจกรรม
            </Link>
          )}
          <Link
            href={user.role === "CEO" ? "/dashboard" : "/index"}
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-100"
          >
            {user.role === "CEO" ? "กลับสู่ Dashboard" : "กลับหน้าหลัก"}
          </Link>
        </div>
      </div>

      {visibleEvents.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-blue-200 bg-white px-6 py-14 text-center shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">ยังไม่มีกิจกรรม</h2>
          <p className="mt-2 text-sm text-slate-600">เมื่อมีการเพิ่มกิจกรรม รายการจะแสดงที่นี่</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visibleEvents.map((event) => (
            <article key={event.id} className="rounded-3xl border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-900">{event.title}</h2>
                <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                  {audienceLabels[event.audience]}
                </span>
              </div>
              {event.description && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{event.description}</p>
              )}
              <dl className="mt-5 space-y-3 border-t border-blue-100 pt-4 text-sm">
                <div>
                  <dt className="font-semibold text-slate-800">เริ่ม</dt>
                  <dd className="mt-1 text-slate-600">{formatEventDate(event.startsAt)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-800">สิ้นสุด</dt>
                  <dd className="mt-1 text-slate-600">{formatEventDate(event.endsAt)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-800">สถานที่</dt>
                  <dd className="mt-1 text-slate-600">{event.location}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
