/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "liveblocks.io", port: "" }
        ]
    },
    typescript: {
        ignoreBuildErrors: true
    }
};

export default nextConfig;
