import { dump, load } from "js-yaml";
import { createSerializer, type Stringify } from "@jlarky/gha-ts/render";
import type { Workflow } from "@jlarky/gha-ts/workflow-types";
import { generateWorkflow } from "@jlarky/gha-ts/cli";
import { lines } from "@jlarky/gha-ts/utils";

/**
 * This is the core of your YAML generation logic.
 *
 * Feel free to leave it as is or hook into advanced options like specifics
 * of the YAML output syntax or having a different filenames or file structure.
 */

export const stringifyYaml: Stringify = (input) =>
  dump(input, { quotingType: '"', lineWidth: Infinity });

export async function generateWorkflowYaml(
  workflow: Workflow,
  moduleUrl: string // from import.meta.url
) {
  return generateWorkflow(workflow, stringifyYaml, moduleUrl);
}

export function yamlToWf(ymlText: string) {
  const yaml = load(ymlText) as Workflow;
  const jsonStr = createSerializer(yaml, JSON.stringify)
    .setHeader("")
    .stringifyWorkflow();

  return lines(`
    #!/usr/bin/env -S node --no-warnings
    import { workflow } from "@jlarky/gha-ts/workflow-types";

    import { generateWorkflowYaml } from "./utils/yaml.ts";

    const wf = workflow(${jsonStr});

    await generateWorkflowYaml(wf, import.meta.url);
  `);
}
