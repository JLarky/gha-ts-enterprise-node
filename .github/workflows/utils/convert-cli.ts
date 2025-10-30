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
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { createInterface } from "node:readline/promises";
import { yamlToWfTemplate } from "./yaml.ts";
import { existsSync } from "node:fs";
import { tmpdir } from "os";
import { join } from "path";
import { writeFileSync } from "fs";

const execFile = promisify(execFileCallback);

const args = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));

const help = process.argv.includes("--help");
const force = process.argv.includes("--force");
const remove = process.argv.includes("--remove");
const useJsonToJavascript = !process.argv.includes("--no-lines");

if (args.length === 0 || help) {
  console.error(
    "Usage: convert-cli.ts <workflow-files> [--force] [--remove] [--no-lines]"
  );
  console.error("Example: convert-cli.ts .github/workflows/*.yml");
  console.error("Options:");
  console.error(
    "  --force: Overwrite existing TypeScript files without prompting"
  );
  console.error(
    "  --remove: Automatically remove original YAML files after conversion"
  );
  console.error(
    "  --no-lines: Do not use lines helper to format multiline strings"
  );
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
    if (useJsonToJavascript) {
      await jsonToJavascript(inputContent, outFileName);
    } else {
      await createYaml(inputContent, outFileName);
    }
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

async function jsonToJavascript(inputContent: string, outFileName: string) {
  const { json, template, jsonPlaceholder } = yamlToWfTemplate(inputContent);
  // inputContent
  const tmpInputFile = join(tmpdir(), "convert-cli.yml");
  writeFileSync(tmpInputFile, JSON.stringify(json));
  const [prefix, suffix] = template.split(jsonPlaceholder) as [string, string];
  // oxlint-disable no-useless-spread
  await execFile("npx", [
    "-y",
    "@jlarky/json-to-javascript@0.0.7",
    ...["--prefix", prefix],
    ...["--suffix", suffix],
    ...["--useDedent", "true"],
    ...["--dedentPrefix", "lines"],
    ...["--jsonStringifySpace", "2"],
    ...["--inputFile", tmpInputFile],
    ...["--outputFile", outFileName],
  ]);
}

async function createYaml(inputContent: string, outFileName: string) {
  const { json, template, jsonPlaceholder } = yamlToWfTemplate(inputContent);
  const [prefix, suffix] = template.split(jsonPlaceholder) as [string, string];

  await writeFile(outFileName, prefix + JSON.stringify(json, null, 2) + suffix);
}
