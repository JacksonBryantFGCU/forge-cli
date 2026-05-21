type ClipboardyModule = {
  default?: { write(text: string): Promise<void> };
  write?: (text: string) => Promise<void>;
};

export async function writeToClipboard(text: string): Promise<boolean> {
  try {
    const moduleName = "clipboardy";
    const mod = (await import(moduleName)) as ClipboardyModule;
    const write = mod.default?.write ?? mod.write;
    if (!write) return false;
    await write(text);
    return true;
  } catch {
    return false;
  }
}
