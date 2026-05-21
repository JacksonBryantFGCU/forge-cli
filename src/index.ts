#!/usr/bin/env node

import { handle, run } from "@oclif/core";

await run(process.argv.slice(2), import.meta.url).catch(handle);
