/**
 * Nested recursive example: Using recursive prompts within recursive prompts
 * Demonstrates recursion up to level 2-3
 */

import { recursivePrompt } from "../dist/index.js";
import type { RecursivePromptOptions } from "../dist/types.js";

async function runNestedRecursiveExample(): Promise<void> {
  const options: RecursivePromptOptions = {
    message: "Add another character ?",
    questionType: "select",
    options: {
      yesLabel: "Yes, add another",
      noLabel: "No, finish",
    },
    exitWhen: ({ iteration, answers, depth }) => {
      console.log(`Exit condition check: depth=${depth}, iteration=${iteration}, answers so far=${JSON.stringify(answers)}`);
      return false; // Limit to 3 characters for demo
    },
    default: true,
    prompts: [
      {
        name: "characterName",
        type: "input",
        message: "Character name:",
        validate: (value) => {
          const str = String(value).trim();
          return str.length > 0 || "Name cannot be empty";
        },
      },
      {
        name: "skills",
        type: "recursive",
        message: "Add another skill ?",
        questionType: "confirm",
        default: true,
        prompts: [
          {
            name: "skillName",
            type: "input",
            message: "Skill name:",
          },
          {
            name: "level",
            type: "select",
            message: "Level:",
            choices: [
              { name: "Novice", value: "novice" },
              { name: "Intermediate", value: "intermediate" },
              { name: "Expert", value: "expert" },
            ],
          },
        ],
      },
    ],
  };

  try {
    const result = await recursivePrompt(options);
    console.log("\n=== Characters with skills ===");
    result.forEach((char, idx) => {
      console.log(`\nCharacter ${idx + 1}: ${char.characterName}`);
      if (Array.isArray(char.skills)) {
        char.skills.forEach((skill: any, skillIdx: number) => {
          console.log(
            `  Skill ${skillIdx + 1}: ${skill.skillName} (${skill.level})`,
          );
        });
      }
    });
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

runNestedRecursiveExample();
