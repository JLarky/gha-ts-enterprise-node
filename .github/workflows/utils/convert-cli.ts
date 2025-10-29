#!/usr/bin/env -S node --no-warnings

/**
 * This helper can help you onboard existing projects to gha-ts. Run it like this:
 *
 * ```bash
 * .github/workflows/utils/convert-cli.ts .github/workflows/*.yml
 * ```
 *
 * And see the magic happen.
 */
import { chmod, glob, readFile, unlink, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { yamlToWf } from "./yaml.ts";
import { existsSync } from "node:fs";

const args = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));

const help = process.argv.includes("--help");
const force = process.argv.includes("--force");
const remove = process.argv.includes("--remove");

if (args.length === 0 || help) {
  console.error("Usage: convert-cli.ts <workflow-files> [--force] [--remove]");
  console.error("Example: convert-cli.ts .github/workflows/*.yml");
  process.exit(help ? 0 : 1);
}

const files: string[] = [];
const globs: string[] = [];
const filesToRemove: string[] = [];

for (const arg of args) {
  globs.push(arg);
  for await (const file of glob(arg)) {
    if (file.endsWith(".yml") || file.endsWith(".yaml")) {
      files.push(file);
    }
  }
}

if (files.length === 0) {
  console.error(`No YAML files found matching "${globs.join(", ")}"`);
  process.exit(1);
}

console.log("Converting the following files:");

for (const file of files) {
  console.log(`- ${file}`);
}

console.log();

for (const file of files) {
  const inputContent = await readFile(file, "utf8");
  // rename .yml|.yaml -> .main.ts; remove `.generated`
  const outFileName = file
    .replace(/\.yml|\.yaml$/, ".main.ts")
    .replace(/\.generated\.main\.ts$/, ".main.ts");
  const fileExists = existsSync(outFileName);
  const goodToGo = force || !fileExists || (await confirm(outFileName));
  if (goodToGo) {
    await writeFile(outFileName, yamlToWf(inputContent));
    // chmod +x to make it executable
    await chmod(outFileName, 0o755);
    console.log(`Wrote ${outFileName}`);
    console.log();
    if (!remove) {
      console.log(
        "IMPORTANT: you are now responsible for generating the YAML from the TS AND removing the original YAML file."
      );
      filesToRemove.push(file);
    } else {
      await unlink(file);
      console.log(`Removed ${file}`);
      console.log();
    }
  } else {
    console.log(`Skipping ${outFileName}`);
  }
}

console.log();
console.log("To generate YAML files from newly generated TS files, run:");
console.log(".github/workflows/utils/build-cli.ts");
console.log();
if (filesToRemove.length > 0) {
  console.log("To remove old YAML files, run:");
  console.log(`rm ${filesToRemove.join(" ")}`);
  console.log();
} else {
  console.log("And don't forget to remove old YAML files.");
}

export {};

async function confirm(filename: string) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const name = await rl.question(
    `File "${filename}" already exists. Overwrite? (y/N) `
  );
  rl.close();
  return name.trim().toLowerCase() === "y";
}
