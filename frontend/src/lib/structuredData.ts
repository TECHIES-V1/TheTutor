export function generateCourseJsonLd(course: {
  id: string;
  title: string;
  description: string;
  subject: string;
  level: string;
  estimatedHours?: number;
  createdAt?: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thetutor.app";

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    provider: {
      "@type": "Organization",
      name: "TheTutor",
      url: baseUrl,
    },
    educationalLevel: course.level,
    about: {
      "@type": "Thing",
      name: course.subject,
    },
    ...(course.estimatedHours && {
      timeRequired: `PT${course.estimatedHours}H`,
    }),
    ...(course.createdAt && {
      datePublished: course.createdAt,
    }),
    url: `${baseUrl}/explore/${course.id}`,
    isAccessibleForFree: true,
    inLanguage: "en",
  };
}

export function generateBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateFAQJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
