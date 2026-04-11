# Examples

This directory contains examples showcasing different features of `inquirer-recursive-prompt`.

## Setup

Before running the examples, make sure to build the package:

```bash
npm run build
```

## Examples

### 1. Simple (simple.ts)

Basic usage with native prompts (`input`, `select`, `number`).
Demonstrates the `when`, `filter`, and `validate` options.

**Features:**

- Collecting multiple items in a loop
- Validation with custom error messages
- Filter transformation on input

**Run:**

```bash
npx ts-node examples/simple.ts
```

### 2. Nested Recursive (nested-recursive.ts)

Using recursive prompts within recursive prompts (2-3 nesting levels).
Shows how to build hierarchical data structures.

**Features:**

- Recursive questions (type: "recursive")
- Multiple levels of nested collections
- Using select/confirm for continue prompts

**Run:**

```bash
npx ts-node examples/nested-recursive.ts
```

### 3. With Plugin (with-plugin.ts)

Using a custom Inquirer plugin (`@bartheleway/inquirer-table-multiple`).
Demonstrates how to register and use third-party prompt plugins.

**Features:**

- Plugin registration via `plugins` array
- Custom prompt type in the questions list
- Mixing native prompts with plugins

**Run:**

```bash
npx ts-node examples/with-plugin.ts
```

### 4. With Exit Condition (with-exit-condition.ts)

Using the `exitWhen` option to stop the loop based on a condition.
First asks for a max number of items, then auto-exits when that limit is reached.

**Features:**

- Prompt user for max entries (2-5) with `@inquirer/prompts` number
- Use `exitWhen` to automatically exit the recursive loop
- Accessing `iteration` context to check against the max
- Calculating totals from collected data

**Run:**

```bash
npx ts-node examples/with-exit-condition.ts
```

### 5. With Themes (with-themes.ts)

Applying Inquirer themes globally and per question, including the loop prompt.

**Features:**

- `theme` option with per-type keys (`input`, `select`, `confirm`)
- `recursivePrompt` key to style the loop continue prompt independently
- Per-question `theme` override (takes priority over global)

**Run:**

```bash
npx ts-node examples/with-themes.ts
```

### 6. With Month Revenue (with-month-revenue.ts)

A concrete end-to-end example: configure a yearly revenue forecast month by month.

**Features:**

- First question outside the loop (year selection)
- `choices` as a function filtering already-selected months via `allAnswers`
- `transformer` computing and displaying the monthly total while the user types
- `addAdditionalFields` + `setField` injecting `daysInMonth` and `monthTotal` after validation
- Yearly total computed from the accumulated results

**Run:**

```bash
npx ts-node examples/with-month-revenue.ts
```

## Common Features Across Examples

All examples demonstrate:

- **`when`**: Conditional question display based on `answers` (current iteration) and `allAnswers` (previous iterations)
- **`validate`**: Input validation with error messages
- **`filter`**: Transform user input before storing
- **`transformer`**: Display-level formatting with execution context
- **`addAdditionalFields`**: Inject computed fields after answer validation (no extra question)
- **`setField`**: Write to any answer path from any callback, supports dot notation
- **`choices` as function**: Dynamic choice lists filtered from `allAnswers`
- **`exitWhen`**: Early exit from the loop
- **Plugins**: Register custom question types
- **Recursive nesting**: Build nested structures up to 3 levels deep
- **`bypassDepthLimit`**: Override depth safety (with warning)
- **`theme`**: Global theming per prompt type and per question override

## Execution Flow

Each example:

1. Defines a `RecursivePromptOptions` object
2. Specifies a list of questions to ask repeatedly
3. Calls `recursivePrompt(options)` to start the loop
4. The user is prompted to continue after each iteration
5. Returns an array of collected answers

## Command-line Development

If you want to compile TypeScript yourself:

```bash
npx tsc examples/simple.ts --module esnext --target esnext --moduleResolution node
node examples/simple.js
```

Or use `ts-node` which handles TypeScript on the fly:

```bash
npm install -D ts-node
npx ts-node examples/simple.ts
```
