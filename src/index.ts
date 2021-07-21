import { existsSync } from "fs";
import { posix } from "path";
import * as projen from "projen";
import * as projenLib from "projen/lib";
import * as morph from "ts-morph";

/**
 * Options when creating typescript file
 */
export interface CreateTypescriptFileOptions {
  /**
   * Is file readonly. If so, will add projen marker and "generated" gitattribute
   * @default true - File will be considered readonly
   */
  readonly readonly?: boolean;

  /**
   * Can file be overwritten by this component if already exists
   * @default true - File may overwritten without error
   */
  readonly overwrite?: boolean;
}

/**
 * Customization for ts-morph project
 */
export interface MorphProjectOptions {
  /**
   * Skip adding files from tsconfig to ts-morph
   * @default false - files will be added from tsconfig
   */
  readonly skipAddingFilesFromTsConfig?: boolean;

  /**
   * Path to custom tsconfig
   * @default the tsconfig.json from the project base dir is used
   */
  readonly tsconfigPath?: string;

  /**
   * These settings are used during synthesis to customize various sylistic
   * features of codegen
   */
  readonly manipulationSettings?: Partial<morph.ManipulationSettings>;
}

/**
 * A component that wraps around ts-morph to be create/modify typescript files
 */
export class TypescriptMorpher extends projenLib.Component {
  /** ts-morph project */
  public readonly tsProject: morph.Project;

  private baseDirectory: string;

  /**
   * Initializes a ts-morph project inside a given Projen project
   * @param project Projen project
   * @param options Customization for ts-morph project
   */
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
        existsSync(posix.join(project.outdir, project.tsconfig.file.path))
      ) {
        tsconfigPath = posix.join(project.outdir, project.tsconfig.file.path);
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

  /**
   * Create a Typescript file.
   * @param filePath path to create new typescript file at, relative to project root
   * @param options Behavior of created file
   * @returns A new Typescript source
   */
  public createTypescriptFile(
    filePath: string,
    options?: CreateTypescriptFileOptions
  ): morph.SourceFile {
    let newPath = posix.join(this.baseDirectory, filePath);

    const source = this.tsProject.createSourceFile(newPath, undefined, {
      overwrite: options?.overwrite ?? true,
    });

    if (options?.readonly) {
      this.project.annotateGenerated(newPath);
      source.insertText(0, `// ${projen.FileBase.PROJEN_MARKER}\n`);
    }

    return source;
  }

  /**
   * Create a "sample" Typescript file.
   * This file will only be generated once during the initial "projen new" command
   * @param filePath
   * @returns a Typescript file if created during project creation, otherwise undefined
   */
  public createSampleTypescriptFile(
    filePath: string
  ): morph.SourceFile | undefined {
    if (this.project.newProject) {
      return this.createTypescriptFile(filePath, {
        readonly: false,
        overwrite: true,
      });
    }

    return undefined;
  }

  /**
   * Gets an existing Typescript source file
   * @param filePath path to existing typescript file, relative to project root
   * @returns Typescript source file
   */
  public getTypescriptFile(filePath: string): morph.SourceFile | undefined {
    return this.tsProject.addSourceFileAtPathIfExists(
      posix.join(this.baseDirectory, filePath)
    );
  }

  /**
   * Gets an existing Typescript source file (Throws if not found)
   * @param filePath path to existing typescript file, relative to project root
   * @returns Typescript source file
   * @throws FileNotFoundError when the file is not found.
   */
  public getTypescriptFileOrThrow(filePath: string): morph.SourceFile {
    return this.tsProject.addSourceFileAtPath(
      posix.join(this.baseDirectory, filePath)
    );
  }

  public synthesize() {
    this.tsProject.saveSync();
  }
}
