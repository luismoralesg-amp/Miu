import { notConnected } from "@/lib/not-connected";

import type { EnrollmentPort } from "../../ports/enrollment-port";

/** To connect: MiU's assignment window, offer and batch resolution; step-up through IdentityPort. */
export const createRealEnrollment = () => notConnected<EnrollmentPort>("Asignación de MiU");
