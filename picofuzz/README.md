# Picofuzz

A lightweight fuzz-like tool that sends prepared messages using the Fuzz Proto (V1) and collects statistics.

## Overview

Picofuzz is designed to test Typeberry nodes by sending pre-prepared binary fuzz messages through socket communication. It establishes a handshake with the target node, processes binary files containing fuzz data, and measures response times while collecting statistics.

## Usage

```bash
# Run directly with tsx
npx tsx index.ts <directory> <socket> [repeat]

# Using npm script
npm start <directory> <socket> [repeat]

# Using Docker
docker build -t picofuzz .
docker run picofuzz <directory> <socket> [repeat]
```

### Parameters

- `<directory>`: Directory containing .bin files with fuzz data
- `<socket>`: Socket path or address for communication with the target node
- `[repeat]`: Optional number of times to repeat the entire test suite (default: 1)

## Example

```bash
# Run picofuzz on data directory, connect to local socket, repeat 3 times
npx tsx index.ts ./fuzz-data /tmp/typeberry.sock 3
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
