import { Skeleton } from "@/design-system/components";

import { DaySkeleton, HeroSkeleton, ListSkeleton } from "./sections";

/** Same skeleton as the page it stands for, so nothing jumps when content arrives. */
export function HoySkeleton() {
  return (
    <>
      <div className="flex flex-col gap-3 pt-10 pb-8 md:pt-14 md:pb-10">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-12 w-[min(520px,90%)] md:h-16" />
      </div>
      <HeroSkeleton />
      <div className="border-b border-border py-10 md:py-12">
        <Skeleton className="h-8 w-40" />
        <DaySkeleton />
      </div>
      <div className="grid gap-10 py-10 md:grid-cols-12">
        <div className="md:col-span-7">
          <Skeleton className="h-8 w-48" />
          <ListSkeleton />
        </div>
        <div className="md:col-span-5">
          <Skeleton className="h-8 w-40" />
          <ListSkeleton />
        </div>
      </div>
    </>
  );
}
