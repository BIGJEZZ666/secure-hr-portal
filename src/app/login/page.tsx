"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const demoAccounts = [
  { role: "CEO", email: "ceo@securehr.local", password: "Password123!", otp: "123456" },
  { role: "HR", email: "hr@securehr.local", password: "Password123!", otp: "123456" },
  { role: "EMPLOYEE", email: "employee@securehr.local", password: "Password123!", otp: "123456" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("ceo@securehr.local");
  const [password, setPassword] = useState("Password123!");
  const [otp, setOtp] = useState("123456");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadCsrfToken() {
      try {
        const response = await fetch("/api/auth/csrf", {
          credentials: "same-origin",
        });

        if (response.ok) {
          const payload: { csrfToken?: string } = await response.json();
          if (payload.csrfToken) {
            setCsrfToken(payload.csrfToken);
          }
        }
      } catch {
        // Ignore network or CSRF bootstrap failures; the same-origin guard still protects us.
      }
    }

    loadCsrfToken();
  }, []);

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
          "X-CSRF-Token": csrfToken,
        },
        credentials: "same-origin",
        body: JSON.stringify({ email, password, otp }),
      });

      const result: { message?: string } = await response.json();

      if (!response.ok) {
        setMessage(result.message ?? "ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่");
        return;
      }

      setPassword("");
      setOtp("");

      const nextRoute =
        (result as { user?: { role?: string } }).user?.role === "HR"
          ? "/events/manage"
          : (result as { user?: { role?: string } }).user?.role === "EMPLOYEE"
            ? "/events"
            : "/dashboard";

      router.replace(nextRoute);
      router.refresh();
    } catch {
      setMessage("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-blue-100">
        <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-8 text-white md:p-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium backdrop-blur-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              Secure HR Portal
            </div>

            <h1 className="text-3xl font-black tracking-tight md:text-4xl">
              ระบบบริหารทรัพยากรบุคคลที่ปลอดภัย
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-blue-50 md:text-base">
              วางระบบควบคุมการเข้าถึงตามบทบาท (CEO / HR / Employee) พร้อมความปลอดภัยของ session, CSRF, XSS และ access-control ตามหลักการ least privilege
            </p>

            <div className="mt-8 grid gap-3">
              {demoAccounts.map((account) => (
                <div key={account.role} className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-blue-100">{account.role}</p>
                      <p className="mt-1 text-sm font-semibold">{account.email}</p>
                    </div>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-medium text-blue-50">
                      OTP: {account.otp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 md:p-10">
            <div className="mb-8 text-center md:text-left">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-700 text-xl font-black text-white shadow-lg shadow-blue-200 md:mx-0">
                HR
              </div>
              <h2 className="text-2xl font-bold text-slate-900">เข้าสู่ระบบ</h2>
              <p className="mt-2 text-sm text-slate-500">กรุณาใช้บัญชีผู้ใช้งานที่ได้รับอนุญาต</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">อีเมลบริษัท</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder="กรอกอีเมลบริษัท"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">รหัสผ่าน</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  maxLength={128}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder="กรอกรหัสผ่าน"
                />
              </div>

              <div>
                <label htmlFor="otp" className="mb-2 block text-sm font-medium text-slate-700">รหัส OTP (6 หลัก)</label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {message && (
                <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !csrfToken}
                className="w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-center text-sm text-blue-900">
              <p className="font-medium">สำหรับบุคลากรที่ได้รับอนุญาตเท่านั้น</p>
              <p className="mt-1 text-xs text-blue-700">หากมีปัญหา กรุณาติดต่อผู้ดูแลระบบและยืนยัน OTP อีกครั้ง</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
