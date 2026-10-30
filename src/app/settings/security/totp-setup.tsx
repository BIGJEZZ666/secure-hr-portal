"use client";

import { useState } from "react";

interface EnrollmentDetails {
  secret: string;
  otpauthUrl: string;
}

export default function TotpSetup({ enabled }: { enabled: boolean }) {
  const [details, setDetails] = useState<EnrollmentDetails | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(action: "start" | "verify", verificationCode?: string) {
    setLoading(true);
    setMessage("");

    try {
      const csrfResponse = await fetch("/api/auth/csrf", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!csrfResponse.ok) {
        throw new Error("ไม่สามารถยืนยันคำขอได้ กรุณาลองใหม่");
      }

      const csrf = (await csrfResponse.json()) as { csrfToken?: string };
      if (!csrf.csrfToken) {
        throw new Error("ไม่พบ CSRF token กรุณารีเฟรชหน้า");
      }

      const response = await fetch("/api/auth/2fa", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf.csrfToken,
        },
        body: JSON.stringify({ action, code: verificationCode }),
      });
      const result = (await response.json()) as EnrollmentDetails & { message?: string };

      if (!response.ok) {
        throw new Error(result.message ?? "ดำเนินการไม่สำเร็จ");
      }

      if (action === "start") {
        setDetails(result);
      } else {
        setDetails(null);
        setCode("");
      }

      setMessage(result.message ?? "สแกนหรือเพิ่ม secret ในแอป authenticator แล้วกรอกรหัส");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-blue-200 bg-white p-6 shadow-lg shadow-blue-100">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Two-factor authentication</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            ใช้แอป authenticator ที่รองรับ TOTP รหัสจะเปลี่ยนทุก 30 วินาที
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${enabled ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
          {enabled ? "เปิดใช้งาน" : "ยังไม่เปิด"}
        </span>
      </div>

      {!enabled && !details && (
        <button
          type="button"
          disabled={loading}
          onClick={() => send("start")}
          className="mt-6 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {loading ? "กำลังเตรียม..." : "เริ่มตั้งค่า 2FA"}
        </button>
      )}

      {details && (
        <div className="mt-6 space-y-4 rounded-2xl bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-900">
            เพิ่ม secret นี้ในแอป authenticator
          </p>
          <code className="block break-all rounded-lg bg-white p-3 text-sm text-slate-800">
            {details.secret}
          </code>
          <p className="break-all text-xs text-blue-800">{details.otpauthUrl}</p>
          <label className="block text-sm font-medium text-slate-700" htmlFor="totp-code">
            รหัสยืนยัน 6 หลัก
          </label>
          <input
            id="totp-code"
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-4 focus:ring-blue-100"
          />
          <button
            type="button"
            disabled={loading || code.length !== 6}
            onClick={() => send("verify", code)}
            className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            ยืนยันและเปิดใช้ 2FA
          </button>
        </div>
      )}

      {message && (
        <p role="status" className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          {message}
        </p>
      )}
    </section>
  );
}
