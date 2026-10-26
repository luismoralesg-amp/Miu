import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${port}`;
/** Same build, started without MIU_DEV_TOOLS: what production looks like (tests/e2e/production.spec.ts). */
export const PROD_PORT = port + 1;

// Playwright's bundled Chromium is not downloaded yet; any local Chromium-based browser works
// meanwhile by pointing PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH at its binary.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const launchOptions = executablePath ? { executablePath } : {};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    locale: "es-GT",
    timezoneId: "America/Guatemala",
  },
  projects: [
    {
      name: "light",
      use: { ...devices["Desktop Chrome"], colorScheme: "light", launchOptions },
    },
    {
      name: "dark",
      use: { ...devices["Desktop Chrome"], colorScheme: "dark", launchOptions },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], launchOptions },
    },
  ],
  // Servers start in order, so the second one reuses the build of the first.
  webServer: [
    {
      command: `npm run build && npm run start -- --port ${port}`,
      url: `${baseURL}/api/health`,
      reuseExistingServer: !process.env.CI,
      env: { MIU_DEV_TOOLS: "1" },
      timeout: 180_000,
    },
    {
      command: `npm run start -- --port ${PROD_PORT}`,
      url: `http://localhost:${PROD_PORT}/api/health`,
      reuseExistingServer: !process.env.CI,
      env: { MIU_DEV_TOOLS: "" },
      timeout: 60_000,
    },
  ],
});
