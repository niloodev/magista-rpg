import { fileURLToPath } from "node:url";

export const STATE_FILE = fileURLToPath(new URL("../test-results/e2e-state.json", import.meta.url));
