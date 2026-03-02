"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STREAMING_CONFIG = exports.GENERATION_CONFIG = exports.AI_MODEL = exports.bedrock = void 0;
exports.getModel = getModel;
const amazon_bedrock_1 = require("@ai-sdk/amazon-bedrock");
// Initialize Amazon Bedrock provider with credentials from environment
exports.bedrock = (0, amazon_bedrock_1.createAmazonBedrock)({
    region: process.env.AWS_REGION ?? "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
// Model configuration
exports.AI_MODEL = process.env.AI_MODEL ?? "us.amazon.nova-pro-v1:0";
// Get the configured model
function getModel() {
    return (0, exports.bedrock)(exports.AI_MODEL);
}
// Generation settings
exports.GENERATION_CONFIG = {
    maxOutputTokens: 4096,
    temperature: 0.7,
};
exports.STREAMING_CONFIG = {
    maxOutputTokens: 8192,
    temperature: 0.7,
};
