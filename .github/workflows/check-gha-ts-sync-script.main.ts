#!/usr/bin/env -S node --no-warnings
import { workflow } from "@jlarky/gha-ts/workflow-types";

import { generateWorkflowYaml } from "./utils/yaml.ts";
import { lines } from "@jlarky/gha-ts/utils";
import {
  checkoutStep,
  setupNodeStep,
  githubScriptStep,
} from "./utils/steps.ts";
import { githubScriptToString } from "./utils/github-script.ts";

const wf = workflow({
  name: "Check gha-ts sync script",
  on: {
    push: { branches: ["main"] },
    pull_request: {},
  },
  jobs: {
    checkTypeScript: {
      name: "Check TypeScript",
      "runs-on": "ubuntu-latest",
      steps: [
        checkoutStep({ "fetch-depth": 0 }),
        {
          name: "Install dependencies",
          run: lines("cd .github/workflows && npm ci"),
        },
        {
          name: "Check TypeScript",
          run: lines("cd .github/workflows && npm run type-check"),
        },
      ],
    },
    checkGhaTsWorkflowsConverted: {
      name: "Check gha-ts workflows converted",
      "runs-on": "ubuntu-latest",
      steps: [
        checkoutStep({ "fetch-depth": 0 }),
        setupNodeStep({ "node-version": "22" }),
        {
          name: "Install production dependencies",
          run: lines("cd .github/workflows && npm ci --omit=dev"),
        },
        {
          name: "Clear generated workflows",
          run: lines(`rm -f .github/workflows/*.generated.yml`),
        },
        {
          name: "Generate TS workflows to yaml",
          run: lines`.github/workflows/utils/build-cli.ts`,
        },
        {
          name: "Verify if TS workflows are converted",
          ...githubScriptStep({
            script: githubScriptToString(async ({ exec, core }) => {
              const fs = await import("node:fs");

              // Get changed files (includes both modified tracked files and untracked files)
              let changedFiles = "";
              await exec.exec("git", ["status", "--porcelain"], {
                listeners: {
                  stdout: (data) => {
                    changedFiles += data.toString();
                  },
                },
              });

              // Parse git status output to extract filenames
              // Format: "XY filename" where XY is status code (e.g., " M", "??")
              // For renames: "R  old -> new" or "R100 old -> new" -> extract only "new"
              const files = changedFiles
                .trim()
                .split("\n")
                .filter((line) => line.length > 0)
                .map((line) => {
                  // Remove status code (first 2 chars + space = 3 chars minimum)
                  // For renames with similarity: "R100 old -> new" (status can be longer)
                  // So we remove up to the first space after status code
                  const firstSpaceIndex = line.indexOf(" ", 2);
                  if (firstSpaceIndex === -1) {
                    return "";
                  }
                  const afterStatus = line
                    .substring(firstSpaceIndex + 1)
                    .trim();
                  // Check if this is a rename entry (contains " -> ")
                  const renameMatch = afterStatus.match(/^.+ -> (.+)$/);
                  if (renameMatch && renameMatch[1]) {
                    // Extract only the new filename after " -> "
                    return renameMatch[1];
                  }
                  // For non-rename entries, return the filename as-is
                  return afterStatus;
                })
                .filter((f) => f.length > 0);

              if (files.length > 0) {
                // Create error annotation
                core.error(
                  "Run 'mise run wf-build' locally, commit, and push.",
                  {
                    title: "TS workflows are not up to date",
                  }
                );

                // Group changed files
                core.startGroup("Changed files");
                console.log(files.join("\n"));
                core.endGroup();

                // Create notice for each file
                for (const file of files) {
                  core.notice("Update generated YAML for this file", {
                    file: file,
                    title: "Changed file",
                  });
                }

                // Write to step summary
                const fileList = files.map((f) => "- " + f).join("\n");
                const summary = [
                  "### TS workflows are not up to date",
                  "",
                  "Run: mise run wf-build",
                  "",
                  "Then commit the updated files and push.",
                  "",
                  "Changed files:",
                  "",
                  fileList,
                ].join("\n");

                fs.appendFileSync(
                  process.env.GITHUB_STEP_SUMMARY!,
                  summary + "\n"
                );

                // Exit with error
                core.setFailed("TS workflows are not up to date");
              }

              return "";
            }),
          }),
        },
      ],
    },
  },
});

await generateWorkflowYaml(wf, import.meta.url);
