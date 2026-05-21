export {
  RecipeFileOperationSchema,
  RecipeFileSchema,
  RecipeSchema,
} from "../../schemas/recipe.schema.js";
export type {
  Recipe,
  RecipeFile,
  RecipeFileOperation,
} from "../../schemas/recipe.schema.js";

export type PackAction =
  | "list"
  | "search"
  | "show"
  | "save"
  | "use"
  | "init-defaults"
  | "delete";

export const PACK_ACTIONS: PackAction[] = [
  "list",
  "search",
  "show",
  "save",
  "use",
  "init-defaults",
  "delete",
];

export type RunPackCommandOptions = {
  cwd: string;
  action: string;
  name?: string;
  description?: string;
  tags?: string;
  dryRun: boolean;
  force: boolean;
};

export type PackCommandResult = {
  message: string;
  items: string[];
};
