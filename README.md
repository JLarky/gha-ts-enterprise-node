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

## Learn More

- [gha-ts Documentation](https://github.com/JLarky/gha-ts)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions)
