import type { MetadataRoute } from "next";

/**
 * Web app manifest: lets shoppers add the store to their home screen, which
 * iPhone requires before a site can send notifications (drop alerts).
 * Colors are the --bg and --ink values from styles/tokens.css.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Revised Research",
    short_name: "Revised Research",
    description: "Research compounds with published certificates of analysis. For laboratory research use only.",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#223044",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
