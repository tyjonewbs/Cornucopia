/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'lh3.googleusercontent.com', // For Google profile images
      'uploadthing.com', // For uploaded images
      'utfs.io', // For uploaded files
    ],
  },
}

export default nextConfig;
