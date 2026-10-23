import type { MetadataRoute } from "next";
import { PROJECTS } from "@/lib/projects";

const siteUrl = "https://afrianpryo.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
    },
    {
      url: `${siteUrl}/resume`,
    },
    ...PROJECTS.map((project) => ({
      url: `${siteUrl}/works/${project.slug}`,
    })),
  ];
}
