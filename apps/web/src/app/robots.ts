import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://command.agenciabase.tech";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/cliente", "/api", "/auth"] },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
