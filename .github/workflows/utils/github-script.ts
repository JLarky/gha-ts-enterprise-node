import { lines } from "@jlarky/gha-ts/utils";

// you will need to install the packages for the types that you are going to use as devDependencies
export type AsyncFunctionArguments = {
  // context: typeof import("@actions/github").context;
  core: typeof import("@actions/core");
  // github: ReturnType<typeof import("@actions/github").getOctokit>;
  // octokit: ReturnType<typeof import("@actions/github").getOctokit>;
  // exec: typeof import("@actions/exec");
  // glob: typeof import("@actions/glob");
  // io: typeof import("@actions/io");
  /**
   * new versions allow you to use `await import('${{ github.workspace }}/src/print-stuff.js')`
   *
   * https://github.com/actions/github-script?tab=readme-ov-file#use-esm-import
   */
  require: NodeJS.Require;
};

// you can also use import('@actions/github-script').AsyncFunctionArguments
// see https://github.com/actions/github-script?tab=readme-ov-file#use-scripts-with-jsdoc-support
export type GithubScriptHandler = (
  variables: AsyncFunctionArguments
) => unknown;

/**
 * If script returns a string or JSON it will be available as an output.
 *
 * You can't use closures to pass data to the function, use `env: {x: ''}` and `process.env.x` instead.
 */
export function githubScriptToString(handler: GithubScriptHandler) {
  return `return await (\n  ${lines(
    handler.toString()
  ).trimEnd()})({ context, core, github, octokit, exec, glob, io, require });\n`;
}
