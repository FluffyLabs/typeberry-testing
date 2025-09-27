#!/usr/bin/env node

import { codec, config, fuzz_proto, numbers, utils } from "@typeberry/lib";
import { parseArgs } from "./args.js";
import { getBinFiles, processFile } from "./files.js";
import packageJson from "./package.json";
import { Socket } from "./socket.js";
import { Stats } from "./stats.js";

const { PeerInfo, MessageType, Version, messageCodec } = fuzz_proto.v1;

const APP_NAME = "picofuzz";
const APP_VERSION = packageJson.version;
const GP_VERSION = utils.CURRENT_VERSION;
const spec = config.tinyChainSpec;

main().catch((e) => {
  console.error(e);
  process.exit(-1);
});

async function main() {
  const args = parseArgs();
  const socket = await Socket.connect(args.socket);

  try {
    const binFiles = await getBinFiles(args.directory);
    console.log(`Found ${binFiles.length} .bin files`);

    const peerName = await sendHandshake(socket);

    const stats = Stats.new(peerName);

    for (let i = 0; i < args.repeat; i++) {
      for (const file of binFiles) {
        const success = await processFile(file, (filePath, fileData) => {
          return handleRequest(socket, stats, filePath, fileData);
        });

        if (!success) {
          console.error(`Stopping due to error with file: ${file}`);
          process.exit(1);
        }
      }
    }
    console.log("All files processed successfully");
    console.info(`${stats}`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    socket.close();
  }
}

function decodeMessage(data: Buffer): fuzz_proto.v1.MessageData {
  const arr = new Uint8Array(data);
  return codec.Decoder.decodeObject(messageCodec, arr, spec);
}

async function sendHandshake(socket: Socket) {
  const msgIn: fuzz_proto.v1.MessageData = {
    type: MessageType.PeerInfo,
    value: PeerInfo.create({
      fuzzVersion: numbers.tryAsU8(1),
      features: numbers.tryAsU32(0),
      appVersion: Version.tryFromString(APP_VERSION),
      jamVersion: Version.tryFromString(GP_VERSION),
      name: APP_NAME,
    }),
  };
  const encoded = codec.Encoder.encodeObject(messageCodec, msgIn, spec);
  const response = await socket.send(encoded.raw);
  const msgOut = decodeMessage(response);
  if (msgOut.type !== MessageType.PeerInfo) {
    throw new Error(`Invalid handshake response: ${MessageType[msgOut.type]}`);
  }
  const peer = msgOut.value;
  const peerName = `${peer.name}@${peer.appVersion.major}.${peer.appVersion.minor}.${peer.appVersion.patch}`;
  console.info(`[${peerName}] <-> Handshake successful ${peer}`);

  return peerName;
}

async function handleRequest(socket: Socket, stats: Stats, filePath: string, fileData: Buffer) {
  const msgIn = decodeMessage(fileData);
  console.log(`[node] <-- ${MessageType[msgIn.type]} ${msgIn.value}`);

  let response: Buffer = Buffer.alloc(0);
  await stats.measure(filePath, async () => {
    response = await socket.send(fileData);
  });

  const msgOut = decodeMessage(response);
  console.log(`[node] --> ${MessageType[msgOut.type]} ${msgOut.value}`);

  return true;
}
