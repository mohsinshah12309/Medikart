const axios = require("axios");

/**
 * Dispatches on-demand revalidation request to the Next.js storefront
 * Non-blocking, with error logging and timeout.
 */
const triggerStorefrontRevalidation = ({ paths = [], tags = [] } = {}) => {
  const storefrontUrl =
    process.env.STOREFRONT_INTERNAL_URL ||
    process.env.STOREFRONT_URL ||
    "http://localhost:3000";

  const secret =
    process.env.REVALIDATION_SECRET ||
    process.env.JWT_SECRET ||
    "medikart-revalidation-secret";

  const payload = {
    secret,
    paths,
    tags,
  };

  // Dispatch asynchronously without blocking caller
  axios
    .post(`${storefrontUrl}/api/revalidate`, payload, {
      timeout: 4000,
      headers: { "Content-Type": "application/json" },
    })
    .then((res) => {
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[Revalidate] Storefront revalidated: ${JSON.stringify(res.data?.revalidated || [])}`
        );
      }
    })
    .catch((err) => {
      // In dev/test or during build, Next.js may not be listening on port 3000
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[Revalidate] Notice: storefront revalidation call (${err.message})`);
      }
    });
};

module.exports = {
  triggerStorefrontRevalidation,
};
