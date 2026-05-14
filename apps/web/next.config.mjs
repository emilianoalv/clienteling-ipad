import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    typedRoutes: true,
  },
  eslint: {
    dirs: ["src"],
  },
  // The legacy prototype lives outside this app; nothing to alias here.
};

export default withNextIntl(nextConfig);
