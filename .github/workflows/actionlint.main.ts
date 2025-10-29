#!/usr/bin/env -S node --no-warnings
import { workflow } from "@jlarky/gha-ts/workflow-types";

import { generateWorkflowYaml } from "./utils/yaml.ts";
import { checkoutStep } from "./utils/steps.ts";

const wf = workflow({
  name: "Actionlint",
  on: {
    push: { branches: ["main"] },
    pull_request: {},
  },
  jobs: {
    actionlintReviewDog: {
      "runs-on": "ubuntu-latest",
      steps: [
        checkoutStep(),
        {
          name: "Run reviewdog/action-actionlint",
          uses: "reviewdog/action-actionlint@v1",
          with: {
            reporter: "github-pr-check",
            fail_level: "any",
          },
        },
      ],
    },
  },
});

await generateWorkflowYaml(wf, import.meta.url);
