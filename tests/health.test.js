async function runTest() {
  console.log("Sending test request to Refund AI...");
  
  try {
    const response = await fetch('http://localhost:8080/api/v1/refund/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        conversation: [
          {
            speaker: "Customer",
            message: "My flight to London was delayed 12 hours. I want a refund to my Visa."
          },
          {
            speaker: "Agent",
            message: "I apologize for the delay. Because it was over 4 hours, I have processed a full refund to your Visa."
          }
        ]
      })
    });

    const data = await response.json();
    console.log("\n--- AI RESPONSE ---");
    console.dir(data, { depth: null, colors: true });
    
  } catch (error) {
    console.error("Test failed:", error);
  }
}

runTest();