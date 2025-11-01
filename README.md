# Enterprise Node Example

This example demonstrates how to use **gha-ts** with Node.js in an enterprise-grade setup, using a local workflow utilities module for code organization and reusability.

The philosophy of this template is similar to shadcn/ui, you are not expected to "install" your workflow generation, you are expected to own that part and use this repo as a template.

You will get the best results if you start a new repo with this template, you can also copy files to existing one (but you'd have to resolve conflicts) or just take an inspiration from it.

For best results make sure to have `check-gha-ts-workflows-converted` workflow (or similar) required in your CI, that prevents accidental out-of-sync errors that might happen when using workflow generation tools.

## Dependencies

- [@jlarky/gha-ts](https://github.com/JLarky/gha-ts) tiny dependency that adds type-safety to GitHub workflows
- Node.js 22.18+ or later (older versions could work if you use `tsx`/`ts-node` or use `.js` with jsdoc); could be replaced with Bun or Deno
- [Mise](https://mise.jdx.dev/) is an optional dependency for local development (examples how to use it in CI coming soon)
- js-yaml is an optional dependency to serialize YAML workflows in a nice human-readable way, JSON.stringify could be used for 0 dependency setup

## Features

- **TypeScript workflows**: Author workflows with strong typing and validation
- **Modular utilities**: Custom utilities in `.github/workflows/utils/` for code reuse
- **Node.js compatible**: Uses Node.js with `js-yaml` for YAML generation (no Bun or tsx/ts-node required)
- **Custom YAML serialization**: Fine-tuned YAML output with consistent formatting
- **YAML to TypeScript conversion**: Automatically convert existing YAML workflows to TypeScript

## Structure

```
.github/
├── workflows/
│   ├── utils/
│   │   ├── yaml.ts                                    # Custom YAML generation utilities
│   │   ├── build-cli.ts                               # Build script to generate workflows
│   │   ├── convert-cli.ts                             # Convert existing YAML to TypeScript
│   │   ├── steps.ts                                   # Common workflow steps
│   │   └── versions.ts                                # Version management utilities
│   ├── check-gha-ts-workflows-converted.main.ts       # Keeps your generated files in sync
│   ├── check-gha-ts-workflows-converted.generated.yml # Generated
│   ├── actionlint.main.ts                             # Actionlint checks YAML for errors
│   ├── actionlint.generated.yml                       # Generated
│   ├── hello-world.main.ts                            # Example workflow definition
│   └── hello-world.generated.yml                      # Generated
├── .gitattributes                                     # Mark generated files in github ui
├── package.json                                       # Dependencies
├── package-lock.json                                  # Locked dependencies
├── tsconfig.json                                      # TypeScript configuration
└── node_modules/                                      # Installed dependencies
```

## Getting Started

For this guide to work exactly as described, you'll need to copy files from this repo first, for example using `degit`:

```bash
npx tiged JLarky/gha-ts-enterprise-node .
```

### Install dependencies

```bash
mise run wf-install
```

Or manually:

```bash
cd .github
npm install
```

### Generate workflows

To generate workflow YAML files from TypeScript definitions:

```bash
mise run wf-build
```

Or manually:

```bash
.github/workflows/utils/build-cli.ts
```

### Watch for changes

Automatically rebuild workflows when TypeScript files change:

```bash
mise run wf-watch
```

Or manually:

```bash
node --watch --no-warnings .github/workflows/utils/build-cli.ts
```

## Key Components

### `hello-world.main.ts`

Defines a simple GitHub Actions workflow with checkout and echo steps:

```typescript
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
        checkout({ "fetch-depth": 0 }),
        { name: "Test", run: "echo 'Hello, world!'" },
      ],
    },
  },
});
```

### `utils/yaml.ts`

Provides custom YAML serialization using `js-yaml`:

- `stringifyYaml`: Custom YAML formatter with quote handling
- `generateWorkflowYaml`: Helper to generate and write workflow YAML files
- `yamlToWf`: Convert YAML workflows to TypeScript definitions

### `utils/build-cli.ts`

Build script that discovers and executes all `.main.ts` workflow files, generating corresponding `.generated.yml` outputs.

### `utils/convert-cli.ts`

Convert existing YAML workflow files to TypeScript definitions. Usage:

```bash
.github/workflows/utils/convert-cli.ts .github/workflows/*.yml [--force] [--remove] [--no-lines] [--no-comments]
```

Options:
- `--force`: Overwrite existing TypeScript files without prompting
- `--remove`: Automatically remove original YAML files after conversion
- `--no-lines`: Do not use lines helper to format multiline strings (faster conversion)
- `--no-comments`: Do not extract comments from YAML files (faster conversion)

## Customization

### Adding a new workflow

1. Create a new TypeScript file: `.github/workflows/my-workflow.main.ts`
2. Define your workflow using the gha-ts API
3. Call `generateWorkflowYaml(wf, import.meta.url)` to generate the YAML file
4. Run `mise run wf-build` to generate the output

### Converting existing workflows

If you have existing YAML workflows, use the conversion tool:

```bash
.github/workflows/utils/convert-cli.ts .github/workflows/*.yml
```

This will generate corresponding `.main.ts` files. Then run the build script to generate the `.generated.yml` outputs.

- You'll need to manually remove the original YAML files after conversion.
- You'll need to generate the YAML from the TS files after conversion.
- Because files will have `.generated.yml` suffix, you have to update filenames if you used reusable workflows (the ones that use `workflow_call`).
- Expect to clean up some small typescript mismatches like `true` where `'true'` is expected, or `null` where `{}` is expected. They produce the same output but obviously if you are considering `gha-ts` you wanted type-safety.
- Multiline strings will look not as nice in JSON, so you are expected to use `lines` helper to format them (manually).
- This will not preserve any comments that you had in the YAML files. I think it's technically possible when using [@eemeli/yaml](https://eemeli.org/yaml/) parser, but I haven't spent the time to implement it yet.

### Modifying YAML output

Edit `utils/yaml.ts` to adjust YAML formatting:

```typescript
export const stringifyYaml: Stringify = (input) =>
  dump(input, { quotingType: '"', lineWidth: Infinity });
```

### Practical guide of migrating existing repo

Go to your existing project and run:

```bash
npx tiged JLarky/gha-ts-enterprise-node gha-ts-enterprise-node
```

- Make sure that you are running Node 24 or Node 22.18+.

```bash
node --version
```

I advise you to figure out what exactly you will need long term, but for this guide You'll only need these:

```bash
cp gha-ts-enterprise-node/.github/{.gitignore,package.json,tsconfig.json} .github/
cp gha-ts-enterprise-node/.github/workflows/check-gha-ts-workflows-converted.main.ts .github/workflows/
cp -r gha-ts-enterprise-node/.github/workflows/utils .github/workflows/
rm -r gha-ts-enterprise-node
```

This is probably a good time to commit your changes

```bash
git add .
git commit -m "Copy gha-ts-enterprise-node files required for migration"
```

Now we can install the dependencies:

```bash
(cd .github && npm install)
```

And for the YOLO mode run this:

```bash
.github/workflows/utils/convert-cli.ts .github/workflows/*.yml --force --remove
```

and build the workflows:

```bash
.github/workflows/utils/build-cli.ts
```

at this point you can commit new ts files

```bash
git add '.github/workflows/*.main.ts'
git commit -m "convert to gha-ts"
```

and new yml files:

```bash
git add '.github/workflows/*.yml'
git commit -m "re-generate workflows"
```

This is a good step to format your code if you are using something like prettier.

```bash
npx prettier --write '.github/workflows/*.main.ts'
git add '.github/workflows/*.main.ts'
git commit -m "format code"
```

Now at this point you are done with automated steps. Next thing to fix is that since file
names changed you might need to update things like workflow_call to rename `.yml` files to
`.generated.yml` files.

The main goal of the `convert-cli.ts` script is to make sure that generated files will be
interpreted by github exactly the same, original yaml file and generated one should only
be different by trivial whitespace changes and comments. It will sacrifice some readability
of generated typescript code, but it should be trivial to clean up. Namely some strings like:

```ts
lines`echo \$GITHUB_SHA`
```

could be edited to:

```ts
lines`echo $GITHUB_SHA`
```

but it's tricky to do that in a general way in `convert-cli.ts` script, but you are welcome to
make changes like that or ask AI to clean up the code in `*.main.ts` files.

Now I would recommend you to run some sort of agentic tools with the following prompt:

```
We just converted our workflows to use gha-ts tool that allows us to author workflows in TypeScript.

After that conversion some files were renamed and some things might need to be updated.

If you have access to node 22.18+ or later you can run `.github/workflows/utils/build-cli.ts` to
regenerate yaml files and check that you didn't break anything. For order version use `npx tsx`.

First, if you have access to typescript LSP you might notice that some values like booleans should
be replaced with strings like `'true'` or `'false'` instead of `true` or `false`. And some values
like `workflow_dispatch: null` should be replaced with `workflow_dispatch: {}`.

Second, focus on any references that could be there in the form of `.github/workflows/filename.yml`
and update them to be `.github/workflows/filename.generated.yml` or `filename.main.ts` depending on
the context (runtime or source file).

Next see if you can format code better by using `lines` helper to format multiline strings, check
if there are any trivial newlines in the `*.main.ts` files that could be removed.

Last thing is that `*.main.ts` files might have comments in the form of `// original comment from line x`
at the top of them. That means that this comment existed in the original yaml and because gha-ts
doesn't output comments in the generated files, those comments should be moved to the appropriate
position in the `*.main.ts` files.

Once those things are addressed the migration will be complete.
```

Once you have done that step manually or automatically you might remove `utils/convert-cli.ts` file,
other typescript files in the `utils` are used to generate yaml files so can't be removed unless you
update your `*.main.ts` to stop using them.

## Learn More

- [gha-ts Documentation](https://github.com/JLarky/gha-ts)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions)
