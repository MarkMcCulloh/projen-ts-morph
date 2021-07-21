import { existsSync } from "fs";
import { posix } from "path";
import * as projen from "projen";
import * as projenLib from "projen/lib";
import * as morph from "ts-morph";

export interface CreateTypescriptFileOptions {
  readonly allowChanges?: boolean;
}

export interface MorphProjectOptions {
  readonly skipAddingFilesFromTsConfig?: boolean;
  readonly tsconfigPath?: string;
  readonly manipulationSettings?: Partial<morph.ManipulationSettings>;
}

export class TypescriptMorpher extends projenLib.Component {
  public readonly tsProject: morph.Project;

  private baseDirectory: string;

  constructor(project: projen.Project, options?: MorphProjectOptions) {
    super(project);

    this.baseDirectory = project.outdir;

    let tsconfigPath;

    if (!options?.skipAddingFilesFromTsConfig) {
      tsconfigPath = options?.tsconfigPath
        ? posix.resolve(this.baseDirectory, options.tsconfigPath)
        : undefined;

      if (
        !tsconfigPath &&
        project instanceof projen.TypeScriptProject &&
        project.tsconfig &&
        existsSync(posix.resolve(project.outdir, project.tsconfig.file.path))
      ) {
        tsconfigPath = posix.resolve(
          project.outdir,
          project.tsconfig.file.path
        );
      }
    }

    this.tsProject = new morph.Project({
      skipAddingFilesFromTsConfig:
        !tsconfigPath || options?.skipAddingFilesFromTsConfig,
      tsConfigFilePath: tsconfigPath,
      manipulationSettings: {
        indentationText: morph.IndentationText.TwoSpaces,
        quoteKind: morph.QuoteKind.Single,
        ...(options?.manipulationSettings ?? {}),
      },
    });
  }

  public createTypescriptFile(
    filePath: string,
    options?: CreateTypescriptFileOptions
  ): morph.SourceFile {
    const source = this.tsProject.createSourceFile(filePath, undefined, {
      overwrite: !options?.allowChanges,
    });

    if (!options?.allowChanges) {
      this.project.annotateGenerated(filePath);
      source.insertText(0, `// ${projen.FileBase.PROJEN_MARKER}\n`);
    }

    return source;
  }

  public getTypescriptFile(filePath: string): morph.SourceFile | undefined {
    return this.tsProject.addSourceFileAtPathIfExists(
      posix.resolve(this.baseDirectory, filePath)
    );
  }

  public preSynthesize() {}

  public synthesize() {
    this.tsProject.saveSync();
  }

  public postSynthesize() {}
}
