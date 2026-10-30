"use client";

import { useState, type FormEvent } from "react";
import {
  EVENT_AUDIENCES,
  type EventAudience,
  type EventInput,
  type PortalEvent,
} from "@/lib/events/types";

interface EventManagerProps {
  initialEvents: PortalEvent[];
}

interface EventFormValues {
  title: string;
  description: string;
  location: string;
  audience: EventAudience;
  startsAt: string;
  endsAt: string;
}

const EMPTY_FORM: EventFormValues = {
  title: "",
  description: "",
  location: "",
  audience: "ALL_STAFF",
  startsAt: "",
  endsAt: "",
};

const audienceLabels: Record<EventAudience, string> = {
  ALL_STAFF: "พนักงานทุกคน",
  LEADERS: "CEO และ HR",
  EMPLOYEES: "พนักงาน",
};

function toLocalDateTimeInput(value: string): string {
  const date = new Date(value);
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return localDate.toISOString().slice(0, 16);
}

function formatEventDate(value: string): string {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

export default function EventManager({
  initialEvents,
}: EventManagerProps) {
  const [events, setEvents] = useState(initialEvents);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  function setStatus(text: string, error = false) {
    setMessage(text);
    setIsError(error);
  }

  async function getCsrfToken(): Promise<string> {
    const response = await fetch("/api/auth/csrf", {
      credentials: "same-origin",
      cache: "no-store",
    });
    const payload: { csrfToken?: string } = await response.json();

    if (!response.ok || !payload.csrfToken) {
      throw new Error("ไม่สามารถยืนยันคำขอได้ กรุณารีเฟรชหน้า");
    }

    return payload.csrfToken;
  }

  async function refreshEvents(): Promise<void> {
    const response = await fetch("/api/events", {
      credentials: "same-origin",
      cache: "no-store",
    });
    const payload: { events?: PortalEvent[]; message?: string } =
      await response.json();

    if (!response.ok || !payload.events) {
      throw new Error(payload.message ?? "ไม่สามารถโหลดรายการกิจกรรมได้");
    }

    setEvents(payload.events);
  }

  function editEvent(event: PortalEvent) {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description,
      location: event.location,
      audience: event.audience,
      startsAt: toLocalDateTimeInput(event.startsAt),
      endsAt: toLocalDateTimeInput(event.endsAt),
    });
    setStatus("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function submitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setStatus("");

    try {
      const input: EventInput = {
        title: form.title,
        description: form.description,
        location: form.location,
        audience: form.audience,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
      };
      const csrfToken = await getCsrfToken();
      const response = await fetch("/api/events", {
        method: editingId ? "PUT" : "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(editingId ? { ...input, id: editingId } : input),
      });
      const payload: { message?: string } = await response.json();

      if (!response.ok) {
        throw new Error(payload.message ?? "ไม่สามารถบันทึกกิจกรรมได้");
      }

      clearForm();
      setStatus(payload.message ?? "บันทึกกิจกรรมสำเร็จ");

      try {
        await refreshEvents();
      } catch {
        setStatus("บันทึกสำเร็จ แต่โหลดรายการล่าสุดไม่สำเร็จ กรุณารีเฟรชหน้า", true);
      }
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "ไม่สามารถบันทึกกิจกรรมได้",
        true,
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteEvent(id: string) {
    if (pendingDeleteId) return;
    if (!window.confirm("ยืนยันลบกิจกรรมนี้หรือไม่?")) return;

    setPendingDeleteId(id);
    setStatus("");

    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch("/api/events", {
        method: "DELETE",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ id }),
      });
      const payload: { message?: string } = await response.json();

      if (!response.ok) {
        throw new Error(payload.message ?? "ไม่สามารถลบกิจกรรมได้");
      }

      setStatus(payload.message ?? "ลบกิจกรรมสำเร็จ");

      try {
        await refreshEvents();
      } catch {
        setStatus("ลบสำเร็จ แต่โหลดรายการล่าสุดไม่สำเร็จ กรุณารีเฟรชหน้า", true);
      }
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "ไม่สามารถลบกิจกรรมได้",
        true,
      );
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-blue-200 bg-white p-6 shadow-lg shadow-blue-100">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">
            {editingId ? "แก้ไขกิจกรรม" : "เพิ่มกิจกรรม"}
          </h2>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            CEO และ HR
          </span>
        </div>

        {message && (
          <p
            role="status"
            className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
              isError
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-blue-200 bg-blue-50 text-blue-800"
            }`}
          >
            {message}
          </p>
        )}

        <form onSubmit={submitEvent} className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
            ชื่อกิจกรรม
            <input
              required
              maxLength={120}
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal focus:border-blue-600 focus:outline-none"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
            สถานที่
            <input
              required
              maxLength={200}
              value={form.location}
              onChange={(event) =>
                setForm({ ...form, location: event.target.value })
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal focus:border-blue-600 focus:outline-none"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
            กลุ่มผู้เข้าร่วม
            <select
              value={form.audience}
              onChange={(event) =>
                setForm({
                  ...form,
                  audience: event.target.value as EventAudience,
                })
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal focus:border-blue-600 focus:outline-none"
            >
              {EVENT_AUDIENCES.map((audience) => (
                <option key={audience} value={audience}>
                  {audienceLabels[audience]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
            เวลาเริ่ม
            <input
              type="datetime-local"
              required
              value={form.startsAt}
              onChange={(event) =>
                setForm({ ...form, startsAt: event.target.value })
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal focus:border-blue-600 focus:outline-none"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
            เวลาสิ้นสุด
            <input
              type="datetime-local"
              required
              value={form.endsAt}
              onChange={(event) =>
                setForm({ ...form, endsAt: event.target.value })
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal focus:border-blue-600 focus:outline-none"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-semibold text-slate-800 md:col-span-2">
            รายละเอียด
            <textarea
              rows={3}
              maxLength={2000}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              className="resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal focus:border-blue-600 focus:outline-none"
            />
          </label>

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "กำลังบันทึก..."
                : editingId
                  ? "บันทึกการแก้ไข"
                  : "เพิ่มกิจกรรม"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={clearForm}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                ยกเลิกการแก้ไข
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">รายการกิจกรรม</h2>
          <span className="text-sm text-slate-500">{events.length} รายการ</span>
        </div>

        {events.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-blue-200 bg-white px-6 py-12 text-center text-sm text-slate-600">
            ยังไม่มีรายการกิจกรรม เพิ่มกิจกรรมผ่านแบบฟอร์มด้านบน
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((event) => (
              <article
                key={event.id}
                className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatEventDate(event.startsAt)} – {formatEventDate(event.endsAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                    {audienceLabels[event.audience]}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-600">{event.location}</p>
                {event.description && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                    {event.description}
                  </p>
                )}
                <p className="mt-3 text-xs text-slate-500">
                  ผู้เพิ่ม: {event.createdByName} ({event.createdByRole})
                </p>

                <div className="mt-4 flex gap-2 border-t border-blue-50 pt-4">
                  <button
                    type="button"
                    onClick={() => editEvent(event)}
                    className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-50"
                  >
                    แก้ไข
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteEvent(event.id)}
                    disabled={pendingDeleteId !== null}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pendingDeleteId === event.id ? "กำลังลบ..." : "ลบ"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
