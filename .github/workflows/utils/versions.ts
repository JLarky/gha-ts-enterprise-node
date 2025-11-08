/**
 * This file contains the versions of the actions that you are okay using.
 *
 * This is one place for you to manage versions, including generating this file
 * with a script if you like it to be up-to-date.
 */

export const actionVersions = {
  // chose what actions you are okay using the latest version of
  "actions/checkout@v5": "actions/checkout@v5",
  "actions/github-script@v8": "actions/github-script@v8",
  // and which you want to pin to a specific version
  "actions/setup-node@v5":
    "actions/setup-node@dda4788290998366da86b6a4f497909644397bb2",
} as const;
