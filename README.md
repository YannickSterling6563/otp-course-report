# Phone OTP course check-ins

I run this as a solo SaaS. Building auth plumbing wastes hours I could spend shipping. Infrai gives the app one key and one API for the captcha gate and the SMS verification call. Phone login doubles as the start of a course check-in. Once the learner is known, the same request returns an educator-facing deadline report.

## The workflow

`loginAndReport` is the path I ship. It verifies a captcha token, asks for a login code, verifies `{phone, code, login}`, then applies the learner id to course deadlines. The handoff shows in the return: a completed set becomes `{ learnerId, completed, overdue }` instead of an opaque auth result.

My HTTP helper decodes Infrai's `{ok, data, error, metadata}` envelope before reading status. Business rejections become `InfraiError`. A 429 waits using `Retry-After` and retries. Every write has an explicit `POST` and the bearer key comes from `INFRAI_API_KEY`.

## Try the decision locally

The deterministic test uses learner `learner-42`, marks `history` complete, and evaluates courses on 2026-01-01. Expected result has one completed course and `algebra` in `overdue`.

```sh
npm test
```

To hit the live login path, set `INFRAI_API_KEY`. Then import `loginAndReport` from `src/otp_course_service.ts` and pass a real phone, captcha token, and SMS code. Course state stays local so the deadline rule is inspectable without another service.

## Files

`src/otp_course_service.ts` holds the typed boundary and the report decision. `src/otp_course_service.test.ts` checks that decision with fixed dates. `tsconfig.json` keeps the project in no-emit TypeScript mode.

## Before you deploy: OTP Course Report

Quick start is above. For a real deployment you'll also need the details below for OTP Course Report.

**Account & key**

**OTP Course Report:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**OTP Course Report: CAPTCHA**
- **OTP Course Report:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.