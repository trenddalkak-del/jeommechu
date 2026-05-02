/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "maps.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "k.kakaocdn.net" },
      { protocol: "https", hostname: "t1.kakaocdn.net" },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "@prisma/adapter-libsql", "@libsql/client"],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        os: false,
        path: false,
        stream: false,
        util: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        constants: false,
        timers: false,
        console: false,
        process: false,
        querystring: false,
        punycode: false,
        dgram: false,
        dns: false,
        cluster: false,
        module: false,
        v8: false,
        vm: false,
        async_hooks: false,
        child_process: false,
        string_decoder: false,
        perf_hooks: false,
        worker_threads: false,
        trace_events: false,
        inspector: false,
        diagnostics_channel: false,
        http2: false,
        readline: false,
        repl: false,
        sys: false,
        domain: false,
      };
    }
    return config;
  },
};

export default nextConfig;
