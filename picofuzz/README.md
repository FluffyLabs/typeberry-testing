# Picofuzz

A lightweight fuzz-like tool that sends prepared messages using the Fuzz Proto (V1) and collects statistics.

## Overview

Picofuzz is designed to test Typeberry nodes by sending pre-prepared binary fuzz messages through socket communication. It establishes a handshake with the target node, processes binary files containing fuzz data, and measures response times while collecting statistics.

## Usage

```bash
# Run directly with tsx
npx tsx index.ts [options] <directory> <socket>

# Using npm script
npm start [options] <directory> <socket>

# Using Docker
docker build -t picofuzz .
docker run picofuzz [options] <directory> <socket>
```

### Options

- `-f, --flavour <spec>`: JAM spec: tiny | full (default: tiny)
- `-r, --repeat <count>`: Number of repetitions (default: 1)
- `-s, --stats <file>`: Append aggregated stats to a CSV file
- `-h, --help`: Show help

### Parameters

- `<directory>`: Directory containing .bin files with fuzz data
- `<socket>`: Socket path or address for communication with the target node

## Example

```bash
# Run picofuzz on data directory, connect to local socket, repeat 3 times
npx tsx index.ts -r 3 ./fuzz-data /tmp/typeberry.sock

# Run with full JAM spec and save stats to CSV
npx tsx index.ts -f full -s results.csv ./fuzz-data /tmp/typeberry.sock
```

## Testing typeberry with standard w3f-conformance data

```bash
# Generate `picofuzz-data`:
npm run prepare-data

# Start typeberry fuzz target first.
npx @typeberry/jam fuzz-target

# Select and execute some tests
npm start -r 3 ./picofuzz-data/safrole /tmp/jam_target.sock
```

## How It Works

1. **Handshake**: Establishes connection with target node using PeerInfo exchange
2. **File Processing**: Reads all .bin files from the specified directory
3. **Message Sending**: For each file, decodes the message and sends it to the target
4. **Response Handling**: Receives and decodes responses from the target node
5. **Statistics**: Collects timing and success/failure statistics
6. **Reporting**: Outputs comprehensive statistics at the end of the run

## Dependencies

- `@typeberry/lib` - Core Typeberry protocol implementation
- `tsx` - TypeScript execution environment

## Building Docker Image

```bash
# Build the Docker image
docker build -t picofuzz .

# Run with mounted data directory
docker run -v /path/to/fuzz-data:/data picofuzz /data /tmp/socket
```

## Statistics

Picofuzz tracks response times for each request

Statistics are printed at the end of each run for performance analysis and debugging.
