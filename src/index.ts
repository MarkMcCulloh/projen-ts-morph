import { resolve } from "path";
import * as projen from "projen";
import * as projenLib from "projen/lib";
import * as morph from "ts-morph";

// function parseESLintFile(rules: any): morph.ManipulationSettings {
//   if(rules) {
//     const indentRule = rules["@typescript-eslint/indent"]
//   }
//   return {
//     indentSize: rules["@typescript-eslint/indent"][1],
//     quoteType: rules.quotes[1],
//   };
// }

/**
 * Options for the TypescriptFile object.
 */
export interface TypescriptFileOptions {
  readonly allowChanges?: boolean;
}
export class TypescriptFile extends projenLib.Component {
  public static UseProjectTSConfig: boolean = true;

  public static setManipulationSettings(
    settings: Partial<morph.ManipulationSettings>
  ) {
    this._tsProject.manipulationSettings.set(settings);
  }

  public static addFilesFromTSConfig(tsconfigPath: string) {
    TypescriptFile._tsProject.addSourceFilesFromTsConfig(tsconfigPath);
  }

  public static addExistingSourceFiles(...files: string[]) {
    TypescriptFile._tsProject.addSourceFilesAtPaths(files);
  }

  private static _tsProject: morph.Project = new morph.Project({
    skipAddingFilesFromTsConfig: true,
    manipulationSettings: {},
  });
  private static _projectHasBeenSaved: boolean = false;
  private static _tsconfigHasBeenLoaded: boolean = false;

  public source: morph.SourceFile;
  public filePath: string;
  public allowChanges: boolean;
  get tsProject(): morph.Project {
    return TypescriptFile._tsProject;
  }

  /**
   * Creates a new TypescriptFile object
   * @param project - the project to tie this file to.
   * @param filePath - the relative path in the project to put the file
   */
  constructor(
    project: projen.Project,
    filePath: string,
    options?: TypescriptFileOptions
  ) {
    super(project);

    this.allowChanges = !!options?.allowChanges;
    this.filePath = resolve(project.outdir, filePath);

    if (
      !TypescriptFile._tsconfigHasBeenLoaded &&
      TypescriptFile.UseProjectTSConfig &&
      project instanceof projen.TypeScriptProject &&
      project.tsconfig
    ) {
      TypescriptFile._tsProject.addSourceFilesFromTsConfig(
        resolve(project.outdir, project.tsconfig.file.path)
      );

      TypescriptFile._tsconfigHasBeenLoaded = true;
    }

    this.source = TypescriptFile._tsProject.createSourceFile(
      this.filePath,
      undefined,
      { overwrite: !this.allowChanges }
    );
  }

  public preSynthesize() {
    if (!this.allowChanges) {
      // Where did this go??
      this.project.annotateGenerated(this.filePath);
      this.source.insertText(0, `// ${projen.FileBase.PROJEN_MARKER}\n`);
    }
  }

  public synthesize() {
    if (!TypescriptFile._projectHasBeenSaved) {
      TypescriptFile._projectHasBeenSaved = true;
      TypescriptFile._tsProject.saveSync();
    }
  }

  public postSynthesize() {}
}
