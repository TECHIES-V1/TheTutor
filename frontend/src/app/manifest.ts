import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TheTutor - AI-Powered Learning",
    short_name: "TheTutor",
    description:
      "Experience AI-powered education with Amazon Nova. Get personalized courses, interactive lessons, and verified certificates.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#d4af37",
    icons: [
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
