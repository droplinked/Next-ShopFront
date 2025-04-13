/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'upload-file-flatlay.s3.us-west-2.amazonaws.com',
            },
            {
                protocol: 'https',
                hostname: 'upload-file-droplinked.s3.amazonaws.com',
            },
        ],
    },
    webpack(config, options) {
        config.module.rules.push({
            test: /\.svg$/,
            use: ["@svgr/webpack"],
        });

        return config;
    },
};

export default nextConfig;
