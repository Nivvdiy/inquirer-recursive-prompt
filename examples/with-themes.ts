/**
 * Theme example: customize prompt themes globally and per question
 */

import { recursivePrompt } from "../dist/index.js";
import type { RecursivePromptOptions } from "../dist/types.js";
import { styleText } from "node:util";

async function runThemesExample(): Promise<void> {
  const options: RecursivePromptOptions = {
    message: "Add another styled entry?",
    questionType: "select",
    options: {
      yesLabel: "Continue",
      noLabel: "Finish",
    },
    default: true,
    theme: {
      input: {
        prefix: {
          idle: "➤",
          done: "✔",
        },
        validationFailureMode: "keep",
      },
      select: {
        icon: {
          cursor: "❯",
        },
        indexMode: "number",
      },
      confirm: {
        prefix: {
          idle: "?",
          done: "✓",
        },
      },
      recursivePrompt: {
        style: {
          message: (text: string) => styleText("red", text),
          answer: (text: string) => styleText("green", text),
        },
      },
    },
    prompts: [
      {
        name: "title",
        type: "input",
        message: "Entry title:",
        validate: (value) => {
          const str = String(value).trim();
          return str.length > 0 || "Title cannot be empty";
        },
      },
      {
        name: "priority",
        type: "select",
        message: "Priority:",
        choices: [
          { name: "Low", value: "low" },
          { name: "Medium", value: "medium" },
          { name: "High", value: "high" },
        ],
        // Local theme overrides global select cursor for this question only.
        theme: {
          icon: {
            cursor: "▶",
          },
        },
      },
      {
        name: "note",
        type: "input",
        message: "Short note:",
      },
    ],
  };

  try {
    const result = await recursivePrompt(options);
    console.log("\n=== Styled entries collected ===");
    result.forEach((entry, idx) => {
      console.log(`\n${idx + 1}. ${entry.title}`);
      console.log(`   Priority: ${entry.priority}`);
      console.log(`   Note: ${entry.note}`);
    });
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

runThemesExample();
