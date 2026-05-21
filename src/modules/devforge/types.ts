export const TEMPLATE_NAMES = [
  "react-vite",
  "react-vite-tailwind",
  "express-api",
  "client-static-site",
] as const;

export type TemplateName = (typeof TEMPLATE_NAMES)[number];

export type TemplateFile = {
  path: string;
  content: string;
};

export type TemplateBuilder = (projectName: string) => TemplateFile[];

export type CreateProjectOptions = {
  cwd: string;
  name: string;
  template: string;
  install: boolean;
  dryRun: boolean;
};

export type CreateProjectResult = {
  projectName: string;
  projectPath: string;
  template: TemplateName;
  files: string[];
  packageManager: string;
  installCommand: string;
  devCommand: string;
};
