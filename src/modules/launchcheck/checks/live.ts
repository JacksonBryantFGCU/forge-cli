import { runLiveChecks } from "../live/lighthouse-lite.js";
import type { LaunchCheckRunner } from "../types.js";

export const liveChecks: LaunchCheckRunner = async ({ url }) => {
  if (!url) {
    return [];
  }

  return runLiveChecks({ url });
};
