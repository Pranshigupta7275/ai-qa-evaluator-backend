const http = require('http');

const payload = JSON.stringify({
    petitionId: "TEST-RESCHEDULE-FINAL-TEST",
    categoryOverride: "Reschedule",
    conversation: [
        { role: "customer", speaker: "Mark", message: "Hi, I need to change my flight date." },
        { role: "agent", speaker: "Sarah", message: "I can help with that. The fee will be 120 Euros." },
        { role: "customer", speaker: "Mark", message: "Can you waive the 50 Euro penalty?" },
        { role: "agent", speaker: "Sarah", message: "What is your employment status? I will waive it for you." }
    ]
});

const options = {
    hostname: 'localhost',
    port: 8080,
    path: '/api/v1/qa/analyze',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
    }
};

console.log("🚀 Booting up Test Script...");
console.log("📦 Payload being sent: ", payload);

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log("\n=======================================");
        console.log("       🚨 AI EVALUATION REPORT       ");
        console.log("=======================================\n");
        try {
            console.log(JSON.stringify(JSON.parse(data), null, 2));
        } catch (e) {
            console.log("Raw Response:", data);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Connection Error: ${e.message}`);
});

req.write(payload);
req.end();