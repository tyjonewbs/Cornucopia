import { MetadataRoute } from 'next';
import prisma from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cornucopialocal.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/market-stand/grid`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/market-stand/map`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/our-mission`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  try {
    // Fetch active market stands
    const marketStands = await prisma.marketStand.findMany({
      where: { status: 'APPROVED', isActive: true },
      select: { id: true, updatedAt: true },
    });

    const marketStandPages: MetadataRoute.Sitemap = marketStands.map((stand) => ({
      url: `${baseUrl}/market-stand/${stand.id}`,
      lastModified: stand.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // Fetch active products
    const products = await prisma.product.findMany({
      where: { isActive: true, status: 'APPROVED' },
      select: { id: true, updatedAt: true },
    });

    const productPages: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${baseUrl}/product/${product.id}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // Fetch published events
    const events = await prisma.event.findMany({
      where: { status: 'APPROVED', isActive: true },
      select: { id: true, updatedAt: true },
    });

    const eventPages: MetadataRoute.Sitemap = events.map((event) => ({
      url: `${baseUrl}/events/${event.id}`,
      lastModified: event.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [...staticPages, ...marketStandPages, ...productPages, ...eventPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return static pages only if database query fails
    return staticPages;
  }
}
