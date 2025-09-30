/** @type {import('next').NextConfig} */

const appConfig = {
  port: Number(process.env.PORT ?? 5050),
  maxQueryLen: Number(process.env.MAX_QUERY_LEN ?? 120),
  maxResults: Number(process.env.MAX_RESULTS ?? 1),
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',').map(s => s.trim()).filter(Boolean),
};

const nextConfig = {
  publicRuntimeConfig: appConfig,
};

module.exports = nextConfig;
