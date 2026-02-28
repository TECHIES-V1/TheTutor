const http = require('http');

async function apiCall(method, path, body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`http://localhost:8000${path}`, options);

    // For SSE or non-JSON responses
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let result = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            result += decoder.decode(value);
            console.log(decoder.decode(value));
        }
        return result;
    }

    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        return text;
    }
}

async function runTests() {
    console.log("1. Testing Health:");
    console.log(await apiCall("GET", "/health"));

    console.log("\n2. Starting Conversation:");
    const res1 = await apiCall("POST", "/chat/message", { message: "I want to learn machine learning" });
    console.dir(res1, { depth: null });

    const convId = res1.conversationId;
    if (!convId) {
        console.error("No conversation ID returned!");
        return;
    }

    console.log("\n3. Level Question:");
    const res2 = await apiCall("POST", "/chat/message", {
        message: "I have some Python experience but new to ML",
        conversationId: convId
    });
    console.dir(res2, { depth: null });

    console.log("\n4. Time Question:");
    const res3 = await apiCall("POST", "/chat/message", {
        message: "About 5 hours per week",
        conversationId: convId
    });
    console.dir(res3, { depth: null });

    console.log("\n5. Goal Question:");
    const res4 = await apiCall("POST", "/chat/message", {
        message: "I want to build predictive models for my work",
        conversationId: convId
    });
    console.dir(res4, { depth: null });

    console.log("\n6. Confirm Subject:");
    const res5 = await apiCall("POST", "/chat/confirm-subject", {
        conversationId: convId,
        confirmed: true
    });
    console.dir(res5, { depth: null });

    console.log("\n7. Generate Course (SSE):");
    try {
        // Note: Node 18+ has native fetch.
        const sseResponse = await apiCall("POST", "/course/generate", { conversationId: convId });
        // SSE response is handled via streaming in apiCall or as raw text.
    } catch (e) {
        console.error("Generate error:", e);
    }

    console.log("\n8. Checking Generation Status:");
    const res6 = await apiCall("GET", `/course/generation-status/${convId}`);
    console.dir(res6, { depth: null });

    console.log("\n9. List all courses:");
    const courses = await apiCall("GET", "/course");
    console.dir(courses, { depth: null });
}

runTests();
