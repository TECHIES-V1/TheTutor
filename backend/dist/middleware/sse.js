"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sseHeaders = sseHeaders;
exports.sendSSE = sendSSE;
exports.sendSSEComment = sendSSEComment;
exports.endSSE = endSSE;
exports.startKeepAlive = startKeepAlive;
exports.stopKeepAlive = stopKeepAlive;
// ── SSE Headers Middleware ────────────────────────────────────────────────
function sseHeaders(_req, res, next) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
    res.flushHeaders();
    next();
}
// ── SSE Helper Functions ──────────────────────────────────────────────────
function sendSSE(res, event, data) {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
}
function sendSSEComment(res, comment) {
    res.write(`: ${comment}\n\n`);
}
function endSSE(res) {
    res.end();
}
// ── Keep-Alive Utility ────────────────────────────────────────────────────
function startKeepAlive(res, intervalMs = 15000) {
    return setInterval(() => {
        sendSSEComment(res, "keepalive");
    }, intervalMs);
}
function stopKeepAlive(interval) {
    clearInterval(interval);
}
