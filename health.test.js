async function runTest() {
  console.log("🚀 Booting up Test Script...");
  console.log("📡 Sending SOP Violation test to the Orchestrator...\n");
  
  try {
    const response = await fetch('http://localhost:8080/api/v1/orchestrator/analyzeFull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation: [
          { 
            role: "customer", 
            message: "Hi, I paid for a seat upgrade, my card was charged $30, but I didn't get a confirmation email. Did it go through?" 
          },
          { 
            role: "agent", 
            message: "Hey there! Yeah, our email system is acting up today. I actually don't see the $30 payment on my end yet, but if your bank says it left your account, it definitely went through. Don't worry about it, you're good to go for your flight!" 
          }
        ]
      })
    });

    const data = await response.json();
    
    console.log("=======================================");
    console.log("         🚨 AI EVALUATION REPORT       ");
    console.log("=======================================\n");
    
    // Prints the full, deeply nested JSON beautifully in your terminal
    console.dir(data, { depth: null, colors: true });
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

runTest();