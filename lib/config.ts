const config = {
  ADS_API_URL:
    process.env.ADS_API_URL || process.env.NEXT_PUBLIC_ADS_API_URL || "",
  ADS_API_KEY: process.env.ADS_API_KEY || "",
  NODE_ENV: process.env.NODE_ENV || "",
  PORT: parseInt(process.env.PORT || "3000"),
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || "",
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET || "",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  ROOT_PATH: process.env.NEXT_PUBLIC_ROOT_PATH || process.env.ROOT_PATH || "",
  API_RATE_LIMIT_WINDOW_MINUTES: parseInt(
    process.env.API_RATE_LIMIT_WINDOW_MINUTES || "1"
  ),
  API_RATE_LIMIT: parseInt(process.env.API_RATE_LIMIT || "100"),
  isProduction: process.env.NODE_ENV === "production",
  DEFAULT_LANGUAGE:
    process.env.DEFAULT_LANGUAGE ||
    process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE ||
    "ro",
  SUPPORTED_LANGUAGES: (
    process.env.SUPPORTED_LANGUAGES ||
    process.env.NEXT_PUBLIC_SUPPORTED_LANGUAGES ||
    ""
  ).split(","),
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "",
  PHONE_NUMBER_PREFIX: process.env.NEXT_PUBLIC_PHONE_NUMBER_PREFIX || "",
  domain: process.env.NEXT_PUBLIC_DOMAIN || "",
  host: process.env.NEXT_PUBLIC_HOST || "",
  API_CLIENT: process.env.NEXT_PUBLIC_API_CLIENT || "",
  COUNTRY: process.env.NEXT_PUBLIC_COUNTRY || "",
  SENTRY_DNS:
    process.env.SENTRY_DNS || process.env.NEXT_PUBLIC_SENTRY_DNS || "",
  GA_ID: process.env.GA_ID || process.env.NEXT_PUBLIC_GA_ID || "",
  IMAGES_BUCKET:
    process.env.IMAGES_BUCKET || process.env.NEXT_PUBLIC_IMAGES_BUCKET || "",
  iconSizes: [16, 32, 96, 120, 144, 152, 180, 192, 384, 228, 230, 512, 1024],
  chartColors: ["#1A56DB", "#FF6347", "#FF9800", "#FF5722", "#F44336"]
};

if (!config.ADS_API_URL) throw new Error("ADS_API_URL is not defined");
// if (!config.ADS_API_KEY) throw new Error("ADS_API_KEY is not defined");
// if (!config.NEXTAUTH_SECRET) throw new Error("NEXTAUTH_SECRET is not defined");
if (!config.API_CLIENT) throw new Error("API_CLIENT is not defined");
if (!config.COUNTRY) throw new Error("COUNTRY is not defined");

export default config;
