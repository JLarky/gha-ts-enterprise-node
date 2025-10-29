import {
  buildWith,
  type CheckoutOptions,
  type SetupNodeOptions,
} from "@jlarky/gha-ts/actions";
import { uses, type UsesStep } from "@jlarky/gha-ts/workflow-types";

import { actionVersions } from "./versions.ts";

/**
 * Having `steps.ts` and `jobs.ts` is a great way to organize your workflow code.
 */

export function checkoutStep(options: CheckoutOptions = {}): UsesStep {
  return uses(actionVersions["actions/checkout@v5"], buildWith(options));
}

export function setupNodeStep(options: SetupNodeOptions = {}): UsesStep {
  return uses(actionVersions["actions/setup-node@v5"], buildWith(options));
}
