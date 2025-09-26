export type Args = {
  directory: string;
  socket: string;
  repeat: number;
}

export function parseArgs(): Args {
  const args = process.argv.slice(2);

  if (args.length !== 2 && args.length !== 3) {
    console.error('Usage: picofuzz.ts <directory> <socket> [repeat]');
    process.exit(1);
  }

  let repeat = Number(args[2] ?? 1);
  if (args.length === 3 && Number.isNaN(repeat)) {
    console.error(`Invalid repeat value: ${repeat}`);

    console.error('Usage: picofuzz.ts <directory> <socket> [repeat]');
    process.exit(1);
  }

  return {
    directory: args[0],
    socket: args[1],
    repeat,
  };
}


