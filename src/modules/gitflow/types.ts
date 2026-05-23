export type StagedChange = {
  status: "added" | "modified" | "deleted" | "renamed" | "other";
  path: string;
};

export type GitRepoStatus = {
  branch: string;
  hasUpstream: boolean;
  ahead: number;
  behind: number;
  staged: StagedChange[];
  unstaged: StagedChange[];
};

export type CommitMessageSource = "provided" | "ai" | "heuristic";

export type GenerateCommitMessageOptions = {
  diff: string;
  staged: StagedChange[];
  override?: string;
};

export type GenerateCommitMessageResult = {
  message: string;
  source: CommitMessageSource;
  note?: string;
};
