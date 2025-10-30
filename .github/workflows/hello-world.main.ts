#!/usr/bin/env -S node --no-warnings
import { workflow } from "@jlarky/gha-ts/workflow-types";

import { generateWorkflowYaml } from "./utils/yaml.ts";

const wf = workflow({
  name: "Example workflow",
  on: { push: { branches: ["main"] }, pull_request: {} },
  jobs: {
    exampleJob: {
      "runs-on": "ubuntu-latest",
      steps: [
        { uses: "actions/checkout@v5", with: { "fetch-depth": 0 } },
        { name: "Test", run: "echo 'Hello, world!'\n" },
      ],
    },
  },
});

await generateWorkflowYaml(wf, import.meta.url);
