import Link from "next/link";
import { authService } from "@/lib/auth/auth-service";
import { requirePermission } from "@/lib/auth/require-permission";

const events = [
  { title: "Town Hall 2026", date: "15 พ.ย. 2026", audience: "All staff", owner: "HR" },
  { title: "Leadership Review", date: "20 พ.ย. 2026", audience: "CEO + HR", owner: "CEO" },
  { title: "Employee Wellness Day", date: "24 พ.ย. 2026", audience: "Employees", owner: "HR" },
];

export default async function EventsPage() {
  const user = await authService.getCurrentUser();
  await requirePermission("events:view");

  const visibleEvents = user?.role === "EMPLOYEE"
    ? events.filter((event) => event.audience === "Employees" || event.audience === "All staff")
    : events;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4 rounded-3xl border border-blue-200 bg-white p-6 shadow-lg shadow-blue-100">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Events</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">สถานที่จัดกิจกรรมและการประชุม</h1>
        </div>

        <Link href={user?.role === "CEO" ? "/dashboard" : "/index"} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800">
          {user?.role === "CEO" ? "กลับสู่ Dashboard" : "กลับหน้าหลัก"}
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {visibleEvents.map((event) => (
          <article key={event.title} className="rounded-3xl border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">{event.owner}</p>
            <h2 className="mt-3 text-xl font-bold text-slate-900">{event.title}</h2>
            <p className="mt-3 text-sm text-slate-600">{event.date}</p>
            <p className="mt-2 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">{event.audience}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
