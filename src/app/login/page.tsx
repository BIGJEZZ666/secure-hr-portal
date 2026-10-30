"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const demoAccounts = [
  { role: "CEO", email: "ceo@securehr.local" },
  { role: "HR", email: "hr@securehr.local" },
  { role: "EMPLOYEE", email: "employee@securehr.local" },
];

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("Password123!");
  const [otp, setOtp] = useState("");
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
        // Ignore network or CSRF bootstrap failures.
      }
    }

    loadCsrfToken();
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
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

      const result: { message?: string; user?: { role?: string } } = await response.json();

      if (!response.ok) {
        setMessage(result.message ?? "ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่");
        return;
      }

      setPassword("");
      setOtp("");

      const nextRoute =
        result.user?.role === "HR"
          ? "/events/manage"
          : result.user?.role === "EMPLOYEE"
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

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "same-origin",
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const result: { message?: string } = await response.json();

      if (!response.ok) {
        setMessage(result.message ?? "ไม่สามารถสมัครสมาชิกได้");
        return;
      }

      setMode("login");
      setName("");
      setPassword("");
      setConfirmPassword("");
      setMessage(result.message ?? "สมัครสมาชิกสำเร็จ");
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
                      บัญชีทดสอบ
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 md:p-10">
            <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === "login" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}
              >
                เข้าสู่ระบบ
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === "register" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}
              >
                สมัครสมาชิก
              </button>
            </div>

            <div className="mb-8 text-center md:text-left">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-700 text-xl font-black text-white shadow-lg shadow-blue-200 md:mx-0">
                HR
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิกใหม่"}</h2>
              <p className="mt-2 text-sm text-slate-500">{mode === "login" ? "กรุณาใช้บัญชีผู้ใช้งานที่ได้รับอนุญาต" : "ผู้ที่สมัครใหม่จะถูกสร้างเป็น Employee เสมอ"}</p>
            </div>

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-5">
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
                  <label htmlFor="otp" className="mb-2 block text-sm font-medium text-slate-700">รหัส OTP (กรอกเมื่อเปิดใช้ 2FA)</label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="รหัสจากแอป authenticator"
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
            ) : (
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">ชื่อ-นามสกุล</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    placeholder="กรอกชื่อ-นามสกุล"
                  />
                </div>

                <div>
                  <label htmlFor="register-email" className="mb-2 block text-sm font-medium text-slate-700">อีเมล</label>
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="register-password" className="mb-2 block text-sm font-medium text-slate-700">รหัสผ่าน</label>
                  <input
                    id="register-password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-slate-700">ยืนยันรหัสผ่าน</label>
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                  />
                </div>

                {message && (
                  <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm leading-6 text-blue-800">
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !csrfToken}
                  className="w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
                </button>
              </form>
            )}

            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-center text-sm text-blue-900">
              <p className="font-medium">สำหรับบุคลากรที่ได้รับอนุญาตเท่านั้น</p>
              <p className="mt-1 text-xs text-blue-700">หากมีปัญหา กรุณาติดต่อผู้ดูแลระบบ</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
