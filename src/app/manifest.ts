import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Weekly Eats",
    short_name: "WeeklyEats",
    description: "Your weekly dinner plan, powered by local AI",
    start_url: "/meals",
    display: "standalone",
    background_color: "#f9f5f0",
    theme_color: "#2c2418",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
