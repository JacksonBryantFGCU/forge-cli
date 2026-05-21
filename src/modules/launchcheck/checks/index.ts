import type { LaunchCheckRunner } from "../types.js";
import { buildChecks } from "./build.js";
import { envChecks } from "./env.js";
import { imageChecks } from "./images.js";
import { linkChecks } from "./links.js";
import { liveChecks } from "./live.js";
import { metadataChecks } from "./metadata.js";
import { packageChecks } from "./package.js";
import { vercelChecks } from "./vercel.js";

export const LOCAL_CHECKS: LaunchCheckRunner[] = [
  packageChecks,
  envChecks,
  vercelChecks,
  metadataChecks,
  imageChecks,
  linkChecks,
  buildChecks,
];

export const LIVE_CHECKS: LaunchCheckRunner[] = [liveChecks];

export const ALL_CHECKS: LaunchCheckRunner[] = [
  ...LOCAL_CHECKS,
  ...LIVE_CHECKS,
];
