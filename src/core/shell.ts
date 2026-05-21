import { execa } from "execa";

export type ShellResult = {
  success: boolean;
  stdout: string;
  stderr: string;
};

export async function runCommand(
  command: string,
  args: string[],
  options: {
    cwd: string;
    inherit?: boolean;
  },
): Promise<ShellResult> {
  try {
    const result = await execa(command, args, {
      cwd: options.cwd,
      stdout: options.inherit ? "inherit" : "pipe",
      stderr: options.inherit ? "inherit" : "pipe",
    });

    return {
      success: true,
      stdout: typeof result.stdout === "string" ? result.stdout : "",
      stderr: typeof result.stderr === "string" ? result.stderr : "",
    };
  } catch (error) {
    if (error instanceof Error && "stdout" in error && "stderr" in error) {
      const commandError = error as Error & {
        stdout?: string;
        stderr?: string;
      };

      return {
        success: false,
        stdout: commandError.stdout ?? "",
        stderr: commandError.stderr ?? error.message,
      };
    }

    return {
      success: false,
      stdout: "",
      stderr: error instanceof Error ? error.message : "Unknown command error",
    };
  }
}