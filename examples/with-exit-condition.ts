/**
 * Exit condition example: Using exitWhen to stop the loop based on a condition
 * Asks user for max entries, then collects that many items before exiting
 */

import { number } from "@inquirer/prompts";
import { recursivePrompt } from "../dist/index.js";
import type { RecursivePromptOptions } from "../dist/types.js";

async function runExitConditionExample(): Promise<void> {
  console.log("=== Item Collection with Max Limit ===\n");

  // Step 1: Ask for max number of items
  const maxItems = await number({
    message: "How many items do you want to collect? (2-5):",
    default: 3,
    min: 2,
    max: 5,
  });

  console.log(`\nCollecting up to ${maxItems} items...\n`);

  // Step 2: Run recursive prompt with exitWhen condition
  const options: RecursivePromptOptions = {
    message: "Add another item?",
    questionType: "select",
    options: {
      yesLabel: "Yes, add another",
      noLabel: "No, I'm done",
    },
    default: true,
    // Exit when we reach the max number of items collected
    exitWhen: ({ answers }) => answers.length >= maxItems!,
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
        name: "quantity",
        type: "number",
        message: "Quantity:",
        default: 1,
        filter: (value) => Math.max(1, Number(value)),
      },
      {
        name: "price",
        type: "number",
        message: "Price ($):",
        default: 0,
        filter: (value) => Math.max(0, Number(value)),
      },
    ],
  };

  try {
    const result = await recursivePrompt(options);

    console.log(`\n=== Collection Complete (${result.length}/${maxItems} items) ===`);
    let totalPrice = 0;
    let totalQuantity = 0;

    result.forEach((item, idx) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      totalQuantity += qty;
      totalPrice += qty * price;

      console.log(
        `\n${idx + 1}. ${item.itemName} × ${qty} @ $${price.toFixed(2)} = $${(
          qty * price
        ).toFixed(2)}`,
      );
    });

    console.log(`\n--- Summary ---`);
    console.log(`Total items: ${totalQuantity}`);
    console.log(`Total value: $${totalPrice.toFixed(2)}`);
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

runExitConditionExample();

