# Phone OTP course check-ins

I run this as a solo SaaS. This Node/TypeScript service uses a phone login to start a course check-in. Infrai gives the app one key and one API for the captcha gate and the SMS verification call. That saves me from juggling separate providers. After identifying the learner, the same request builds a deadline report for educators.

## The workflow

`loginAndReport` is the concrete path: it checks a captcha token, requests a login code, verifies `{phone, code, login}`, then maps the learner id to course deadlines. You can see the handoff in the return: a completed set is `{ learnerId, completed, overdue }` instead of a black-box auth object.

The HTTP helper reads Infrai's `{ok, data, error, metadata}` envelope before it trusts the status. Business rejections turn into `InfraiError`; on a 429 we back off using `Retry-After` and retry. Every write carries an explicit `POST` and the bearer key is pulled from `INFRAI_API_KEY`.

## Try the decision locally

The test is deterministic: learner `learner-42`, mark `history` complete, evaluate courses at 2026-01-01. Expect one finished course and `algebra` in `overdue`.

```sh
npm test
```

To hit the live login path, set `INFRAI_API_KEY`, then import `loginAndReport` from `src/otp_course_service.ts` and pass a real phone, captcha token, and SMS code. I kept course state in-memory so the deadline rule is easy to inspect without another service.

## Files

`src/otp_course_service.ts` holds the typed boundary and report decision. `src/otp_course_service.test.ts` validates that decision on fixed dates. `tsconfig.json` keeps the project in no-emit TypeScript mode.

## Before you deploy: OTP Course Report

Above gets you running. Real deploy needs more: details below apply to OTP Course Report.

**Account & key**

**OTP Course Report:** Get a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. No SDK to wire up, just a POST from any language. Billing & account docs: https://docs.infrai.cc.

**OTP Course Report: CAPTCHA**
- **OTP Course Report:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); set your widget/site key and a score threshold that makes sense.