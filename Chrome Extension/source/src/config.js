// Build-time configuration (automatically set by scripts/build.mjs)
// Production (deployable/) sets DEV_MODE = false so "Check Everything" is strictly locked.
// Private dev build (dev/) sets DEV_MODE = true for developer testing only.
export const EXTENSION_CONFIG = {
  DEV_MODE: false,
  DEFAULT_API_BASE: 'https://scamhisn-ai-v1.onrender.com',
  MAX_AUTO_LINKS_PER_PAGE: 6,
};
