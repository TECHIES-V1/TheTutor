import { Metadata } from "next";

export const siteConfig = {
  name: "TheTutor",
  title: "TheTutor - AI-Powered Personalized Learning Platform",
  description:
    "Experience AI-powered education with Amazon Nova. Get personalized courses, interactive lessons, real-time feedback, and verified certificates. Just Ask.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://thetutor.app",
  ogImage: "/og-image.png",
  keywords: [
    "AI learning platform",
    "personalized education",
    "Amazon Nova AI",
    "online courses",
    "adaptive learning",
    "AI tutor",
    "custom curriculum",
    "interactive lessons",
    "verified certificates",
    "MCP integration",
    "AI-powered education",
    "machine learning education",
  ],
  authors: [
    { name: "Tobiloba Sulaimon", url: "https://github.com/tobilobacodes00" },
    { name: "Fadhan Daniel", url: "https://github.com/fadexadex" },
    { name: "Robert Dominic", url: "https://github.com/robert-dominic" },
    { name: "Joanna Bassey", url: "https://github.com/DevBytes-J" },
    { name: "Collins Joel", url: "https://github.com/Contractor-x" },
  ],
  creator: "TECHIES-V1",
  twitter: {
    card: "summary_large_image",
    site: "@thetutor",
    creator: "@thetutor",
  },
};

export function generateMetadata({
  title,
  description,
  image,
  noIndex = false,
  keywords,
  canonical,
}: {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
  canonical?: string;
}): Metadata {
  const metaTitle = title
    ? `${title} | ${siteConfig.name}`
    : siteConfig.title;
  const metaDescription = description || siteConfig.description;
  const metaImage = image || siteConfig.ogImage;
  const metaKeywords = keywords
    ? [...siteConfig.keywords, ...keywords]
    : siteConfig.keywords;

  return {
    metadataBase: new URL(siteConfig.url),
    title: metaTitle,
    description: metaDescription,
    keywords: metaKeywords,
    authors: siteConfig.authors,
    creator: siteConfig.creator,
    ...(canonical && { alternates: { canonical } }),
    ...(noIndex && { robots: { index: false, follow: false } }),
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteConfig.url,
      title: metaTitle,
      description: metaDescription,
      siteName: siteConfig.name,
      images: [
        {
          url: metaImage,
          width: 1200,
          height: 630,
          alt: metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: [metaImage],
      site: siteConfig.twitter.site,
      creator: siteConfig.twitter.creator,
    },
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
  };
}

export const jsonLd = {
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    description: siteConfig.description,
    sameAs: [
      "https://github.com/TECHIES-V1/TheTutor",
    ],
  },
  website: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/explore?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  },
  educationalOrganization: {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    logo: `${siteConfig.url}/logo.png`,
    offers: {
      "@type": "Offer",
      category: "Education",
      description: "AI-powered personalized learning courses",
    },
  },
};
