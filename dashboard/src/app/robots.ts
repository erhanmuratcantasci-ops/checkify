import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chekkify.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // App surfaces and customer COD tokens shouldn't be indexed
        disallow: [
          "/dashboard/",
          "/orders/",
          "/shops/",
          "/credits/",
          "/profile/",
          "/sms-logs/",
          "/blocking-rules/",
          "/blocklist/",
          "/rto/",
          "/admin/",
          "/api/",
          "/auth/",
          "/confirm/",
          "/status/",
          "/verify/",
          "/reset-password/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
