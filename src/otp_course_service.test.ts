import { educatorReport, type Course } from "./otp_course_service";

const courses: Course[] = [
  { id: "algebra", title: "Algebra", deadline: "2025-01-01T00:00:00Z" },
  { id: "history", title: "History", deadline: "2099-01-01T00:00:00Z" },
];
const report = educatorReport("learner-42", courses, new Set(["history"]), new Date("2026-01-01T00:00:00Z"));
if (report.learnerId !== "learner-42" || report.completed !== 1 || report.overdue.join(",") !== "algebra") {
  throw new Error(`unexpected report: ${JSON.stringify(report)}`);
}
console.log("report decision passed");
