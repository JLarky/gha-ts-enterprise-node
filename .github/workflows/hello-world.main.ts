#!/usr/bin/env -S node --no-warnings
import { workflow } from "@jlarky/gha-ts/workflow-types";
import { generateWorkflowYaml } from "./utils/yaml.ts";
import { lines } from "@jlarky/gha-ts/utils";

import { checkoutStep } from "./utils/steps.ts";

const wf = workflow({
  name: "Example workflow",
  on: {
    push: { branches: ["main"] },
    pull_request: {},
  },
  jobs: {
    exampleJob: {
      "runs-on": "ubuntu-latest",
      steps: [
        checkoutStep({ "fetch-depth": 0 }),
        {
          name: "Test",
          run: lines(`
            echo 'Hello, world!'
          `),
        },
      ],
    },
  },
});

await generateWorkflowYaml(wf, import.meta.url);
