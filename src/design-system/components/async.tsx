import { Suspense, type ReactNode } from "react";

import { LoadingRegion } from "./states";

/**
 * Loading → content, streamed per section: the page shell paints at once and each block fills in on
 * its own. Errors and timeouts come back as port results and render `PortProblem` in place; anything
 * thrown is caught by the route's error boundary.
 */
export function AsyncBoundary({
  fallback,
  label,
  children,
}: {
  fallback: ReactNode;
  label?: string;
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingRegion {...(label ? { label } : {})}>{fallback}</LoadingRegion>}>
      {children}
    </Suspense>
  );
}
