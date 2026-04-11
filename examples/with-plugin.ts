/**
 * Plugin example: Using a custom Inquirer plugin
 * Uses @bartheleway/inquirer-table-multiple as a registered plugin
 */

import { recursivePrompt } from "../dist/index.js";
import tableMultiple from "@bartheleway/inquirer-table-multiple";
import type { RecursivePromptOptions, RecursivePromptPlugin } from "../dist/types.js";

type TableMultipleConfig = Parameters<typeof tableMultiple>[0];
type TableMultipleValue = Awaited<ReturnType<typeof tableMultiple>>;

/**
 * Register @bartheleway/inquirer-table-multiple as a custom plugin
 * This plugin allows selecting from a table with columns and rows
 */
const tableMultiplePlugin: RecursivePromptPlugin<
  "table-multiple",
  TableMultipleValue,
  TableMultipleConfig
> = {
  name: "Table Multiple Selection",
  type: "table-multiple",
  prompt: tableMultiple,
};

async function runPluginExample(): Promise<void> {
  const options: RecursivePromptOptions<[typeof tableMultiplePlugin]> = {
    message: "Add another assessment ?",
    questionType: "confirm",
    default: true,
    plugins: [tableMultiplePlugin],
    prompts: [
      {
        name: "personName",
        type: "input",
        message: "Person name:",
        validate: (value) => {
          const str = String(value).trim();
          return str.length > 0 || "Name cannot be empty";
        },
      },
      {
        name: "skillRatings",
        type: "table-multiple",
        message: "Rate your skills:",
        columns: [
          { title: "Beginner", value: "beginner" },
          { title: "Intermediate", value: "intermediate" },
          { title: "Expert", value: "expert" },
        ],
        rows: [
          { value: "javascript", title: "JavaScript" },
          { value: "typescript", title: "TypeScript" },
          { value: "nodejs", title: "Node.js" },
          { value: "react", title: "React" },
          { value: "database", title: "Database Design" },
        ],
        multiple: false,
      },
    ],
  };

  try {
    const result = await recursivePrompt(options);
    console.log("\n=== Assessments collected ===");
    result.forEach((item, idx) => {
      console.log(`\nAssessment ${idx + 1}:`);
      console.log(`  Person: ${item.personName}`);
      console.log(
        `  Ratings: ${JSON.stringify(item.skillRatings, null, 2)}`,
      );
    });
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

runPluginExample();
