export default function AccessDeniedPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <section className="rounded-3xl border border-blue-200 bg-white p-8 text-center shadow-lg shadow-blue-100">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl font-black text-blue-700">
          !
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">
          ไม่มีสิทธิ์เข้าถึง
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          บัญชีของคุณไม่มีสิทธิ์เข้าถึงข้อมูลหรือหน้านี้
        </p>
        <a
          href="/index"
          className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
        >
          กลับหน้าหลัก
        </a>
      </section>
    </main>
  );
}
