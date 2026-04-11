import { createPrompt, useEffect, usePrefix, useState } from "@inquirer/core";
import {
  checkbox,
  confirm,
  editor,
  expand,
  input,
  number,
  password,
  rawlist,
  search,
  select,
} from "@inquirer/prompts";
import {
  type AnyRecursivePromptPlugin,
  type RecursiveExitWhenContext,
  type RecursiveAnswers,
  type RecursiveNestedOptions,
  type RecursivePromptOptions,
  type RecursiveQuestion,
  type RecursiveQuestionExecutionContext,
} from "./types";

const DEFAULT_CONTINUE_MESSAGE = "Would you like to loop again?";
const MAX_RECURSIVE_DEPTH = 3;
const RESERVED_TYPES = new Set([
  "input",
  "number",
  "confirm",
  "select",
  "checkbox",
  "rawlist",
  "expand",
  "password",
  "editor",
  "search",
  "recursive",
]);
let hasWarnedDepthBypass = false;
const INTERNAL_QUESTION_KEYS = new Set([
  "name",
  "type",
  "when",
  "filter",
  "validate",
]);

function extractPromptConfig(
  question: RecursiveQuestion<readonly AnyRecursivePromptPlugin[]>,
): Record<string, unknown> {
  const config: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(question)) {
    if (INTERNAL_QUESTION_KEYS.has(key)) {
      continue;
    }

    config[key] = value;
  }

  return config;
}

function warnDepthBypassOnce(): void {
  if (hasWarnedDepthBypass) {
    return;
  }

  hasWarnedDepthBypass = true;
  console.warn(
    "[inquirer-recursive-prompt] bypassDepthLimit is enabled: recursion depth limit is disabled. Ensure your flow has a stop condition.",
  );
}

function validatePlugins(
  plugins: readonly AnyRecursivePromptPlugin[] | undefined,
): void {
  if (!plugins || plugins.length === 0) {
    return;
  }

  const seenTypes = new Set<string>();
  const seenFunctions = new WeakSet<Function>();

  for (const plugin of plugins) {
    if (RESERVED_TYPES.has(plugin.type)) {
      throw new Error(
        `Plugin type "${plugin.type}" is reserved by inquirer-recursive-prompt.`,
      );
    }

    if (seenTypes.has(plugin.type)) {
      throw new Error(
        `Duplicate plugin type registered: "${plugin.type}". Each plugin type must be unique.`,
      );
    }

    if (seenFunctions.has(plugin.prompt)) {
      throw new Error(
        `Duplicate plugin function registered for type "${plugin.type}". Each plugin function must be unique.`,
      );
    }

    seenTypes.add(plugin.type);
    seenFunctions.add(plugin.prompt);
  }
}

function resolveContinueMessage(message?: string | (() => string)): string {
  if (typeof message === "function") {
    return message();
  }

  return message ?? DEFAULT_CONTINUE_MESSAGE;
}

async function askOneQuestion<Plugins extends readonly AnyRecursivePromptPlugin[]>(
  question: RecursiveQuestion<Plugins>,
  plugins: Plugins | undefined,
  context: RecursivePromptOptions["context"],
  depth: number,
): Promise<unknown> {
  const promptConfig = extractPromptConfig(
    question as RecursiveQuestion<readonly AnyRecursivePromptPlugin[]>,
  );

  switch (question.type) {
    case "input":
      return input(promptConfig as Parameters<typeof input>[0], context);
    case "number":
      return number(promptConfig as Parameters<typeof number>[0], context);
    case "confirm":
      return confirm(promptConfig as Parameters<typeof confirm>[0], context);
    case "select":
      return select(promptConfig as Parameters<typeof select>[0], context);
    case "checkbox":
      return checkbox(promptConfig as Parameters<typeof checkbox>[0], context);
    case "rawlist":
      return rawlist(promptConfig as Parameters<typeof rawlist>[0], context);
    case "expand":
      return expand(promptConfig as Parameters<typeof expand>[0], context);
    case "password":
      return password(promptConfig as Parameters<typeof password>[0], context);
    case "editor":
      return editor(promptConfig as Parameters<typeof editor>[0], context);
    case "search":
      return search(promptConfig as Parameters<typeof search>[0], context);
    case "recursive": {
      const nestedConfig = promptConfig as RecursiveNestedOptions<Plugins>;

      return recursivePromptWithDepth(
        {
          ...nestedConfig,
          context: nestedConfig.context ?? context,
          plugins: nestedConfig.plugins ?? plugins,
        },
        depth + 1,
      );
    }
    default: {
      const plugin = plugins?.find((entry) => entry.type === question.type);

      if (!plugin) {
        throw new Error(
          `Unknown question type "${question.type}". Register it in options.plugins.`,
        );
      }

      return plugin.prompt(promptConfig, context);
    }
  }
}

async function shouldAskQuestion<Plugins extends readonly AnyRecursivePromptPlugin[]>(
  question: RecursiveQuestion<Plugins>,
  executionContext: RecursiveQuestionExecutionContext,
): Promise<boolean> {
  if (typeof question.when === "function") {
    return question.when(executionContext);
  }

  return question.when ?? true;
}

async function applyQuestionFilter<Plugins extends readonly AnyRecursivePromptPlugin[]>(
  question: RecursiveQuestion<Plugins>,
  value: unknown,
  executionContext: RecursiveQuestionExecutionContext,
): Promise<unknown> {
  if (!question.filter) {
    return value;
  }

  return question.filter(value, executionContext);
}

async function validateQuestionAnswer<Plugins extends readonly AnyRecursivePromptPlugin[]>(
  question: RecursiveQuestion<Plugins>,
  value: unknown,
  executionContext: RecursiveQuestionExecutionContext,
): Promise<void> {
  if (!question.validate) {
    return;
  }

  const validationResult = await question.validate(value, executionContext);

  if (validationResult === true) {
    return;
  }

  if (typeof validationResult === "string") {
    throw new Error(validationResult);
  }

  throw new Error(`Validation failed for question "${question.name}".`);
}

async function shouldExitRecursiveLoop<
  Plugins extends readonly AnyRecursivePromptPlugin[],
>(
  options: RecursivePromptOptions<Plugins>,
  executionContext: RecursiveExitWhenContext,
): Promise<boolean> {
  if (typeof options.exitWhen === "function") {
    return options.exitWhen(executionContext);
  }

  return options.exitWhen ?? false;
}

async function shouldContinue(
  options: Pick<
    RecursivePromptOptions<readonly AnyRecursivePromptPlugin[]>,
    "message" | "default" | "questionType" | "options" | "context"
  >,
): Promise<boolean> {
  const message = resolveContinueMessage(options.message);
  const defaultValue = options.default ?? true;
  const questionType = options.questionType ?? "confirm";
  const context = options.context;

  if (questionType === "select") {
    const yesLabel = options.options?.yesLabel ?? "Yes";
    const noLabel = options.options?.noLabel ?? "No";

    return select<boolean>(
      {
        message,
        default: defaultValue,
        choices: [
          { name: yesLabel, value: true },
          { name: noLabel, value: false },
        ],
      },
      context,
    );
  }

  return confirm(
    {
      message,
      default: defaultValue,
    },
    context,
  );
}

async function recursivePromptWithDepth<
  Plugins extends readonly AnyRecursivePromptPlugin[],
>(
  options: RecursivePromptOptions<Plugins>,
  depth: number,
): Promise<RecursiveAnswers[]> {
  validatePlugins(options.plugins);

  if (options.bypassDepthLimit) {
    warnDepthBypassOnce();
  } else if (depth > MAX_RECURSIVE_DEPTH) {
    throw new Error(
      `Maximum recursive depth (${MAX_RECURSIVE_DEPTH}) exceeded.`,
    );
  }

  if (!options.prompts.length) {
    throw new Error("The prompts list cannot be empty.");
  }

  const collectedAnswers: RecursiveAnswers[] = [];
  let continueLoop = true;

  while (continueLoop) {
    const currentAnswers: RecursiveAnswers = {};
    const iteration = collectedAnswers.length + 1;

    const executionContext: RecursiveExitWhenContext = {
      answers: collectedAnswers,
      depth,
      iteration,
    };

    if (await shouldExitRecursiveLoop(options, executionContext)) {
      break;
    }

    for (const question of options.prompts) {
      const questionContext: RecursiveQuestionExecutionContext = {
        answers: currentAnswers,
        depth,
        iteration,
      };

      if (!(await shouldAskQuestion(question, questionContext))) {
        continue;
      }

      const rawValue = await askOneQuestion(
        question,
        options.plugins,
        options.context,
        depth,
      );
      const filteredValue = await applyQuestionFilter(
        question,
        rawValue,
        questionContext,
      );

      await validateQuestionAnswer(question, filteredValue, questionContext);
      currentAnswers[question.name] = filteredValue;
    }

    collectedAnswers.push(currentAnswers);

    // Check exit condition AFTER adding to collectedAnswers but BEFORE asking to continue
    const postAddContext: RecursiveExitWhenContext = {
      answers: collectedAnswers,
      depth,
      iteration: collectedAnswers.length,
    };

    if (await shouldExitRecursiveLoop(options, postAddContext)) {
      break;
    }

    continueLoop = await shouldContinue(options);
  }

  return collectedAnswers;
}

/**
 * Runs a recursive prompt flow and returns every collected loop entry.
 */
export async function recursivePrompt<
  Plugins extends readonly AnyRecursivePromptPlugin[],
>(
  options: RecursivePromptOptions<Plugins>,
): Promise<RecursiveAnswers[]> {
  return recursivePromptWithDepth(options, 1);
}

/**
 * Inquirer core-compatible prompt created with `createPrompt`.
 *
 * Use this export when integrating with `@inquirer/core` APIs directly.
 */
export const recursivePromptCore = createPrompt<
  RecursiveAnswers[],
  RecursivePromptOptions<readonly AnyRecursivePromptPlugin[]>
>((config, done) => {
  if (!config.prompts.length) {
    throw new Error("The prompts list cannot be empty.");
  }

  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const prefix = usePrefix({ status });

  useEffect(() => {
    let isMounted = true;

    setStatus("loading");

    void (async () => {
      try {
        const answers = await recursivePrompt(config);

        if (!isMounted) {
          return;
        }

        setStatus("done");
        done(answers);
      } catch (caught) {
        if (!isMounted) {
          return;
        }

        const message =
          caught instanceof Error
            ? caught.message
            : "Unknown recursive prompt error.";

        setStatus("done");
        setError(message);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  if (error) {
    return [`${prefix} Running recursive prompt flow`, `Error: ${error}`];
  }

  return `${prefix} Running recursive prompt flow`;
});

/**
 * Default export alias for `recursivePromptCore`.
 */
export default recursivePromptCore;
