import type { DoctorRule } from "../types.js";
import { expressSecurityRules } from "./express-security.js";
import { frontendEnvSecretsRule } from "./frontend-env-secrets.js";
import { indexHtmlMetadataRules } from "./index-html-metadata.js";
import { missingEnvExampleRule } from "./missing-env-example.js";
import { missingPackageJsonRule } from "./missing-package-json.js";
import { missingScriptsRules } from "./missing-scripts.js";
import { vercelSpaRewriteRule } from "./vercel-spa-rewrite.js";

export const allRules: DoctorRule[] = [
  missingPackageJsonRule,
  ...missingScriptsRules,
  missingEnvExampleRule,
  vercelSpaRewriteRule,
  ...indexHtmlMetadataRules,
  ...expressSecurityRules,
  frontendEnvSecretsRule,
];
