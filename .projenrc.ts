import { FileBase, ProjectType, TextFile, TypeScriptProject } from "projen";

const project = new TypeScriptProject({
  defaultReleaseBranch: "main",
  name: "ts-morph-projen",
  authorName: "Mark McCulloh",
  authorEmail: "Mark.McCulloh@gmail.com",
  projenrcTs: true,
  peerDeps: ["projen@0.27.4", "ts-morph"],
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
});

const readmeText = `\
<!---
${FileBase.PROJEN_MARKER}
It is so unnecessary to use projen for this, but here I go anyways :)
-->

# ${project.name}
`;

new TextFile(project, "README.md", {
  lines: readmeText.split("\n"),
});

project.eslint!.addIgnorePattern("test/test_project/");

project.tasks.tryFind("docgen")!.reset("typedoc src/index.ts --out docs/");

project.synth();
