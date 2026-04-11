/**
 * Concrete example: choose a year, then add distinct months recursively.
 * For each selected month, enter a daily revenue and display the monthly total
 * inside the transformer based on the number of days in the selected month.
 */

import { number } from "@inquirer/prompts";
import { recursivePrompt } from "../dist/index.js";
import type { RecursivePromptOptions } from "../dist/types.js";

const MONTHS = [
  { value: 0, label: "January" },
  { value: 1, label: "February" },
  { value: 2, label: "March" },
  { value: 3, label: "April" },
  { value: 4, label: "May" },
  { value: 5, label: "June" },
  { value: 6, label: "July" },
  { value: 7, label: "August" },
  { value: 8, label: "September" },
  { value: 9, label: "October" },
  { value: 10, label: "November" },
  { value: 11, label: "December" },
];

function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function getMonthLabel(monthIndex: number): string {
  return MONTHS.find((month) => month.value === monthIndex)?.label ?? "Unknown";
}

async function runMonthRevenueExample(): Promise<void> {
  const year = await number({
    message: "Which year do you want to prepare?",
    default: new Date().getFullYear(),
    required: true,
    validate: (value) =>
      typeof value === "number" && Number.isInteger(value)
        ? true
        : "Please enter a valid year",
  });

  const options: RecursivePromptOptions = {
    message: "Add another month?",
    questionType: "select",
    options: {
      yesLabel: "Add another month",
      noLabel: "Finish",
    },
    default: true,
    exitWhen: ({ answers }) => answers.length >= MONTHS.length,
    prompts: [
      {
        name: "month",
        type: "select",
        message: `Choose a month for ${year}:`,
        choices: ({ allAnswers }) => {
          const usedMonths = new Set(
            allAnswers
              .map((entry) => entry.month)
              .filter((value): value is number => typeof value === "number"),
          );

          return MONTHS.filter((month) => !usedMonths.has(month.value)).map((month) => ({
            name: month.label,
            value: month.value,
          }));
        },
      },
      {
        name: "dailyRevenue",
        type: "input",
        message: "Daily revenue:",
        filter: (value) => Number(value),
        validate: (value) =>
          typeof value === "number" && Number.isFinite(value) && value >= 0
            ? true
            : "Please enter a positive number",
        addAdditionalFields: (value, { answers, setField }) => {
          const monthIndex = typeof answers.month === "number" ? answers.month : 0;
          const numericValue = Number(value);
          const days = getDaysInMonth(year, monthIndex);

          setField("daysInMonth", days);
          setField("monthTotal", numericValue * days);
        },
        transformer: (value, { answers }) => {
          const monthIndex = typeof answers.month === "number" ? answers.month : 0;
          const numericValue = Number(value || 0);
          const days = getDaysInMonth(year, monthIndex);
          const total = numericValue * days;

          return `${numericValue} / day -> ${total.toFixed(2)} for ${getMonthLabel(monthIndex)} (${days} days)`;
        },
      },
    ],
  };

  try {
    const result = await recursivePrompt(options);
    let yearlyTotal = 0;

    console.log(`\n=== Revenue forecast for ${year} ===`);

    result.forEach((entry, index) => {
      const monthIndex = Number(entry.month);
      const dailyRevenue = Number(entry.dailyRevenue);
      const days = Number(entry.daysInMonth);
      const total = Number(entry.monthTotal);
      yearlyTotal += total;

      console.log(
        `${index + 1}. ${getMonthLabel(monthIndex)} -> ${dailyRevenue.toFixed(2)} / day, ${days} days, total ${total.toFixed(2)}`,
      );
    });

    console.log(`\nTotal estimated revenue for ${year}: ${yearlyTotal.toFixed(2)}`);
    console.log(`answers: ${JSON.stringify(result)}`);
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

runMonthRevenueExample();
