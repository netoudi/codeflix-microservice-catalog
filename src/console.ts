import * as commands from './commands';

const command = process.argv[2] || null;

if (!command) {
  // show disponíveis
}

const commandKey: string | undefined = Object.keys(commands).find((c) => {
  // @ts-ignore
  return commands[c].command === command;
});

if (!commandKey) {
  // show disponíveis
}

// executar o comando
