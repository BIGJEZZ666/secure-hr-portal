"use client";

import { useRouter } from "next/navigation";

interface AccessDeniedDialogProps {
  isOpen: boolean;
}

export default function AccessDeniedDialog({
  isOpen,
}: AccessDeniedDialogProps) {
  const router = useRouter();

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      onClick={() => router.replace("/index")}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="access-denied-title"
        className="w-full max-w-md rounded-3xl border border-blue-200 bg-white p-7 text-center shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl font-black text-blue-700">
          !
        </div>
        <h1
          id="access-denied-title"
          className="mt-5 text-2xl font-bold text-slate-900"
        >
          ไม่มีสิทธิ์เข้าถึง
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          บัญชีของคุณไม่มีสิทธิ์เข้าถึงข้อมูลหรือหน้านี้
        </p>
        <button
          type="button"
          autoFocus
          onClick={() => router.replace("/index")}
          className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800"
        >
          รับทราบ
        </button>
      </section>
    </div>
  );
}
