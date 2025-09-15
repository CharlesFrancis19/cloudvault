// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',           // enables static export (replaces `next export`)
  trailingSlash: true,        // good for S3/CloudFront routing
  images: { unoptimized: true } // if you use next/image
};

export default nextConfig;
