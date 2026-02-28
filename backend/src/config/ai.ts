import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";

// Initialize Amazon Bedrock provider with credentials from environment
export const bedrock = createAmazonBedrock({
  region: process.env.AWS_REGION ?? "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Model configuration
export const AI_MODEL = process.env.AI_MODEL ?? "us.amazon.nova-pro-v1:0";

// Get the configured model
export function getModel() {
  return bedrock(AI_MODEL);
}

// Generation settings
export const GENERATION_CONFIG = {
  maxOutputTokens: 4096,
  temperature: 0.7,
};

export const STREAMING_CONFIG = {
  maxOutputTokens: 8192,
  temperature: 0.7,
};
