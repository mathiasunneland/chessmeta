// next.config.ts
const nextConfig = {
    async headers() {
        if (process.env.NODE_ENV !== "production") return [];

        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval';
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https:;
              font-src 'self' data:;
              connect-src 'self';
            `.replace(/\s{2,}/g, " ").trim(),
                    },
                ],
            },
        ];
    },
};

export default nextConfig;