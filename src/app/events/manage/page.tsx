import Link from "next/link";
import { requirePermission } from "@/lib/auth/require-permission";

const eventRows = [
  { title: "Town Hall 2026", status: "Scheduled", owner: "HR" },
  { title: "Leadership Review", status: "Approved", owner: "CEO" },
  { title: "Employee Wellness Day", status: "Pending", owner: "HR" },
];

export default async function ManageEventsPage() {
  await requirePermission("events:manage");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-blue-200 bg-white p-6 shadow-lg shadow-blue-100 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">HR Access</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">จัดการกิจกรรมและการประชุม</h1>
        </div>

        <div className="flex gap-3">
          <Link href="/events" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-100">
            ดู Event ทั้งหมด
          </Link>
          <Link href="/index" className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-lg shadow-blue-100">
        <table className="min-w-full divide-y divide-blue-100 text-left">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-slate-900">กิจกรรม</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-900">สถานะ</th>
              <th className="px-6 py-4 text-sm font-bold text-slate-900">ผู้รับผิดชอบ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-100">
            {eventRows.map((event) => (
              <tr key={event.title} className="bg-white hover:bg-blue-50/60">
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{event.title}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${event.status === "Approved" ? "bg-emerald-100 text-emerald-700" : event.status === "Scheduled" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                    {event.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{event.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
