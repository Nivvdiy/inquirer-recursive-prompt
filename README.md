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
  name: string;                    // Field name in results
  type: RecursivePromptType;       // "input", "select", "number", etc.
  // Native Inquirer options are directly on the question object
  message?: string;

  // Optional:
  when?: boolean | ((context) => Promise<boolean> | boolean);
  filter?: (value, context) => Promise<unknown> | unknown;
  validate?: (value, context) => Promise<boolean | string> | boolean | string;
}
```

### Execution Context

Available in `when`, `filter`, `validate` callbacks:

```typescript
{
  answers: Record<string, unknown>; // Answers from current iteration
  depth: number; // Recursion depth (starts at 1)
  iteration: number; // Current iteration number
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

### Basic Usage

See [examples/simple.ts](examples/simple.ts) for a complete example of collecting items with validation.

### Nested Recursion

See [examples/nested-recursive.ts](examples/nested-recursive.ts) for using recursive prompts within recursive prompts.

### Custom Plugin

See [examples/with-plugin.ts](examples/with-plugin.ts) for integrating a third-party Inquirer plugin.

## Advanced Features

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

Skip questions based on previous answers:

```typescript
{
  name: "email",
  type: "input",
  message: "Email:",
  when: ({ answers }) => answers.wantEmail === true,
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
