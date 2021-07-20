import { FileBase, ProjectType, TextFile, TypeScriptProject } from "projen";

const project = new TypeScriptProject({
  defaultReleaseBranch: "main",
  name: "projen-ts-morph",
  authorName: "Mark McCulloh",
  authorEmail: "Mark.McCulloh@gmail.com",
  releaseToNpm: false,
  projenrcTs: true,
  peerDeps: ["projen@0.27.5", "ts-morph"],
  projenDevDependency: false,
  projectType: ProjectType.LIB,
  typescriptVersion: "~4.2.4",
  // docgen: true,
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
});

const readmeText = `\
<!---
${FileBase.PROJEN_MARKER}
It is so unnecessary to use projen for this, but here I go anyways :)
-->

# ${project.name}

Generate and navigate typescript files with a Projen component

[https://markmcculloh.github.io/projen-ts-morph/](d)

See https://github.com/dsherret/ts-morph for more details on the API. I take no credit for that amazing project.
`;

new TextFile(project, "README.md", {
  lines: readmeText.split("\n"),
});

project.eslint!.addIgnorePattern("test/test_project/");

project.testTask.prependExec("mkdir test/test_project");
project.testTask.prependExec("rm -rf test/test_project");

project.addDevDeps("typedoc@^0.21.4");

const docgen = project.addTask("docgen", {
  description: `Generate TypeScript API reference ${project.docsDirectory}`,
  exec: `typedoc ${project.srcdir} --disableSources --out ${project.docsDirectory}`,
});

project.buildTask.spawn(docgen);

project.addExcludeFromCleanup("docs/**");

project.synth();
