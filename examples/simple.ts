/**
 * Simple example: Basic usage of recursive prompts
 * Demonstrates when, filter, validate options with native prompts
 */

import { recursivePrompt } from "../dist/index.js";
import type { RecursivePromptOptions } from "../dist/types.js";

async function runSimpleExample(): Promise<void> {
  const options: RecursivePromptOptions = {
    message: "Add another item ?",
    questionType: "confirm",
    default: true,
    prompts: [
      {
        name: "itemName",
        type: "input",
        message: "Item name:",
        validate: (value) => {
          const str = String(value).trim();
          return str.length > 0 || "Item name cannot be empty";
        },
      },
      {
        name: "category",
        type: "select",
        message: "Choose a category:",
        choices: [
          { name: "Food", value: "food" },
          { name: "Tool", value: "tool" },
          { name: "Clothing", value: "clothing" },
        ],
      },
      {
        name: "quantity",
        type: "number",
        message: "Quantity:",
        default: 1,
        filter: (value) => {
          const num = Number(value);
          return Math.max(1, num);
        },
      },
    ],
  };

  try {
    const result = await recursivePrompt(options);
    console.log("\n=== Items collected ===");
    result.forEach((item, idx) => {
      console.log(`Item ${idx + 1}:`, item);
    });
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

runSimpleExample();
