# inquirer-recursive-prompt

A TypeScript library for creating recursive prompts with [@inquirer/core](https://github.com/SBoudrias/Inquirer.js). Allows users to repeatedly answer the same set of questions in a loop with flexible conditions and custom plugin support.

## Features

- ✅ **Recursive loops**: Ask a series of questions repeatedly with a continue prompt
- ✅ **Nesting support**: Recursive prompts within recursive prompts (up to 3 levels deep)
- ✅ **Custom plugins**: Register third-party Inquirer prompts as plugins
- ✅ **Conditional questions**: Use `when`, `filter`, `validate` on individual questions
- ✅ **Early exit**: `exitWhen` option to stop the loop based on conditions
- ✅ **Type-safe**: Full TypeScript support with proper types
- ✅ **Depth safety**: Prevents infinite recursion (configurable with `bypassDepthLimit`)
- ✅ **Theming**: Global and per-question theme customization, including the loop prompt
- ✅ **Dynamic choices**: `choices` can be a function receiving execution context
- ✅ **Nested field names**: `name: "user.profile.name"` writes deeply into the result object
- ✅ **`askAnswered`**: Re-ask a question already answered in the current iteration
- ✅ **`transformer`**: Display-level transformation with full execution context
- ✅ **`addAdditionalFields`**: Enrich answers after a prompt is validated, without an extra question
- ✅ **Theming**: Global and per-question theme customization, including the loop prompt
- ✅ **Dynamic choices**: `choices` can be a function receiving execution context
- ✅ **Nested field names**: `name: "user.profile.name"` writes deeply into the result object
- ✅ **`askAnswered`**: Re-ask a question already answered in the current iteration
- ✅ **`transformer`**: Display-level transformation with full execution context
- ✅ **`addAdditionalFields`**: Enrich answers after a prompt is validated, without an extra question

## Installation

```bash
npm install inquirer-recursive-prompt @inquirer/core @inquirer/prompts
```

## Quick Start

```typescript
import { recursivePrompt } from "inquirer-recursive-prompt";

const result = await recursivePrompt({
  message: "Add another item?",
  questionType: "confirm",
  default: true,
  prompts: [
    {
      name: "itemName",
      type: "input",
      message: "Item name:",
    },
    {
      name: "itemPrice",
      type: "number",
      message: "Price:",
    },
  ],
});

console.log(result);
// Output: [
//   { itemName: "Apple", itemPrice: 1.5 },
//   { itemName: "Banana", itemPrice: 0.8 },
// ]
```

## API Reference

### `recursivePrompt(options: RecursivePromptOptions): Promise<RecursiveAnswers[]>`

Run a recursive prompt flow and return collected answers.

### `RecursivePromptOptions`

```typescript
interface RecursivePromptOptions {
  /**
   * Message when asking to continue/loop again
   * @default "Would you like to loop again?"
   */
  message?: string | (() => string);

  /**
   * Type of continue prompt: "confirm" or "select"
   * @default "confirm"
   */
  questionType?: "confirm" | "select";

  /**
   * Default value for continue prompt
   * @default true
   */
  default?: boolean;

  /**
   * Labels for select-type continue prompt
   */
  options?: {
    yesLabel?: string;
    noLabel?: string;
  };

  /**
   * Exit condition - if true, loop stops immediately
   */
  exitWhen?:
    | boolean
    | ((context: RecursiveExitWhenContext) => Promise<boolean> | boolean);

  /**
   * Bypass recursion depth limit (3 levels) with warning
   * @default false
   */
  bypassDepthLimit?: boolean;

  /**
   * Registered custom prompt plugins
   */
  plugins?: RecursivePromptPlugin[];

  /**
   * List of questions to ask recursively
   */
  prompts: RecursiveQuestion[];
}
```

### Question Options

Each question in the `prompts` array can include:

```typescript
{
  // Required
  name: string;             // Field name in results. Supports dot notation: "user.profile.name"
  type: RecursivePromptType; // "input", "select", "number", etc.

  // Native Inquirer options are directly on the question object (flat API)
  message?: string;
  theme?: PartialDeep<Theme>; // Per-question theme override

  // Lifecycle callbacks (all receive RecursiveQuestionExecutionContext)
  when?: boolean | ((context) => Promise<boolean> | boolean);
  filter?: (value, context) => Promise<unknown> | unknown;
  validate?: (value, context) => Promise<boolean | string> | boolean | string;
  transformer?: (value, context, flags?) => string;

  // Post-answer hook: runs after the answer is stored, no return value
  addAdditionalFields?: (value, context) => Promise<void> | void;

  // Re-ask even if this name is already answered in the current iteration
  askAnswered?: boolean;

  // Dynamic choices: resolved before displaying the prompt
  choices?: Choice[] | ((context) => Promise<Choice[]> | Choice[]);
}
```

### Execution Context

Available in `when`, `filter`, `validate`, `transformer`, and `addAdditionalFields` callbacks:

```typescript
{
  answers: Record<string, unknown>; // Answers collected in the current iteration
  allAnswers: RecursiveAnswers[];   // All iterations already completed
  depth: number;                   // Recursion depth (starts at 1)
  iteration: number;               // Current iteration number
  setField: (path: string, value: unknown) => void; // Write a field by path (supports dot notation)
}
```

### ExitWhen Context

Available in `exitWhen` callback:

```typescript
{
  answers: RecursiveAnswers[]; // All loop entries already collected
  depth: number; // Recursion depth (starts at 1)
  iteration: number; // Current iteration number
}
```

## Examples

| Example | Script | Description |
|---|---|---|
| [simple.ts](examples/simple.ts) | `npm run example:simple` | Basic loop with `input`, `select`, `number` |
| [nested-recursive.ts](examples/nested-recursive.ts) | `npm run example:nested` | Nested recursive prompts |
| [with-plugin.ts](examples/with-plugin.ts) | `npm run example:plugin` | Custom Inquirer plugin registration |
| [with-exit-condition.ts](examples/with-exit-condition.ts) | `npm run example:exit` | `exitWhen` based on a user-defined limit |
| [with-themes.ts](examples/with-themes.ts) | `npm run example:themes` | Global and per-question theming, `recursivePrompt` loop theme |
| [with-month-revenue.ts](examples/with-month-revenue.ts) | `npm run example:months` | Dynamic choices, `transformer`, `addAdditionalFields`, `setField` |

## Advanced Features

### Theming

Apply Inquirer themes globally by prompt type. The `recursivePrompt` key styles the built-in loop prompt (confirm/select) independently.

```typescript
const result = await recursivePrompt({
  theme: {
    input: {
      validationFailureMode: "keep",
    },
    select: {
      icon: { cursor: "❯" },
      indexMode: "number",
    },
    recursivePrompt: {
      style: {
        message: (text) => "\x1b[31m" + text + "\x1b[0m", // red
        answer: (text) => "\x1b[32m" + text + "\x1b[0m",  // green
      },
    },
  },
  prompts: [...],
});
```

Per-question `theme` overrides global values for that prompt only:

```typescript
{
  name: "priority",
  type: "select",
  message: "Priority:",
  choices: [...],
  theme: { icon: { cursor: "▶" } }, // overrides global select cursor
}
```

#### Plugin themes

Declare theme keys on a plugin with the 4th generic, then use them via `theme["plugin-type"]`:

```typescript
const myPlugin: RecursivePromptPlugin<
  "my-plugin",
  Value,
  Config,
  { border?: string; headerColor?: string }  // 4th generic = theme shape
> = {
  name: "My plugin",
  type: "my-plugin",
  prompt: myPluginFn,
  themes: { border: "single", headerColor: "cyan" },
};

const options: RecursivePromptOptions<[typeof myPlugin]> = {
  plugins: [myPlugin],
  theme: {
    "my-plugin": { border: "double" }, // TypeScript validates the keys
  },
  prompts: [...],
};
```

### Dynamic Choices

`choices` can be a function receiving the execution context. Useful for filtering already-selected items across iterations:

```typescript
{
  name: "month",
  type: "select",
  message: "Choose a month:",
  choices: ({ allAnswers }) => {
    const used = new Set(allAnswers.map((a) => a.month));
    return ALL_MONTHS.filter((m) => !used.has(m.value));
  },
}
```

### Nested Field Names

Use dot notation in `name` to write nested objects:

```typescript
{
  name: "user.profile.name",
  type: "input",
  message: "Your name:",
}
// Result: { user: { profile: { name: "Alice" } } }
```

### `askAnswered`

By default, if two questions share the same `name` in one iteration, only the first is asked. Set `askAnswered: true` to force re-asking:

```typescript
{
  name: "confirm",
  type: "input",
  message: "Confirm value:",
  askAnswered: true,
}
```

### `transformer`

Display a formatted string while the user types, without altering the stored value. Receives the full execution context:

```typescript
{
  name: "dailyRevenue",
  type: "input",
  message: "Daily revenue:",
  transformer: (value, { answers }) => {
    const days = getDaysInMonth(answers.month);
    return `${value} / day → ${Number(value) * days} total`;
  },
}
```

### `addAdditionalFields`

Runs after the answer is stored. Use it to compute and inject extra fields into the current iteration answers without asking additional questions:

```typescript
{
  name: "dailyRevenue",
  type: "input",
  message: "Daily revenue:",
  filter: (value) => Number(value),
  addAdditionalFields: (value, { answers, setField }) => {
    const days = getDaysInMonth(answers.month);
    setField("daysInMonth", days);
    setField("monthTotal", Number(value) * days);
  },
}
// Result includes: { dailyRevenue, daysInMonth, monthTotal }
```

`setField(path, value)` supports dot notation and is equivalent to writing `answers.key = value`.

### Custom Plugins

Register a custom Inquirer prompt as a plugin:

```typescript
import tableMultiple from "@bartheleway/inquirer-table-multiple";
import type { RecursivePromptOptions, RecursivePromptPlugin } from "inquirer-recursive-prompt";

type TableMultipleConfig = Parameters<typeof tableMultiple>[0];

const tableMultiplePlugin: RecursivePromptPlugin<
  "table-multiple",
  unknown,
  TableMultipleConfig
> = {
  name: "Table Multiple",
  type: "table-multiple",
  prompt: tableMultiple,
};

const options: RecursivePromptOptions<[typeof tableMultiplePlugin]> = {
  plugins: [tableMultiplePlugin],
  prompts: [...],
};
```

Then use it in prompts:

```typescript
{
  name: "selectedItems",
  type: "table-multiple",  // Matches the registered plugin type
  message: "Select items:",
  choices: [...],
}
```

### Conditional Questions

Skip questions based on current iteration answers or all previous iterations:

```typescript
{
  name: "email",
  type: "input",
  message: "Email:",
  when: ({ answers, allAnswers }) =>
    answers.wantEmail === true && allAnswers.length < 3,
}
```

### Input Transformation

Transform user input before storing:

```typescript
{
  name: "quantity",
  type: "number",
  message: "Quantity:",
  filter: (value) => Math.max(1, Number(value)),
}
```

### Validation with Custom Messages

Validate input with contextual error messages:

```typescript
{
  name: "username",
  type: "input",
  message: "Username:",
  validate: (value, { iteration }) =>
    String(value).length > 3 || `Username too short (iteration ${iteration})`,
}
```

### Exit on Condition

Stop the loop when a condition is met:

```typescript
const result = await recursivePrompt({
  prompts: [...],
  // answers is the full list of already collected loop answers
  exitWhen: ({ iteration, answers }) =>
    iteration >= 5 || answers.length >= 3,
});
```

## Type Safety

Recursive prompts for nested data:

```typescript
{
  name: "skills",
  type: "recursive",
  message: "Add another skill?",
  prompts: [
    { name: "skillName", type: "input", message: "Name:" },
    { name: "level", type: "select", message: "Level:", choices: [...] },
  ],
}
```

The `skills` answer will be an array of collected skill objects.

## Depth Limits

By default, recursive nesting is limited to 3 levels to prevent accidental infinite loops.

Override with caution:

```typescript
const result = await recursivePrompt({
  prompts: [...],
  bypassDepthLimit: true,  // ⚠️ Warning printed to console
});
```

## Error Handling

### Plugin Validation

Duplicate plugin types or functions throw an error:

```typescript
// This will throw:
plugins: [
  { type: "myPlugin", ... },
  { type: "myPlugin", ... },  // ❌ Duplicate type
]
```

Reserved types (`input`, `select`, etc.) cannot be overridden.

## License

MIT - See LICENSE file

## Contributing

Contributions welcome! Please open issues and pull requests on [GitHub](https://github.com/Nivvdiy/inquirer-recursive-prompt).
