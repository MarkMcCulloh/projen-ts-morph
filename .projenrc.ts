import { FileBase, ProjectType, TextFile, TypeScriptProject } from "projen";
import { VariableDeclarationKind } from "ts-morph";
import { TypescriptMorpher } from "./src";

const project = new TypeScriptProject({
  defaultReleaseBranch: "main",
  name: "projen-ts-morph",
  authorName: "Mark McCulloh",
  authorEmail: "Mark.McCulloh@gmail.com",
  releaseToNpm: true,
  projenrcTs: true,
  peerDeps: ["projen@0.27.6", "ts-morph"],
  projenDevDependency: false,
  projectType: ProjectType.LIB,
  typescriptVersion: "~4.2.4",
  docgen: true,
  stale: false,
  gitignore: ["test/test_project/"],
  eslintOptions: {
    dirs: ["src", "test"],
    prettier: true,
  },
  jestOptions: {
    jestConfig: {
      testPathIgnorePatterns: ["/node_modules/", "test/test_project"],
    },
  },
  antitamper: false,
});

const morpher = new TypescriptMorpher(project);
const exampleUsage = morpher.createTemporaryTypescriptFile("basic_create.ts");
exampleUsage.addImportDeclaration({
  moduleSpecifier: "projen-ts-morph",
  namedImports: ["TypescriptMorpher"],
});
exampleUsage.addVariableStatement({
  declarationKind: VariableDeclarationKind.Const,
  declarations: [
    { name: "morpher", initializer: "new TypescriptMorpher(project)" },
  ],
});
exampleUsage.addVariableStatement({
  declarationKind: VariableDeclarationKind.Const,
  declarations: [
    {
      name: "source",
      initializer: "morpher.createTypescriptFile('src/cool_generated.ts')",
    },
  ],
});
exampleUsage.addStatements([
  `source.addClass({
    name: 'CoolGenerated',
    isDefaultExport: true,
  });`,
]);

const readmeText = `\
![release](https://github.com/MarkMcCulloh/projen-ts-morph/actions/workflows/release.yml/badge.svg)
![npm version](https://badge.fury.io/js/projen-ts-morph.svg)

# ${project.name}

Generate and navigate typescript files with a [Projen](https://github.com/projen/projen) component.

## Implementation
The sole exported class of this project, \`TypescriptMorpher\`, acts as a wrapper around the excellent [ts-morph](https://github.com/dsherret/ts-morph/tree/latest/packages/ts-morph).

A few convenience methods are added to that class to aid in codegen, and during the synth() phase of your project all creations/updates/deletes will be saved to disk.

See https://github.com/dsherret/ts-morph and https://ts-morph.com for more details on the API. I take no credit for that amazing project.

## Stability

Consider this library unstable.

## Examples

### Create an example snippet for your README

See [this project's .projenrc.ts](./.projenrc.ts) for usage of \`createTemporaryTypescriptFile\` and \`renderFencedTypescript\`

### Create a simple empty class

${morpher.renderFencedTypescript(exampleUsage)}

## [Typedocs](https://markmcculloh.github.io/projen-ts-morph/)

<!---
${FileBase.PROJEN_MARKER}
It is so unnecessary to use projen for this readme, but here I go anyways :)
-->
`;

new TextFile(project, "README.md", {
  lines: readmeText.split("\n"),
});

project.eslint!.addIgnorePattern("test/test_project/");

project.testTask.prependExec("mkdir test/test_project");
project.testTask.prependExec("rm -rf test/test_project");

project.addExcludeFromCleanup("docs/**");

project.synth();
