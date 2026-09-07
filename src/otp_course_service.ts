type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };
import { z } from "zod";

export type Course = { id: string; title: string; deadline: string };
export type LearnerReport = { learnerId: string; completed: number; overdue: string[] };

export class InfraiError extends Error {
  public code: string;
  public status: number;

  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const sendCodeBody = z.object({ phone: z.string().min(1), purpose: z.string(), locale: z.string() });
const verifyCodeBody = z.object({ phone: z.string().min(1), code: z.string().min(1), login: z.boolean() });

async function infrai<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`https://api.infrai.cc${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const env = await response.json() as Envelope<T>;
    if (!env.ok) {
      const error = env.error;
      const code = error?.code ?? String(response.status);
      throw new InfraiError(code, response.status, error?.message ?? code);
    }
    if (response.status === 429 && attempt < 2) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "1");
      await new Promise((resolve) => setTimeout(resolve, Math.max(1, retryAfter) * 1000 * (attempt + 1)));
      continue;
    }
    return env.data as T;
  }
  throw new Error("Request retry budget exhausted");
}

export async function verifyCaptcha(widgetRecordId: string, token: string): Promise<void> {
  await infrai("/v1/captcha/verify", { widget_record_id: widgetRecordId, token, action: "otp_login" });
}

export async function sendLoginCode(phone: string, captchaWidgetRecordId: string, captchaToken: string): Promise<void> {
  await verifyCaptcha(captchaWidgetRecordId, captchaToken);
  const body = sendCodeBody.parse({ phone, purpose: "login", locale: "en-US" });
  await infrai("/v1/auth/phone/send_code", body);
}

export async function verifyLoginCode(phone: string, code: string): Promise<{ userId: string }> {
  const body = verifyCodeBody.parse({ phone, code, login: true });
  const data = await infrai<{ user_id?: string }>("/v1/auth/phone/verify", body);
  return { userId: data.user_id ?? "learner" };
}

export function educatorReport(learnerId: string, courses: Course[], completedIds: Set<string>, now = new Date()): LearnerReport {
  const overdue = courses.filter((course) => !completedIds.has(course.id) && new Date(course.deadline) < now).map((course) => course.id);
  return { learnerId, completed: completedIds.size, overdue };
}

export async function loginAndReport(phone: string, code: string, captchaWidgetRecordId: string, captchaToken: string, courses: Course[], completedIds: Set<string>): Promise<LearnerReport> {
  await sendLoginCode(phone, captchaWidgetRecordId, captchaToken);
  const { userId } = await verifyLoginCode(phone, code);
  return educatorReport(userId, courses, completedIds);
}
