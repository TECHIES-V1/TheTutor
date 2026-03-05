import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thetutor.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/contact", "/privacy", "/terms", "/explore"],
        disallow: [
          "/dashboard",
          "/profile",
          "/settings",
          "/create-course",
          "/learn",
          "/api",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
