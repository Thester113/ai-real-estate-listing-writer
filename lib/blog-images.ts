/**
 * Blog Image Utilities
 * Maps blog categories to curated Unsplash images for professional appearance
 */

// Category-specific Unsplash images for blog posts
// All images are real estate / business themed for brand consistency
export const categoryImages: Record<string, string> = {
  'Tips & Strategies': 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80', // Modern house exterior
  'Industry Insights': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80', // City buildings
  'Writing Tips': 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80', // Writing/notebook
  'SEO & Marketing': 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&q=80', // Analytics/laptop
  'Psychology': 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80', // Home interior
  'Best Practices': 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=800&q=80', // Luxury home
}

// Default image when category doesn't match
export const defaultBlogImage = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80'

/**
 * Get the appropriate image URL for a blog post
 * @param category - The blog post category
 * @param featuredImage - Optional custom featured image URL
 * @returns The image URL to use
 */
export function getBlogImage(category?: string, featuredImage?: string): string {
  // Use custom featured image if provided
  if (featuredImage) return featuredImage

  // Use category-specific image if available
  if (category && categoryImages[category]) return categoryImages[category]

  // Fall back to default
  return defaultBlogImage
}
