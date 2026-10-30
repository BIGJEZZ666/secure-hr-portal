import Link from "next/link";
import { authService } from "@/lib/auth/auth-service";
import { requirePermission } from "@/lib/auth/require-permission";

export default async function IndexPage() {
  const user = await authService.getCurrentUser();

  if (!user) {
    await requirePermission("index:view");
  }

  const roleSummary = {
    CEO: ["คีย์ข้อมูลประสิทธิภาพรวม", "ตรวจสอบข้อมูลพนักงานทั้งหมด", "ดูสรุปกิจกรรมและความเสี่ยง"],
    HR: ["จัดการการคัดกรองและกิจกรรม", "สรุปพนักงานและข้อมูลสำนักงาน", "จัดการสิทธิ์การเข้าถึง"],
    EMPLOYEE: ["ดูตารางกิจกรรมของตัวเอง", "ตรวจสอบข้อมูลส่วนบุคคล", "เข้าถึงข้อมูลที่จำเป็นเท่านั้น"],
  } as const;

  const visibleRole = user?.role ?? "EMPLOYEE";

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-blue-200 bg-white/90 p-6 shadow-lg shadow-blue-100 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-700">Secure HR Portal</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">ระบบจัดการทรัพยากรบุคคล</h1>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">{user.role}</span>
              <Link href={user.role === "CEO" ? "/dashboard" : user.role === "HR" ? "/events/manage" : "/events"} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800">
                ข้ามไปยังหน้าของฉัน
              </Link>
            </>
          ) : (
            <Link href="/login" className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800">
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-8 text-white shadow-xl shadow-blue-200">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-blue-100">Access control overview</p>
          <h2 className="mt-4 text-4xl font-black leading-tight">ยินดีต้อนรับสู่ระบบที่ควบคุมข้อมูลตามบทบาท</h2>
          <p className="mt-4 max-w-xl text-base leading-8 text-blue-50">
            ทุกการเข้าถึงข้อมูลถูกจำกัดตามสิทธิ์ของผู้ใช้ เพื่อป้องกัน IDOR, Overexposure และการยกระดับสิทธิ์ที่ไม่จำเป็น
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/events" className="rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">ดู Event</Link>
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Current role</p>
          <div className="mt-4 flex items-center justify-between border-b border-slate-200 pb-3">
            <span className="text-lg font-bold text-slate-900">{visibleRole}</span>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              {user ? "Authorized" : "ข้อมูลตัวอย่าง"}
            </span>
          </div>

          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            {(roleSummary[visibleRole] ?? roleSummary.EMPLOYEE).map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-blue-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-3">
        {[
          { title: "CEO", description: "ภาพรวมองค์กร ข้อมูลพนักงานแบบครบถ้วน", accent: "from-blue-600 to-cyan-500" },
          { title: "HR", description: "จัดการกิจกรรมและควบคุมสิทธิ์การเข้าถึง", accent: "from-cyan-500 to-sky-500" },
          { title: "EMPLOYEE", description: "เข้าถึงข้อมูลที่จำเป็นเท่านั้นและไม่สามารถดูข้อมูลภายนอกได้", accent: "from-sky-500 to-blue-500" },
        ].map((item) => (
          <div key={item.title} className="rounded-3xl border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100">
            <div className={`mb-4 h-2 w-20 rounded-full bg-gradient-to-r ${item.accent}`} />
            <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
