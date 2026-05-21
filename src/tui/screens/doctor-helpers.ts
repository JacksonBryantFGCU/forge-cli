import type {
  DoctorCategory,
  DoctorIssue,
  DoctorSeverity,
} from "../../modules/repo-doctor/index.js";

export const CATEGORY_ORDER: DoctorCategory[] = [
  "security",
  "deployment",
  "env",
  "react",
  "express",
  "project",
];

const SEVERITY_RANK: Record<DoctorSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export type IssueGroup = {
  category: DoctorCategory;
  items: DoctorIssue[];
};

export function groupIssuesByCategory(issues: DoctorIssue[]): IssueGroup[] {
  const byCategory = new Map<DoctorCategory, DoctorIssue[]>();

  for (const issue of issues) {
    const bucket = byCategory.get(issue.category) ?? [];
    bucket.push(issue);
    byCategory.set(issue.category, bucket);
  }

  const groups: IssueGroup[] = [];

  for (const category of CATEGORY_ORDER) {
    const items = byCategory.get(category);
    if (items && items.length > 0) {
      groups.push({
        category,
        items: [...items].sort(
          (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
        ),
      });
    }
  }

  // Any unexpected category — append at the end so nothing is dropped.
  for (const [category, items] of byCategory) {
    if (!CATEGORY_ORDER.includes(category)) {
      groups.push({
        category,
        items: [...items].sort(
          (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
        ),
      });
    }
  }

  return groups;
}

export function filterIssues(
  issues: DoctorIssue[],
  query: string,
): DoctorIssue[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length === 0) return issues;

  return issues.filter((issue) => {
    return (
      issue.id.toLowerCase().includes(trimmed) ||
      issue.title.toLowerCase().includes(trimmed) ||
      issue.message.toLowerCase().includes(trimmed) ||
      issue.category.toLowerCase().includes(trimmed) ||
      issue.severity.toLowerCase().includes(trimmed)
    );
  });
}

export function flattenGroups(groups: IssueGroup[]): DoctorIssue[] {
  return groups.flatMap((g) => g.items);
}

export function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return index;
}
