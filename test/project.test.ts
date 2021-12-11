import { readFileSync, writeFileSync } from "fs";
import { TypeScriptProject } from "projen/lib/typescript";
import { TypescriptMorpher } from "./../src/index";

test("create project", () => {
  process.env.PROJEN_DISABLE_POST = "true";
  const project = new TypeScriptProject({
    defaultReleaseBranch: "test",
    name: "test",
    outdir: "test/test_project",
  });

  const dummyFile = `\
export class Hello {
  public sayHello() {
    return 'hello, ____!';
  }
}`;

  writeFileSync("test/test_project/dummy.ts", dummyFile);

  const tsMorpher = new TypescriptMorpher(project);
  const tsFile = tsMorpher.createTypescriptFile("src/cool.ts");

  tsFile.addClass({ name: "MyClass", isExported: true });
  const otherSource = tsMorpher.getTypescriptFileOrThrow("dummy.ts");

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
