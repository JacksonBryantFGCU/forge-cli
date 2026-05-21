#!/usr/bin/env node

// src/index.ts
import { handle, run } from "@oclif/core";
await run(process.argv.slice(2), import.meta.url).catch(handle);
//# sourceMappingURL=index.js.map