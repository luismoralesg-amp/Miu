import type { MetadataRoute } from "next";

/** Installable app: standalone window, the warm canvas of P1 Editorial and the crest as icon. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MiU · Universidad Francisco Marroquín",
    short_name: "MiU",
    description: "Portal académico de la Universidad Francisco Marroquín.",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f2ec",
    theme_color: "#f7f2ec",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
