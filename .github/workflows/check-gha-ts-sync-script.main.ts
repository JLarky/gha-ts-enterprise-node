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

              // Get changed files
              let changedFiles = "";
              await exec.exec("git", ["--no-pager", "diff", "--name-only"], {
                listeners: {
                  stdout: (data) => {
                    changedFiles += data.toString();
                  },
                },
              });

              const files = changedFiles
                .trim()
                .split("\n")
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
