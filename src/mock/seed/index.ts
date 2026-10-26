import * as assessment from "./assessment";
import * as conferences from "./conferences";
import * as courses from "./courses";
import * as curriculum from "./curriculum";
import * as finance from "./finance";
import * as people from "./people";
import { POLICY } from "./policy";

export * from "./assessment";
export * from "./conferences";
export * from "./courses";
export * from "./curriculum";
export * from "./finance";
export * from "./people";
export { POLICY } from "./policy";
export { at, day } from "./time";

/**
 * Everything the mock adapters start from. Built from fixed lists and dates relative to HOY, so it is
 * the same on every run (seed.test.ts keeps a snapshot). Adapters clone it; nobody mutates it.
 */
export function buildSeed() {
  return structuredClone({
    term: courses.TERM,
    faculties: courses.FACULTIES,
    people: people.PEOPLE,
    student: people.STUDENT,
    courses: courses.COURSES,
    sections: courses.SECTIONS,
    enrollments: courses.ENROLLMENTS,
    announcements: courses.ANNOUNCEMENTS,
    documents: courses.COURSE_DOCUMENTS,
    bibliography: courses.BIBLIOGRAPHY,
    forum: courses.FORUM,
    links: courses.LINKS,
    library: courses.LIBRARY,
    aiResources: courses.AI_RESOURCES,
    activities: assessment.ACTIVITIES,
    grades: assessment.STUDENT_GRADES,
    submissions: assessment.STUDENT_SUBMISSIONS,
    gradeHistory: curriculum.GRADE_HISTORY,
    pensum: curriculum.PENSUM,
    pastEnrollments: curriculum.PAST_ENROLLMENTS,
    batchPpA6: assessment.BATCH_PP_A6,
    appeals: assessment.APPEALS,
    charges: finance.CHARGES,
    pastCharges: finance.PAST_CHARGES,
    payments: finance.PAYMENTS,
    transferQueue: finance.TRANSFER_QUEUE,
    conferences: conferences.CONFERENCES,
    reservations: conferences.RESERVATIONS,
    policy: POLICY,
  });
}

export type Seed = ReturnType<typeof buildSeed>;
