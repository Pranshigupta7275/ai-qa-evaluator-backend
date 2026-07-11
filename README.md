AI-Powered CRM Quality Assurance Engine

An AI-driven Quality Assurance (QA) engine that automatically evaluates customer support conversations against official Standard Operating Procedures (SOPs). The system analyzes support transcripts, detects compliance issues, provides evidence-based findings, and generates actionable coaching feedback to improve agent performance.

🚀 Overview

Traditional QA teams manually review only a small percentage of customer interactions, making the process slow, inconsistent, and difficult to scale.

This project automates the entire QA workflow by leveraging Large Language Models (LLMs) to:

Detect customer intent and route conversations to the appropriate SOP.
Evaluate agent compliance against airline policies.
Extract supporting evidence directly from chat transcripts.
Identify critical compliance failures.
Generate structured coaching recommendations.
Store evaluation results for auditing and performance reporting.
🛠 Tech Stack
Layer	Technology
Backend	Node.js, Express.js
AI Models	Groq (Llama 3.3 70B) / Gemini
Database	MongoDB
Architecture	MVC + Service Layer
Logging	Winston
API Testing	Postman
✨ Features
AI-Powered SOP Evaluation
Evaluates conversations against category-specific airline SOPs.
Supports policy grounding for:
Payment Verification
Refunds
Flight Changes
Cancellation
Baggage
IRROPS
General Customer Service
Intelligent Intent Routing
Automatically identifies customer intent.
Routes conversations to the correct evaluation pipeline.
Reduces unnecessary LLM processing through category-based orchestration.
Evidence-Based QA
Maps every compliance finding to actual customer and agent messages.
Produces explainable AI outputs instead of generic summaries.
Compliance Detection

Identifies issues such as:

Missing mandatory verification steps
Incorrect policy guidance
Unauthorized promises or commitments
Incomplete resolutions
SOP violations
Critical customer handling errors
Automated Coaching

Generates actionable recommendations to help agents improve future interactions.

Audit Trail

Stores structured QA evaluations in MongoDB for:

Performance tracking
Compliance reporting
Historical audits
Future analytics
🏗 Architecture
CRM Conversation
        │
        ▼
 API Endpoint (petitionId)
        │
        ▼
Conversation Retrieval
        │
        ▼
Intent Detection
        │
        ▼
Category SOP Selection
        │
        ▼
Prompt Builder
        │
        ▼
LLM Evaluation
        │
        ▼
JSON Parser
        │
        ▼
MongoDB Storage
        │
        ▼
Structured QA Response
⚙️ Workflow
Receive a petitionId from the CRM.
Retrieve the conversation.
Detect customer intent.
Load the relevant SOP/grounding context.
Generate a structured prompt.
Evaluate the conversation using the LLM.
Parse the response into structured JSON.
Store findings in MongoDB.
Return the QA evaluation through the API.
📦 Example Response
{
  "overallAssessment": "The agent partially complied with the payment verification SOP but failed to collect the mandatory Transaction ID.",

  "findings": [
    {
      "severity": "High",
      "errorType": "Incomplete Resolution",
      "issue": "Transaction ID was not requested.",
      "evidence": {
        "customer": "Money was deducted but I didn't receive my ticket.",
        "agent": "Please provide your booking reference."
      }
    }
  ],

  "observations": [
    "The agent acknowledged the customer's concern.",
    "The booking reference was requested."
  ],

  "recommendations": [
    "Always request the Transaction/Authorization ID before beginning payment verification."
  ]
}
📁 Project Structure
src/
│
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
│   ├── ai/
│   ├── providers/
│   ├── orchestrator/
│   └── payment/
├── utils/
├── app.js
└── server.js
🚀 Getting Started
Clone the repository
git clone <repository-url>
cd ai-crm-qa-engine
Install dependencies
npm install
Configure environment variables

Create a .env file:

PORT=5000

MONGODB_URI=your_mongodb_uri

GROQ_API_KEY=your_groq_api_key

GEMINI_API_KEY=your_gemini_api_key
Run the project
npm run dev
📡 API

POST

/api/v1/orchestrator/analyzeFull

Request

{
    "petitionId": "PET12345"
}
🎯 Key Capabilities
AI-powered conversation evaluation
Intent detection and intelligent routing
Category-specific SOP grounding
Evidence-backed compliance auditing
Automated coaching recommendations
MongoDB audit persistence
RESTful API architecture
Modular service-based design
💡 Why This Project?

Customer support quality assurance is often limited to manual reviews of a small percentage of interactions, making it difficult to maintain consistent compliance.

This engine automates the QA process by evaluating every conversation against official SOPs, extracting evidence from the dialogue, and generating structured coaching feedback. The result is faster reviews, more consistent evaluations, reduced human bias, and a scalable foundation for AI-assisted quality monitoring.
