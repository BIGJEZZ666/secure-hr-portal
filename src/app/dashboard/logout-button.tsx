"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    async function loadCsrfToken() {
      try {
        const response = await fetch("/api/auth/csrf", {
          credentials: "same-origin",
        });

        if (response.ok) {
          const data: { csrfToken?: string } = await response.json();
          if (data.csrfToken) {
            setCsrfToken(data.csrfToken);
          }
        }
      } catch {
        // Ignore CSRF bootstrap failures on logout and let server reject if needed.
      }
    }

    loadCsrfToken();
  }, []);

  async function handleLogout() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setError("ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading || !csrfToken}
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
