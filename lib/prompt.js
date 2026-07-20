import { checkbox, select } from '@inquirer/prompts';

function assertInteractive() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error(
      'Mode non interactif : précisez --provider, --scope/--dir et --skills',
    );
  }
}

async function runPrompt(prompt) {
  try {
    return await prompt();
  } catch (error) {
    if (error?.name === 'CancelPromptError' || error?.name === 'ExitPromptError') {
      throw new Error('Installation annulée');
    }
    throw error;
  }
}

export async function chooseOne({ title, options }) {
  assertInteractive();

  return runPrompt(() =>
    select({
      message: title,
      choices: options.map((option) => ({
        name: option.label,
        value: option.value,
      })),
    }),
  );
}

export async function chooseMany({ title, options, defaultAll = true }) {
  assertInteractive();

  return runPrompt(() =>
    checkbox({
      message: title,
      choices: options.map((option) => ({
        name: option.label,
        value: option.value,
        checked: defaultAll,
      })),
      required: true,
    }),
  );
}
