import { PollyClient } from "@aws-sdk/client-polly";

export const pollyClient = new PollyClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const POLLY_CONFIG = {
  voiceId: "Joanna" as const,
  engine: "neural" as const,
  outputFormat: "mp3" as const,
  sampleRate: "24000",
  maxChunkLength: 2900,
};
