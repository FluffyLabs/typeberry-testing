#!/usr/bin/env node

import {parseArgs} from './args.js';
import {getBinFiles, processFile} from './files.js';
import {Socket} from './socket.js';
import {codec, config, fuzz_proto, numbers, utils} from "@typeberry/lib";
import packageJson from "../package.json" with { type: "json" };

const { PeerInfo, MessageType, Version, messageCodec } = fuzz_proto.v1;

const APP_NAME = "picofuzz";
const APP_VERSION = packageJson.version;
const GP_VERSION = utils.CURRENT_VERSION;
const spec = config.tinyChainSpec;

main().catch(e => {
    console.error(e);
    process.exit(-1);
  });

async function main() {
  const args = parseArgs();

  try {
    const binFiles = await getBinFiles(args.directory);
    console.log(`Found ${binFiles.length} .bin files`);

    const socket = await Socket.connect(args.socket);

    await sendHandshake(socket);

    for (const file of binFiles) {
      const success = await processFile(file, (filePath, fileData) => {
        return handleRequest(socket, filePath, fileData);
      });

      if (!success) {
        console.error(`Stopping due to error with file: ${file}`);
        process.exit(1);
      }
    }

    console.log('All files processed successfully');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

function decodeMessage(data: Buffer, isRequest: boolean): boolean {
  const arr = new Uint8Array(data);
  try {
    const msg: fuzz_proto.v1.MessageData = codec.Decoder.decodeObject(messageCodec, arr, spec);
    if (isRequest) {
      console.log(`[node] <-- ${MessageType[msg.type]} ${msg.value}`);
    } else {
      console.log(`[node] --> ${MessageType[msg.type]} ${msg.value}`);
    }
  } catch (e) {
    console.error('Unable to decode fuzzer message.');
    return false;
  }
  return true;
}

async function sendHandshake(socket: Socket) {
  const msg: fuzz_proto.v1.MessageData = {
    type: MessageType.PeerInfo,
    value: PeerInfo.create({
      fuzzVersion: numbers.tryAsU8(1),
      features: numbers.tryAsU32(0),
      appVersion: Version.tryFromString(APP_VERSION),
      jamVersion: Version.tryFromString(GP_VERSION),
      name: APP_NAME,
    }),
  };
  const encoded = codec.Encoder.encodeObject(messageCodec, msg, spec);
  const response = await socket.send(encoded.raw);
  const canDecode = decodeMessage(response, false);
  if (!canDecode) {
    throw new Error('Failed to decode handshake response');
  }
}

async function handleRequest(socket: Socket, filePath: string, fileData: Buffer) {
  const canDecode = decodeMessage(fileData, true);
  if (!canDecode) {
    throw new Error(`Failed to decode file: ${filePath}`);
  }

  const response = await socket.send(fileData);

  const decodedResponse = decodeMessage(response, false);
  if (!decodedResponse) {
    throw new Error(`Failed to decode response for file: ${filePath}`);
  }

  return true;
}
