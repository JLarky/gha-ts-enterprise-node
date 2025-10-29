#!/usr/bin/env -S node --no-warnings

/**
 * This is the main script that you need to run when you want to generate the workflows.
 *
 * You can start it in watch mode by running:
 *
 * ```bash
 * node --watch --no-warnings .github/workflows/utils/build-cli.ts
 * ```
 */

import { glob } from "node:fs/promises";

process.chdir(import.meta.dirname);

const promises: Promise<void>[] = [];

for await (const entry of glob("../*.main.ts")) {
  promises.push(import(entry));
}

await Promise.all(promises);
