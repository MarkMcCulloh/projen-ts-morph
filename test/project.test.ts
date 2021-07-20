import { readFileSync, writeFileSync } from "fs";
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

  const dummyFile = `\
export class Hello {
  public sayHello() {
    return 'hello, ____!';
  }
}`;

  writeFileSync("test/test_project/dummy.ts", dummyFile);

  const otherSource = tsFile.tsProject.addSourceFileAtPath(
    "test/test_project/dummy.ts"
  );

  otherSource
    .getClassOrThrow("Hello")
    .getMethodOrThrow("sayHello")
    .setBodyText("return 'hello, world!';");

  project.synth();

  expect(readFileSync("test/test_project/dummy.ts", { encoding: "utf8" }))
    .toBe(`\
export class Hello {
  public sayHello() {
    return 'hello, world!';
  }
}`);
});
