export type Args = {
  directory: string;
  socket: string;
}

export function parseArgs(): Args {
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    console.error('Usage: picofuzz.ts <directory> <socket>');
    process.exit(1);
  }

  return {
    directory: args[0],
    socket: args[1]
  };
}


