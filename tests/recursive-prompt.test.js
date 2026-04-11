import assert from "node:assert/strict";
import test from "node:test";

import { recursivePrompt } from "../dist/index.js";

function createValuePlugin() {
  return {
    name: "Value plugin",
    type: "value",
    prompt: async (config) => config.value,
  };
}

function createDepthChainQuestion({ bypassDepthLimit = false } = {}) {
  return {
    name: "depthL1",
    type: "recursive",
    bypassDepthLimit,
    exitWhen: ({ answers }) => answers.length >= 1,
    prompts: [
      {
        name: "depthL2",
        type: "recursive",
        bypassDepthLimit,
        exitWhen: ({ answers }) => answers.length >= 1,
        prompts: [
          {
            name: "depthL3",
            type: "recursive",
            bypassDepthLimit,
            exitWhen: ({ answers }) => answers.length >= 1,
            prompts: [
              {
                name: "leaf",
                type: "value",
                value: "ok",
              },
            ],
          },
        ],
      },
    ],
  };
}

test("passes flat question options to plugin prompt", async () => {
  let receivedConfig;

  const plugin = {
    name: "Echo plugin",
    type: "echo",
    prompt: async (config) => {
      receivedConfig = config;
      return "Alice";
    },
  };

  const result = await recursivePrompt({
    plugins: [plugin],
    exitWhen: ({ answers }) => answers.length >= 1,
    prompts: [
      {
        name: "personName",
        type: "echo",
        message: "Person name:",
        placeholder: "Type a name",
      },
    ],
  });

  assert.deepEqual(result, [{ personName: "Alice" }]);
  assert.deepEqual(receivedConfig, {
    message: "Person name:",
    placeholder: "Type a name",
  });
});

test("exitWhen receives all loop answers", async () => {
  const contexts = [];

  const plugin = {
    name: "Static plugin",
    type: "static-value",
    prompt: async () => "first",
  };

  const result = await recursivePrompt({
    plugins: [plugin],
    exitWhen: (context) => {
      contexts.push({
        iteration: context.iteration,
        answersLength: context.answers.length,
      });
      return context.answers.length >= 1;
    },
    prompts: [
      {
        name: "value",
        type: "static-value",
      },
    ],
  });

  assert.deepEqual(result, [{ value: "first" }]);
  assert.equal(contexts.length, 2);
  assert.deepEqual(contexts[0], { iteration: 1, answersLength: 0 });
  assert.deepEqual(contexts[1], { iteration: 1, answersLength: 1 });
});

test("supports nested recursive prompt with flat nested options", async () => {
  const plugin = {
    name: "Value plugin",
    type: "value",
    prompt: async (config) => config.value,
  };

  const result = await recursivePrompt({
    plugins: [plugin],
    exitWhen: ({ answers }) => answers.length >= 1,
    prompts: [
      {
        name: "skills",
        type: "recursive",
        message: "Add another skill?",
        questionType: "confirm",
        default: true,
        exitWhen: ({ answers }) => answers.length >= 1,
        prompts: [
          {
            name: "skillName",
            type: "value",
            value: "Sword",
          },
        ],
      },
    ],
  });

  assert.equal(Array.isArray(result), true);
  assert.equal(result.length, 1);
  assert.equal(Array.isArray(result[0].skills), true);
  assert.deepEqual(result[0].skills, [{ skillName: "Sword" }]);
});

test("throws when plugin type is unknown", async () => {
  await assert.rejects(
    recursivePrompt({
      prompts: [
        {
          name: "x",
          type: "not-registered",
        },
      ],
      exitWhen: ({ answers }) => answers.length >= 1,
    }),
    /Unknown question type "not-registered"/,
  );
});

test("throws when prompts list is empty", async () => {
  await assert.rejects(
    recursivePrompt({ prompts: [] }),
    /The prompts list cannot be empty/,
  );
});

test("throws when plugin type is duplicated", async () => {
  await assert.rejects(
    recursivePrompt({
      plugins: [
        { name: "A", type: "x", prompt: async () => 1 },
        { name: "B", type: "x", prompt: async () => 2 },
      ],
      prompts: [{ name: "v", type: "x" }],
      exitWhen: ({ answers }) => answers.length >= 1,
    }),
    /Duplicate plugin type registered: "x"/,
  );
});

test("throws when plugin function is duplicated", async () => {
  const sharedPrompt = async () => "ok";

  await assert.rejects(
    recursivePrompt({
      plugins: [
        { name: "A", type: "x", prompt: sharedPrompt },
        { name: "B", type: "y", prompt: sharedPrompt },
      ],
      prompts: [{ name: "v", type: "x" }],
      exitWhen: ({ answers }) => answers.length >= 1,
    }),
    /Duplicate plugin function registered for type "y"/,
  );
});

test("throws when plugin type is reserved", async () => {
  await assert.rejects(
    recursivePrompt({
      plugins: [{ name: "Input override", type: "input", prompt: async () => "x" }],
      prompts: [{ name: "v", type: "input", message: "x" }],
      exitWhen: ({ answers }) => answers.length >= 1,
    }),
    /Plugin type "input" is reserved/,
  );
});

test("applies when, filter and validate with current iteration answers", async () => {
  const valuePlugin = createValuePlugin();

  const result = await recursivePrompt({
    plugins: [valuePlugin],
    prompts: [
      {
        name: "quantity",
        type: "value",
        value: 2,
        filter: (value) => Number(value) * 2,
      },
      {
        name: "onlyWhenQuantityIsFour",
        type: "value",
        value: "shown",
        when: ({ answers }) => answers.quantity === 4,
      },
      {
        name: "validated",
        type: "value",
        value: "ok",
        validate: (value) => value === "ok" || "Validation failed",
      },
    ],
    exitWhen: ({ answers }) => answers.length >= 1,
  });

  assert.deepEqual(result, [
    {
      quantity: 4,
      onlyWhenQuantityIsFour: "shown",
      validated: "ok",
    },
  ]);
});

test("throws validation message when validate returns a string", async () => {
  const valuePlugin = createValuePlugin();

  await assert.rejects(
    recursivePrompt({
      plugins: [valuePlugin],
      prompts: [
        {
          name: "validated",
          type: "value",
          value: "bad",
          validate: () => "Nope",
        },
      ],
      exitWhen: ({ answers }) => answers.length >= 1,
    }),
    /Nope/,
  );
});

test("enforces recursion depth limit by default", async () => {
  const valuePlugin = createValuePlugin();

  await assert.rejects(
    recursivePrompt({
      plugins: [valuePlugin],
      prompts: [createDepthChainQuestion()],
      exitWhen: ({ answers }) => answers.length >= 1,
    }),
    /Maximum recursive depth \(3\) exceeded/,
  );
});

test("allows deep recursion with bypassDepthLimit", async () => {
  const valuePlugin = createValuePlugin();

  const result = await recursivePrompt({
    plugins: [valuePlugin],
    prompts: [createDepthChainQuestion({ bypassDepthLimit: true })],
    bypassDepthLimit: true,
    exitWhen: ({ answers }) => answers.length >= 1,
  });

  assert.equal(result.length, 1);
});

test("prints bypassDepthLimit warning only once", async () => {
  const valuePlugin = createValuePlugin();
  const originalWarn = console.warn;
  const calls = [];

  console.warn = (...args) => {
    calls.push(args.map(String).join(" "));
  };

  try {
    await recursivePrompt({
      plugins: [valuePlugin],
      prompts: [{ name: "v", type: "value", value: 1 }],
      exitWhen: ({ answers }) => answers.length >= 1,
      bypassDepthLimit: true,
    });

    await recursivePrompt({
      plugins: [valuePlugin],
      prompts: [{ name: "v", type: "value", value: 1 }],
      exitWhen: ({ answers }) => answers.length >= 1,
      bypassDepthLimit: true,
    });
  } finally {
    console.warn = originalWarn;
  }

  // The warning is emitted once per process. If a previous test already triggered
  // it, this test can legitimately observe 0 new warnings.
  assert.equal(calls.length <= 1, true);
  if (calls.length === 1) {
    assert.match(calls[0], /bypassDepthLimit is enabled/);
  }
});

test("supports dotted name path assignment", async () => {
  const valuePlugin = createValuePlugin();

  const result = await recursivePrompt({
    plugins: [valuePlugin],
    prompts: [
      {
        name: "user.profile.name",
        type: "value",
        value: "Velynn",
      },
    ],
    exitWhen: ({ answers }) => answers.length >= 1,
  });

  assert.deepEqual(result, [{ user: { profile: { name: "Velynn" } } }]);
});

test("askAnswered only re-asks when explicitly enabled", async () => {
  let callCount = 0;
  const plugin = {
    name: "Counter",
    type: "counter",
    prompt: async () => {
      callCount += 1;
      return callCount;
    },
  };

  const result = await recursivePrompt({
    plugins: [plugin],
    prompts: [
      { name: "dup", type: "counter" },
      { name: "dup", type: "counter" },
      { name: "dup2", type: "counter", askAnswered: true },
      { name: "dup2", type: "counter", askAnswered: true },
    ],
    exitWhen: ({ answers }) => answers.length >= 1,
  });

  assert.equal(callCount, 3);
  assert.deepEqual(result, [{ dup: 1, dup2: 3 }]);
});

test("when/filter/transformer receive allAnswers and current answers", async () => {
  let transformerContext;
  const plugin = {
    name: "Context plugin",
    type: "context-value",
    prompt: async (config) => {
      if (typeof config.transformer === "function") {
        config.transformer("display", { isFinal: false });
      }
      return config.value;
    },
  };

  const result = await recursivePrompt({
    plugins: [plugin],
    prompts: [
      {
        name: "step1",
        type: "context-value",
        value: "a",
        transformer: (_value, context) => {
          transformerContext = {
            currentKeys: Object.keys(context.answers),
            allCount: context.allAnswers.length,
          };
          return "ok";
        },
      },
      {
        name: "step2",
        type: "context-value",
        value: 5,
        when: (context) =>
          context.answers.step1 === "a" && context.allAnswers.length === 0,
        filter: (value, context) =>
          context.answers.step1 === "a" && context.allAnswers.length === 0
            ? Number(value) * 2
            : value,
      },
    ],
    exitWhen: ({ answers }) => answers.length >= 1,
  });

  assert.deepEqual(transformerContext, { currentKeys: [], allCount: 0 });
  assert.deepEqual(result, [{ step1: "a", step2: 10 }]);
});

test("addAdditionalFields augments the current iteration answers after validation", async () => {
  const valuePlugin = createValuePlugin();

  const result = await recursivePrompt({
    plugins: [valuePlugin],
    prompts: [
      {
        name: "month",
        type: "value",
        value: 1,
      },
      {
        name: "dailyRevenue",
        type: "value",
        value: 10,
        filter: (value) => Number(value),
        validate: (value) => Number(value) > 0 || "invalid",
        addAdditionalFields: (value, { answers }) => {
          answers.daysInMonth = 28;
          answers.monthTotal = Number(value) * 28;
        },
      },
    ],
    exitWhen: ({ answers }) => answers.length >= 1,
  });

  assert.deepEqual(result, [
    {
      month: 1,
      dailyRevenue: 10,
      daysInMonth: 28,
      monthTotal: 280,
    },
  ]);
});

test("dynamic choices are resolved before calling the prompt", async () => {
  const observedChoices = [];
  const plugin = {
    name: "Choose first",
    type: "pick-first",
    prompt: async (config) => {
      observedChoices.push(config.choices.map((choice) => choice.value));
      return config.choices[0].value;
    },
  };

  const result = await recursivePrompt({
    plugins: [plugin],
    prompts: [
      {
        name: "month",
        type: "pick-first",
        choices: ({ allAnswers }) => {
          const remaining = ["jan", "feb", "mar"].filter(
            (month) => !allAnswers.some((entry) => entry.month === month),
          );

          return remaining.map((value) => ({ name: value, value }));
        },
      },
    ],
    exitWhen: ({ answers }) => answers.length >= 1,
  });

  assert.deepEqual(observedChoices, [["jan", "feb", "mar"]]);
  assert.deepEqual(result, [{ month: "jan" }]);
});
