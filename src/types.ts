import type { Context } from "@inquirer/type";
import type {
  checkbox as checkboxPrompt,
  confirm as confirmPrompt,
  editor as editorPrompt,
  expand as expandPrompt,
  input as inputPrompt,
  number as numberPrompt,
  password as passwordPrompt,
  rawlist as rawlistPrompt,
  search as searchPrompt,
  select as selectPrompt,
} from "@inquirer/prompts";

export type RecursivePromptType =
  | "input"
  | "number"
  | "confirm"
  | "select"
  | "checkbox"
  | "rawlist"
  | "expand"
  | "password"
  | "editor"
  | "search"
  | "recursive";

type MaybePromise<T> = T | Promise<T>;

type InternalQuestionKeys = "name" | "type" | "when" | "filter" | "validate";

type FlatQuestionConfig<Config> = Omit<Config, InternalQuestionKeys>;

/**
 * Defines a custom prompt plugin that can be used as a question type in recursive flows.
 */
export interface RecursivePromptPlugin<
  Type extends string = string,
  Value = unknown,
  Config = Record<string, unknown>,
> {
  name: string;
  type: Type;
  prompt: (config: Config, context?: Context) => Promise<Value>;
}

/**
 * Convenience type for internal code paths that work with any plugin shape.
 */
export type AnyRecursivePromptPlugin = RecursivePromptPlugin<string, unknown, any>;

/**
 * One loop entry result, keyed by question name.
 */
export type RecursiveAnswers = Record<string, unknown>;

/**
 * Context passed to question-level callbacks (`when`, `filter`, `validate`).
 */
export type RecursiveQuestionExecutionContext = {
  answers: RecursiveAnswers;
  depth: number;
  iteration: number;
};

/**
 * Context passed to `exitWhen`.
 * `answers` contains all entries already collected by the loop.
 */
export type RecursiveExitWhenContext = {
  answers: RecursiveAnswers[];
  depth: number;
  iteration: number;
};

type BaseRecursiveQuestion = {
  name: string;
  when?:
    | boolean
    | ((context: RecursiveQuestionExecutionContext) => MaybePromise<boolean>);
  filter?: (
    value: unknown,
    context: RecursiveQuestionExecutionContext,
  ) => MaybePromise<unknown>;
  validate?: (
    value: unknown,
    context: RecursiveQuestionExecutionContext,
  ) => MaybePromise<boolean | string>;
};

type NativeQuestion<
  Type extends Exclude<RecursivePromptType, "recursive">,
  Config extends Record<string, unknown>,
> = BaseRecursiveQuestion & {
  type: Type;
} & FlatQuestionConfig<Config>;

export type InputQuestion = NativeQuestion<"input", Parameters<typeof inputPrompt>[0]>;
export type NumberQuestion = NativeQuestion<"number", Parameters<typeof numberPrompt>[0]>;
export type ConfirmQuestion = NativeQuestion<"confirm", Parameters<typeof confirmPrompt>[0]>;
export type SelectQuestion = NativeQuestion<"select", Parameters<typeof selectPrompt>[0]>;
export type CheckboxQuestion = NativeQuestion<"checkbox", Parameters<typeof checkboxPrompt>[0]>;
export type RawlistQuestion = NativeQuestion<"rawlist", Parameters<typeof rawlistPrompt>[0]>;
export type ExpandQuestion = NativeQuestion<"expand", Parameters<typeof expandPrompt>[0]>;
export type PasswordQuestion = NativeQuestion<"password", Parameters<typeof passwordPrompt>[0]>;
export type EditorQuestion = NativeQuestion<"editor", Parameters<typeof editorPrompt>[0]>;
export type SearchQuestion = NativeQuestion<"search", Parameters<typeof searchPrompt>[0]>;

/**
 * Main options for a recursive prompt flow.
 */
export interface RecursivePromptOptions<
  Plugins extends readonly AnyRecursivePromptPlugin[] = [],
> {
  /**
   * The message to display when asking if the user wants to continue looping.
   * @default "Would you like to loop again?"
   */
  message?: string | (() => string);

  /**
   * Type of the prompt to use for asking if the user wants to continue looping: confirm or select (yes/no).
   * @default "confirm"
   */
  questionType?: "confirm" | "select";

  /**
   * Default value for the loop answer.
   * @default true
   */
  default?: boolean;

  /** Texts for the select question type options */
  options?: {
    /** The label for the "yes" option when using select question type. */
    yesLabel?: string;
    /** The label for the "no" option when using select question type. */
    noLabel?: string;
  };

  /** Shared inquirer context (streams, signal, etc.). */
  context?: Context;

  /**
   * Bypass the default recursion depth safety limit (3).
   *
   * Warning: when enabled, the prompt can recurse indefinitely and cause
   * very long sessions, memory growth, or stack/flow issues depending on
   * your question structure. Use only when your flow has a clear stop condition.
   *
   * @default false
   */
  bypassDepthLimit?: boolean;

  /**
   * Exit condition for the recursive loop.
   *
   * If true or returns true, the loop stops immediately.
   *
   * `answers` contains all answers already collected in the loop.
   *
   * @default undefined
   */
  exitWhen?:
    | boolean
    | ((context: RecursiveExitWhenContext) => MaybePromise<boolean>);

  /**
   * Inquirer plugin prompts registered by type.
   * A question can then use this type directly in prompts[].
   */
  plugins?: Plugins;

  /** List of prompts to ask recursively */
  prompts: RecursiveQuestion<Plugins>[];
}

/**
 * Options used by nested `recursive` questions.
 */
export type RecursiveNestedOptions<
  Plugins extends readonly AnyRecursivePromptPlugin[] = [],
> = Omit<RecursivePromptOptions<Plugins>, "context" | "plugins"> & {
  context?: Context;
  plugins?: Plugins;
};

/**
 * Question type that launches a nested recursive prompt flow.
 */
export type RecursiveNestedQuestion<
  Plugins extends readonly AnyRecursivePromptPlugin[] = [],
> = BaseRecursiveQuestion & {
  type: "recursive";
} & RecursiveNestedOptions<Plugins>;

type PluginQuestionFromPlugin<Plugin extends AnyRecursivePromptPlugin> =
  Plugin extends RecursivePromptPlugin<infer Type, unknown, infer Config>
    ? BaseRecursiveQuestion & {
        type: Type;
      } & FlatQuestionConfig<Config>
    : never;

/**
 * Any custom plugin question derived from the registered `plugins` tuple.
 */
export type PluginQuestion<
  Plugins extends readonly AnyRecursivePromptPlugin[] = [],
> = PluginQuestionFromPlugin<Plugins[number]>;

/**
 * Union of all supported question variants (native, recursive, and plugin-based).
 */
export type RecursiveQuestion<
  Plugins extends readonly AnyRecursivePromptPlugin[] = [],
> =
  | InputQuestion
  | NumberQuestion
  | ConfirmQuestion
  | SelectQuestion
  | CheckboxQuestion
  | RawlistQuestion
  | ExpandQuestion
  | PasswordQuestion
  | EditorQuestion
  | SearchQuestion
  | RecursiveNestedQuestion<Plugins>
  | PluginQuestion<Plugins>;
