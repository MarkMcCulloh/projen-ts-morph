import { TypeScriptProject } from "projen";
import { TypescriptFile } from "./../src/index";

test("create project", () => {
  process.env.PROJEN_DISABLE_POST = "true";
  const project = new TypeScriptProject({
    defaultReleaseBranch: "test",
    name: "test",
    outdir: "test/test_project",
  });

  const tsFile = new TypescriptFile(project, "src/cool.ts");
  tsFile.source.addClass({ name: "MyClass", isExported: true });

  const otherSource = tsFile.tsProject.getSourceFileOrThrow(
    "test/test_project/src/index.ts"
  );

  otherSource
    .getClassOrThrow("Hello")
    .getMethodOrThrow("sayHello")
    .setBodyText("return 'hello, world!';");

  project.synth();
});
