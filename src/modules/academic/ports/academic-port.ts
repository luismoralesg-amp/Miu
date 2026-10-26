import type { PortResult } from "@/lib/result";
import type { Actor } from "@/modules/identity";

import type {
  Announcement,
  Course,
  CourseDocument,
  DirectoryPerson,
  PastCourse,
  RosterEntry,
  ScheduleEntry,
  Subsection,
  SubsectionContent,
  TeachingSection,
  Term,
} from "../domain/types";

/**
 * Courses, sections, schedule and course content. `mock` reads the seed; `real` will read MiU's API
 * or its change-data feed (docs/INTEGRACIONES_PENDIENTES.md).
 */
export interface AcademicPort {
  getTerm(): PortResult<Term>;
  /** The student's courses this term, one per enrolled section. */
  listCurrentEnrollments(actor: Actor): PortResult<Course[]>;
  /** A course the actor takes or teaches; `forbidden` otherwise. */
  getCourse(actor: Actor, courseId: string): PortResult<Course>;
  /** Weekly class slots of the actor's sections. */
  getSchedule(actor: Actor): PortResult<ScheduleEntry[]>;
  listPastEnrollments(actor: Actor): PortResult<PastCourse[]>;
  listAnnouncements(actor: Actor, courseId?: string): PortResult<Announcement[]>;
  listDocuments(actor: Actor, courseId: string): PortResult<CourseDocument[]>;
  /** Content of the simple subsections; distinguishes "disabled" from "empty". */
  getSubsection(actor: Actor, courseId: string, sub: Subsection): PortResult<SubsectionContent>;
  /** Sections the actor teaches (Maestro) or assists (Auxiliar). */
  listTeachingSections(actor: Actor): PortResult<TeachingSection[]>;
  /** Students of a section the actor teaches, with PII masked. */
  getRoster(actor: Actor, sectionId: string): PortResult<RosterEntry[]>;
  /** Teachers and assistants of the actor's courses (⌘K and Mensajes). */
  listCoursePeople(actor: Actor): PortResult<DirectoryPerson[]>;
}
