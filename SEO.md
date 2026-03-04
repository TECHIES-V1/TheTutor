# SEO Implementation Guide

## Overview

TheTutor has comprehensive SEO implementation including metadata, structured data, sitemaps, and performance optimizations.

## Features Implemented

### 1. Metadata Management
- **Centralized SEO Config**: `/frontend/src/lib/seo.ts`
- Dynamic metadata generation for all pages
- Open Graph tags for social sharing
- Twitter Card support
- Canonical URLs
- Keywords optimization

### 2. Structured Data (JSON-LD)
Implemented schema.org structured data:
- **Organization**: Company information
- **WebSite**: Site-wide search action
- **EducationalOrganization**: Education-specific markup

### 3. Sitemap & Robots
- **Dynamic Sitemap**: `/frontend/src/app/sitemap.ts`
  - Auto-generated XML sitemap
  - Priority and change frequency configured
  - Accessible at `/sitemap.xml`

- **Robots.txt**: `/frontend/src/app/robots.ts`
  - Public pages allowed
  - Private pages (dashboard, profile) disallowed
  - Sitemap reference included
  - Accessible at `/robots.txt`

### 4. Social Sharing
- **Dynamic OG Image**: `/frontend/src/app/opengraph-image.tsx`
  - Auto-generated 1200x630 image
  - Brand colors and logo
  - Accessible at `/opengraph-image`

### 5. PWA Support
- **Web Manifest**: `/frontend/src/app/manifest.ts`
  - App name and description
  - Theme colors
  - Icons configuration
  - Accessible at `/manifest.json`

### 6. Performance Optimizations
- Image optimization (AVIF, WebP)
- Compression enabled
- ETags for caching
- Font display swap
- Removed `X-Powered-By` header

## Page-Specific SEO

### Public Pages (Indexed)
- `/` - Home page with full metadata
- `/about` - About page
- `/contact` - Contact information
- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/explore` - Course catalog
- `/auth/signin` - Sign in (noindex)

### Private Pages (Not Indexed)
- `/dashboard/*` - User dashboard
- `/profile` - User profile
- `/settings/*` - User settings
- `/create-course` - Course creation
- `/learn/*` - Learning interface

## Environment Variables

Add to `frontend/.env.local`:

```bash
NEXT_PUBLIC_SITE_URL=https://thetutor.app
```

This is used for:
- Canonical URLs
- Open Graph URLs
- Sitemap generation
- Structured data

## Verification & Testing

### 1. Test Metadata
```bash
curl -I https://thetutor.app
```

### 2. Validate Structured Data
- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema.org Validator: https://validator.schema.org/

### 3. Check Sitemap
```bash
curl https://thetutor.app/sitemap.xml
```

### 4. Verify Robots.txt
```bash
curl https://thetutor.app/robots.txt
```

### 5. Test Social Sharing
- Facebook Debugger: https://developers.facebook.com/tools/debug/
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

## Google Search Console Setup

1. **Add Property**: Add your domain to Google Search Console
2. **Submit Sitemap**: Submit `https://thetutor.app/sitemap.xml`
3. **Request Indexing**: Request indexing for key pages
4. **Monitor Performance**: Track impressions, clicks, and rankings

## Best Practices

### Content
- Unique, descriptive titles (50-60 characters)
- Compelling meta descriptions (150-160 characters)
- Relevant keywords naturally integrated
- Clear heading hierarchy (H1 → H2 → H3)

### Technical
- Fast page load times (< 3s)
- Mobile-responsive design
- HTTPS enabled
- Clean URL structure
- Internal linking strategy

### Ongoing
- Regular content updates
- Monitor Core Web Vitals
- Fix broken links
- Update sitemap as pages change
- Track keyword rankings

## Analytics Integration

Add Google Analytics or similar:

```tsx
// In app/layout.tsx <head>
<script
  async
  src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
/>
<script
  dangerouslySetInnerHTML={{
    __html: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'GA_MEASUREMENT_ID');
    `,
  }}
/>
```

## Monitoring

Track these metrics:
- Organic search traffic
- Keyword rankings
- Click-through rates (CTR)
- Bounce rates
- Page load speed
- Core Web Vitals (LCP, FID, CLS)

## Future Enhancements

- [ ] Blog/content marketing section
- [ ] Course-specific structured data (Course schema)
- [ ] FAQ schema for common questions
- [ ] Video schema for lesson videos
- [ ] Breadcrumb structured data
- [ ] Review/rating schema
- [ ] Local business schema (if applicable)
- [ ] AMP pages for mobile
- [ ] Multilingual SEO (hreflang tags)

## Resources

- [Next.js Metadata Docs](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Google Search Central](https://developers.google.com/search)
- [Schema.org Documentation](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
