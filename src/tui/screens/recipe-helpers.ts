import type {
  Recipe,
  RecipeFileOperation,
} from "../../modules/stackpack/types.js";

export function filterRecipes(recipes: Recipe[], query: string): Recipe[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return recipes;
  return recipes.filter((r) => {
    return (
      r.id.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });
}

export type OperationCounts = Record<RecipeFileOperation, number>;

export function summarizeOperations(recipe: Recipe): OperationCounts {
  const counts: OperationCounts = {
    create: 0,
    overwrite: 0,
    append: 0,
  };
  for (const file of recipe.files) {
    counts[file.operation] += 1;
  }
  return counts;
}

export function formatOperationCounts(counts: OperationCounts): string {
  const parts: string[] = [];
  if (counts.create > 0) parts.push(`${counts.create} create`);
  if (counts.overwrite > 0) parts.push(`${counts.overwrite} overwrite`);
  if (counts.append > 0) parts.push(`${counts.append} append`);
  return parts.length > 0 ? parts.join(" · ") : "no file operations";
}

export function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return index;
}
