# SEO Quick Reference

## Adding SEO to New Pages

### 1. Import the helper
```tsx
import { Metadata } from "next";
import { generateMetadata } from "@/lib/seo";
```

### 2. Export metadata
```tsx
export const metadata: Metadata = generateMetadata({
  title: "Your Page Title",
  description: "Your page description (150-160 chars)",
  keywords: ["keyword1", "keyword2"],
  noIndex: false, // Set true for private pages
});
```

### 3. Add structured data (optional)
```tsx
import { generateCourseJsonLd } from "@/lib/structuredData";

export default function CoursePage({ course }) {
  const jsonLd = generateCourseJsonLd(course);
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Your page content */}
    </>
  );
}
```

## Checklist for New Pages

- [ ] Add page-specific metadata
- [ ] Write unique title (50-60 chars)
- [ ] Write compelling description (150-160 chars)
- [ ] Add relevant keywords
- [ ] Set noIndex for private pages
- [ ] Add to sitemap if public
- [ ] Add structured data if applicable
- [ ] Test with Rich Results Test
- [ ] Verify mobile responsiveness
- [ ] Check page load speed

## Common Patterns

### Public Marketing Page
```tsx
export const metadata = generateMetadata({
  title: "Feature Name",
  description: "Clear value proposition",
  keywords: ["feature", "benefit", "use case"],
});
```

### Private User Page
```tsx
export const metadata = generateMetadata({
  title: "Dashboard",
  description: "User dashboard",
  noIndex: true, // Don't index private pages
});
```

### Dynamic Course Page
```tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const course = await getCourse(params.id);
  
  return generateMetadata({
    title: course.title,
    description: course.description,
    keywords: [course.subject, course.level],
  });
}
```

## Testing URLs

- Sitemap: `/sitemap.xml`
- Robots: `/robots.txt`
- Manifest: `/manifest.json`
- OG Image: `/opengraph-image`

## External Tools

- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Schema Validator](https://validator.schema.org/)
- [PageSpeed Insights](https://pagespeed.web.dev/)

## Need Help?

See full documentation in `SEO.md`
