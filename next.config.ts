import type { NextConfig } from 'next';

const REQUIRED_ENV = ['GITHUB_TOKEN', 'GITHUB_REPO'] as const;

for (const key of REQUIRED_ENV) {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[env] Required env var ${key} is missing. ` +
        `Copy .env.example to .env.local and fill in the values. ` +
        `GITHUB_TOKEN: get from \`gh auth token\` or create a fine-grained PAT. ` +
        `GITHUB_REPO: "owner/repo" format, e.g. Jada-Q/activity-card-data.`,
    );
  }
  if (value !== value.trim()) {
    throw new Error(
      `[env] ${key} contains leading or trailing whitespace. ` +
        `Re-set the value using \`printf "..."\` (not \`echo\`) to avoid hidden newlines.`,
    );
  }
}

const nextConfig: NextConfig = {};

export default nextConfig;
