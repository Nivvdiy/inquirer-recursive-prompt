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
  TableLikeConfig
> = {
  name: "Table-like",
  type: "table-multiple",
  prompt: async () => [],
};

const validNativeOptions: RecursivePromptOptions = {
  exitWhen: ({ answers }) => answers.length > 0,
  prompts: [
    {
      name: "personName",
      type: "input",
      message: "Person name:",
    },
  ],
};

void validNativeOptions;

const validPluginOptions: RecursivePromptOptions<[typeof tableLikePlugin]> = {
  plugins: [tableLikePlugin],
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
