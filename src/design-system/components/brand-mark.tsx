import Image from "next/image";

import { cx } from "@/lib/cx";

/*
 * Official UFM files from public/brand/ are shown as-is, never redrawn.
 *
 * logo-ufm01.png (412×250) is the full lockup with white text, so it only works on dark surfaces.
 * Light surfaces show the shield from that same file, cropped by a viewport (the pixels are not
 * altered), next to the university name set in Inter. escudo.png and escudo-osc.png are translucent
 * watermarks (≤ 12 % opacity) and cannot serve as a visible mark.
 *
 * Shield bounds inside the PNG, measured from its opaque pixels: x 11–158, y 10–186.
 */
const SHIELD = { x: 11, y: 10, w: 148, h: 177 };
const LOGO = { w: 412, h: 250 };

function Shield({ height }: { height: number }) {
  const width = (height * SHIELD.w) / SHIELD.h;
  const scale = height / SHIELD.h;
  return (
    <span
      aria-hidden="true"
      className="relative block shrink-0 overflow-hidden"
      style={{ width, height }}
    >
      <Image
        src="/brand/logo-ufm01.png"
        alt=""
        width={LOGO.w}
        height={LOGO.h}
        preload
        className="absolute max-w-none"
        style={{
          width: LOGO.w * scale,
          height: LOGO.h * scale,
          left: -SHIELD.x * scale,
          top: -SHIELD.y * scale,
        }}
      />
    </span>
  );
}

/**
 * `compact`: shield + "MiU", for the app header (both themes).
 * `lockup`: the university identity, for sign-in and the footer. Dark uses the official lockup;
 * light uses the shield and the name in Inter (see note above).
 */
export function BrandMark({
  variant = "compact",
  className,
}: {
  variant?: "compact" | "lockup";
  className?: string;
}) {
  if (variant === "compact") {
    return (
      <span className={cx("inline-flex items-center gap-2.5", className)}>
        <Shield height={30} />
        <span className="display text-[22px] font-semibold text-fg">MiU</span>
        <span className="sr-only">, Universidad Francisco Marroquín</span>
      </span>
    );
  }

  return (
    <span className={cx("inline-flex", className)}>
      <span className="inline-flex items-center gap-3 dark:hidden">
        <Shield height={52} />
        <span className="flex flex-col text-label leading-tight font-semibold tracking-[-0.01em] text-fg">
          <span>Universidad</span>
          <span>Francisco Marroquín</span>
        </span>
      </span>
      <Image
        src="/brand/logo-ufm01.png"
        alt="Universidad Francisco Marroquín"
        width={LOGO.w}
        height={LOGO.h}
        className="hidden h-16 w-auto dark:block"
      />
    </span>
  );
}
