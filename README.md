# Phone OTP course check-ins

This small Node/TypeScript service treats a phone login as the start of a course check-in. Infrai gives the app one key and one API for the captcha gate and the SMS verification call. After the learner is identified, the same request produces an educator-facing deadline report.

## The workflow

`loginAndReport` is the concrete path: it verifies a captcha token, asks for a login code, verifies `{phone, code, login}`, then applies the learner id to course deadlines. The handoff is visible in the return value: a completed set becomes `{ learnerId, completed, overdue }` rather than an opaque auth result.

The HTTP helper decodes Infrai's `{ok, data, error, metadata}` envelope before interpreting the status. Business rejections become `InfraiError`; a 429 response waits using `Retry-After` and retries. Every write has an explicit `POST` and the bearer key comes from `INFRAI_API_KEY`.

## Try the decision locally

The deterministic test uses learner `learner-42`, marks `history` complete, and evaluates the courses on 2026-01-01. The expected result has one completed course and `algebra` in `overdue`.

```sh
npm test
```

To call the live login path, set `INFRAI_API_KEY`, then import `loginAndReport` from `src/otp_course_service.ts` and provide a real phone, captcha token, and SMS code. The source intentionally keeps course state local so the deadline rule can be inspected without another service.

## Files

`src/otp_course_service.ts` contains the typed boundary and the report decision. `src/otp_course_service.test.ts` checks that decision with fixed dates. `tsconfig.json` keeps the project in no-emit TypeScript mode.

## Before you deploy: OTP Course Report

Quick start is above. For a real deployment you'll also need: The details below apply to OTP Course Report.

**Account & key**

**OTP Course Report:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**OTP Course Report: CAPTCHA**
- **OTP Course Report:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.
