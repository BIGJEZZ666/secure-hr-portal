"use client";

import { useEffect, useState } from "react";

interface EmployeeRow {
  id: string;
  name: string;
  email: string;
  role: "CEO" | "HR" | "EMPLOYEE";
}

export default function RoleManager() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [csrfToken, setCsrfToken] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadEmployees() {
      try {
        const employeesResponse = await fetch("/api/admin/roles", {
          credentials: "same-origin",
        });

        if (!employeesResponse.ok) {
          throw new Error("Unable to load employees");
        }

        const payload: { employees?: EmployeeRow[] } = await employeesResponse.json();
        setEmployees(payload.employees ?? []);
      } catch {
        setMessage("ไม่สามารถโหลดข้อมูลพนักงานได้");
      } finally {
        setIsLoading(false);
      }
    }

    async function loadCsrfToken() {
      try {
        const response = await fetch("/api/auth/csrf", {
          credentials: "same-origin",
        });

        if (response.ok) {
          const payload: { csrfToken?: string } = await response.json();
          setCsrfToken(payload.csrfToken ?? "");
        }
      } catch {
        // Ignore csrf bootstrap errors; the server will reject if it cannot validate.
      }
    }

    loadEmployees();
    loadCsrfToken();
  }, []);

  async function updateRole(employeeId: string, nextRole: string) {
    if (!csrfToken) {
      setMessage("ไม่พบ token ความปลอดภัย กรุณารีเฟรชหน้า");
      return;
    }

    try {
      const response = await fetch("/api/admin/roles", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "X-CSRF-Token": csrfToken,
        },
        body: (() => {
          const formData = new FormData();
          formData.set("employeeId", employeeId);
          formData.set("role", nextRole);
          return formData;
        })(),
      });

      const result: { message?: string } = await response.json();

      if (!response.ok) {
        throw new Error(result.message ?? "Failed to update role");
      }

      setMessage(result.message ?? "เปลี่ยนบทบาทสำเร็จ");
      const updated = await fetch("/api/admin/roles", { credentials: "same-origin" });
      if (updated.ok) {
        const payload: { employees?: EmployeeRow[] } = await updated.json();
        setEmployees(payload.employees ?? []);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ไม่สามารถเปลี่ยนบทบาทได้");
    }
  }

  return (
    <section className="mt-8 rounded-3xl border border-blue-200 bg-white p-6 shadow-lg shadow-blue-100">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900">จัดการบทบาทพนักงาน</h2>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">CEO only</span>
      </div>

      {message && (
        <p className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">{message}</p>
      )}

      <div className="overflow-hidden rounded-2xl border border-blue-100">
        <table className="min-w-full divide-y divide-blue-100 text-left">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-4 py-3 text-sm font-bold text-slate-900">ชื่อ</th>
              <th className="px-4 py-3 text-sm font-bold text-slate-900">อีเมล</th>
              <th className="px-4 py-3 text-sm font-bold text-slate-900">บทบาทปัจจุบัน</th>
              <th className="px-4 py-3 text-sm font-bold text-slate-900">เปลี่ยนบทบาท</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-100 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">กำลังโหลดข้อมูล...</td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">ไม่มีข้อมูลพนักงาน</td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-4 py-3 text-sm text-slate-900">{employee.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{employee.email}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{employee.role}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <select
                        value={employee.role}
                        onChange={(event) => updateRole(employee.id, event.target.value)}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none"
                      >
                        <option value="EMPLOYEE">EMPLOYEE</option>
                        <option value="HR">HR</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
