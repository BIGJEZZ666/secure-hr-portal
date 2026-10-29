import "server-only";

import { z } from "zod";

export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("รูปแบบอีเมลไม่ถูกต้อง")
      .max(254, "อีเมลยาวเกินไป"),

    password: z
      .string()
      .min(1, "กรุณากรอกรหัสผ่าน")
      .max(128, "รหัสผ่านยาวเกินขีดจำกัด"),

    otp: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => value === undefined || value.length === 6,
        "OTP ต้องเป็นตัวเลข 6 หลัก",
      ),
  })
  .strict();

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "กรุณาระบุชื่อจริงของท่าน")
      .max(80, "ชื่อตัวอย่างยาวเกินไป"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("รูปแบบอีเมลไม่ถูกต้อง")
      .max(254, "อีเมลยาวเกินไป"),
    password: z
      .string()
      .min(8, "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร")
      .max(128, "รหัสผ่านยาวเกินขีดจำกัด"),
    confirmPassword: z
      .string()
      .min(1, "กรุณายืนยันรหัสผ่าน"),
  })
  .strict()
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "ยืนยันรหัสผ่านไม่ตรงกับรหัสผ่านที่กรอก",
  });

export const createEventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "กรุณาระบุชื่อกิจกรรม")
      .max(120, "ชื่อกิจกรรมยาวเกินไป"),

    description: z
      .string()
      .trim()
      .max(2000, "รายละเอียดกิจกรรมยาวเกินไป"),

    location: z
      .string()
      .trim()
      .min(1, "กรุณาระบุสถานที่")
      .max(200, "สถานที่ยาวเกินไป"),

    startsAt: z.iso.datetime({
      message: "วันเวลาเริ่มต้นไม่ถูกต้อง",
    }),

    endsAt: z.iso.datetime({
      message: "วันเวลาสิ้นสุดไม่ถูกต้อง",
    }),
  })
  .strict()
  .refine(
    (event) =>
      new Date(event.endsAt).getTime() >
      new Date(event.startsAt).getTime(),
    {
      path: ["endsAt"],
      message: "เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น",
    },
  );

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateEventInput = z.infer<
  typeof createEventSchema
>;
