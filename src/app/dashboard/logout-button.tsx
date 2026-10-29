"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setLoading(true);
    setError("");

    try {
      const csrfResponse = await fetch("/api/auth/csrf", {
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!csrfResponse.ok) {
        throw new Error("ไม่สามารถยืนยันคำขอได้ กรุณาลองใหม่");
      }

      const csrfData: { csrfToken?: string } = await csrfResponse.json();

      if (!csrfData.csrfToken) {
        throw new Error("ไม่พบ token ความปลอดภัย กรุณาลองใหม่");
      }

      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfData.csrfToken,
        },
      });

      if (!response.ok) {
        const result: { message?: string } = await response.json();
        throw new Error(result.message ?? "ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง");
      }

      router.replace("/login");
      router.refresh();
    } catch (logoutError) {
      setError(
        logoutError instanceof Error
          ? logoutError.message
          : "ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง",
      );
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "กำลังออกจากระบบ..." : "Logout"}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
