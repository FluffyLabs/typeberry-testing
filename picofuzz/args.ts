import minimist from "minimist";

export type Args = {
  directory: string;
  socket: string;
  repeat: number;
  flavour: "tiny" | "full";
  output?: string;
};

export function parseArgs(): Args {
  const argv = minimist(process.argv.slice(2), {
    alias: {
      s: "stats",
      f: "flavour",
      r: "repeat",
      h: "help",
    },
    default: {
      repeat: 1,
    },
    string: ["directory", "socket"],
  });

  if (argv.help) {
    console.log("Usage: picofuzz [options] <directory> <socket>");
    console.log("");
    console.log("Options:");
    console.log("  -f, --flavour <spec>      JAM spec: tiny | full (default: tiny)");
    console.log("  -r, --repeat  <count>     Number of repetitions (default: 1)");
    console.log("  -s, --stats   <file>      Append aggregated stats to a CSV file");
    console.log("  -h, --help                Show help");
    console.log("");
    console.log("Positional arguments:");
    console.log("  picofuzz <directory> <socket> [repeat]");
    process.exit(0);
  }

  // Support both flag-based and positional arguments
  const directory = argv._[0];
  const socket = argv._[1];
  const repeat = argv.repeat;
  const flavour = argv.flavour ?? "tiny";
  const output = argv.stats;

  if (!directory || !socket) {
    console.error("Error: directory and socket are required");
    console.error("Usage: picofuzz [options] <directory> <socket>");
    console.error("Use --help for more information");
    process.exit(1);
  }

  if (Number.isNaN(repeat) || repeat < 1) {
    console.error(`Invalid repeat value: ${repeat}`);
    console.error("Repeat must be a positive number");
    process.exit(1);
  }

  if (flavour !== "tiny" && flavour !== "full") {
    console.error(`Invalid flavour value: ${flavour}`);
    console.error("Must be either 'tiny' or 'full'");
    process.exit(1);
  }

  return {
    directory,
    socket,
    repeat,
    flavour,
    output,
  };
}
