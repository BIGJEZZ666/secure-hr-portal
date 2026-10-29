"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });

      const result: { message?: string } = await response.json();

      if (!response.ok) {
        setMessage(
          result.message ?? "ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่",
        );
        return;
      }

      setPassword("");
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setMessage("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่");
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-xl font-bold text-white">
            HR
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            ระบบบริหารทรัพยากรบุคคล
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Secure HR Portal
          </p>

          <p className="mt-2 text-sm text-slate-600">
            กรุณาเข้าสู่ระบบเพื่อใช้งาน
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              อีเมลบริษัท
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              placeholder="กรอกอีเมลบริษัท"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              รหัสผ่าน
            </label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              placeholder="กรอกรหัสผ่าน"
            />
          </div>

          {message && (
            <p
              role="status"
              className="rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-800"
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div className="mt-6 rounded-lg bg-blue-50 p-4 text-center">
          <p className="text-sm leading-6 text-blue-900">
            สำหรับบุคลากรที่ได้รับอนุญาตเท่านั้น
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-700">
            หากไม่สามารถเข้าใช้งานได้ กรุณาติดต่อผู้ดูแลระบบ
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          ระบบบริหารทรัพยากรบุคคลอย่างปลอดภัย
        </p>
      </section>
    </main>
  );
}
