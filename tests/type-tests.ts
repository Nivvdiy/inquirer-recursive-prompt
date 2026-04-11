import type { RecursivePromptOptions, RecursivePromptPlugin } from "../src/types.js";

type TableLikeConfig = {
  message: string;
  columns: { title: string; value: string }[];
  rows: { title: string; value: string }[];
  multiple?: boolean;
};

const tableLikePlugin: RecursivePromptPlugin<
  "table-multiple",
  unknown,
  TableLikeConfig,
  {
    border?: boolean;
    headerColor?: string;
  }
> = {
  name: "Table-like",
  type: "table-multiple",
  prompt: async () => [],
  themes: {
    border: true,
    headerColor: "cyan",
  },
};

const validNativeOptions: RecursivePromptOptions = {
  theme: {
    recursivePrompt: {
      prefix: {
        idle: "?",
      },
      icon: {
        cursor: ">",
      },
    },
  },
  exitWhen: ({ answers }) => answers.length > 0,
  prompts: [
    {
      name: "personName",
      type: "input",
      message: "Person name:",
      askAnswered: false,
      when: ({ allAnswers, setField }) => {
        setField("meta.count", allAnswers.length);
        return allAnswers.length >= 0;
      },
    },
  ],
};

void validNativeOptions;

const validPluginOptions: RecursivePromptOptions<[typeof tableLikePlugin]> = {
  plugins: [tableLikePlugin],
  theme: {
    input: {
      prefix: {
        idle: "?",
      },
    },
    "table-multiple": {
      border: true,
    },
  },
  prompts: [
    {
      name: "skillRatings",
      type: "table-multiple",
      message: "Rate your skills:",
      columns: [{ title: "Beginner", value: "beginner" }],
      rows: [{ title: "JavaScript", value: "javascript" }],
      multiple: false,
    },
  ],
};

void validPluginOptions;

const invalidNativeOptions: RecursivePromptOptions = {
  prompts: [
    {
      name: "personName",
      type: "input",
      message: "Person name:",
      // @ts-expect-error unknown field for input prompt must be rejected
      whatever: "invalid",
    },
    {
      name: "legacy",
      type: "input",
      // @ts-expect-error legacy config object should be rejected
      config: { message: "legacy" },
    },
  ],
};

void invalidNativeOptions;

const invalidPluginOptions: RecursivePromptOptions<[typeof tableLikePlugin]> = {
  plugins: [tableLikePlugin],
  prompts: [
    {
      name: "skillRatings",
      type: "table-multiple",
      message: "Rate your skills:",
      columns: [{ title: "Beginner", value: "beginner" }],
      rows: [{ title: "JavaScript", value: "javascript" }],
      // @ts-expect-error unknown field for plugin config must be rejected
      tree: false,
    },
    {
      name: "unknownPluginType",
      // @ts-expect-error plugin type must be one of registered plugin types
      type: "not-registered-plugin",
      message: "x",
    },
    {
      name: "nested",
      type: "recursive",
      message: "Nested",
      prompts: [
        {
          name: "nestedItem",
          type: "table-multiple",
          message: "Nested table",
          columns: [{ title: "Beginner", value: "beginner" }],
          rows: [{ title: "JS", value: "javascript" }],
          // @ts-expect-error nested plugin question must also reject unknown field
          tree: true,
        },
      ],
    },
  ],
};

void invalidPluginOptions;

const invalidThemeShapeForPlugin: RecursivePromptOptions<[typeof tableLikePlugin]> = {
  plugins: [tableLikePlugin],
  theme: {
    // @ts-expect-error unknown plugin theme key must be rejected
    "table-multiple": { tree: true },
  },
  prompts: [
    {
      name: "skillRatings",
      type: "table-multiple",
      message: "Rate your skills:",
      columns: [{ title: "Beginner", value: "beginner" }],
      rows: [{ title: "JavaScript", value: "javascript" }],
    },
  ],
};

void invalidThemeShapeForPlugin;

const invalidRecursivePromptThemeShape: RecursivePromptOptions = {
  theme: {
    recursivePrompt: {
      // @ts-expect-error unknown key for recursivePrompt theme must be rejected
      unknown: true,
    },
  },
  prompts: [
    {
      name: "value",
      type: "input",
      message: "v",
    },
  ],
};

void invalidRecursivePromptThemeShape;

const invalidExitWhenContext: RecursivePromptOptions = {
  exitWhen: ({ answers }) => {
    // @ts-expect-error answers is an array in exitWhen context
    return answers.anything === true;
  },
  prompts: [
    {
      name: "value",
      type: "input",
      message: "v",
    },
  ],
};

void invalidExitWhenContext;

const invalidQuestionContextAnswersType: RecursivePromptOptions = {
  prompts: [
    {
      name: "value",
      type: "input",
      message: "v",
      when: ({ allAnswers }) => {
        // @ts-expect-error allAnswers is an array, not an object map
        return allAnswers.anything === true;
      },
    },
  ],
};

void invalidQuestionContextAnswersType;
