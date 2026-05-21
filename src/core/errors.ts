export class ForgeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForgeError";
  }
}

export class ValidationError extends ForgeError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class FileOperationError extends ForgeError {
  constructor(message: string) {
    super(message);
    this.name = "FileOperationError";
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}