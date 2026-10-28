import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://civicsphere-web.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/legal', '/legal/acts', '/government', '/knowledge'],
      disallow: ['/admin/', '/cases/', '/documents/', '/profile/', '/api/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
