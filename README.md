# 🤖 AI-Powered CRM Quality Assurance Engine

An AI-driven **Customer Relationship Management (CRM) Quality Assurance Engine** that automatically evaluates customer support conversations against Standard Operating Procedures (SOPs). The system analyzes support transcripts, detects compliance issues, extracts evidence from conversations, and generates actionable coaching feedback to improve agent performance and ensure policy compliance.

---

# 🚀 Overview

Traditional Quality Assurance teams manually review only a small percentage of customer interactions, making the process time-consuming, inconsistent, and difficult to scale.

This project automates the entire QA process using **Large Language Models (LLMs)** to:

- Detect customer intent and route conversations to the appropriate SOP.
- Evaluate agent compliance against airline policies.
- Extract evidence directly from customer-agent conversations.
- Identify critical compliance failures.
- Generate structured coaching recommendations.
- Store evaluation results for auditing and performance reporting.

---

# 🛠 Tech Stack

| Layer | Technology |
|--------|------------|
| Backend | Node.js, Express.js |
| AI Models | Groq (Llama 3.3 70B), Google Gemini |
| Database | MongoDB |
| Architecture | MVC + Service Layer |
| Logging | Winston |
| API Testing | Postman |

---

# ✨ Features

## ✅ AI-Powered SOP Evaluation

Evaluates customer conversations against category-specific airline SOPs.

Supported categories include:

- Payment Verification
- Refunds
- Flight Changes
- Cancellation
- Baggage
- IRROPS
- General Customer Service

---

## ✅ Intelligent Intent Routing

- Automatically detects customer intent.
- Routes conversations to the appropriate evaluation pipeline.
- Reduces unnecessary LLM calls through category-based orchestration.

---

## ✅ Evidence-Based QA

- Maps every compliance finding to actual customer and agent messages.
- Produces explainable AI outputs backed by conversation evidence.

---

## ✅ Compliance Detection

Automatically identifies issues such as:

- Missing mandatory verification steps
- Incorrect policy guidance
- Unauthorized promises or commitments
- Incomplete resolutions
- SOP violations
- Critical customer handling errors

---

## ✅ Automated Coaching

Generates actionable coaching recommendations to help agents improve future interactions.

---

## ✅ Audit Trail

Stores structured QA evaluations in MongoDB for:

- Agent performance tracking
- Compliance reporting
- Historical audits
- Future analytics

---

# 🏗 System Architecture

```text
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
```

---

# ⚙️ Workflow

1. Receive a **petitionId** from the CRM.
2. Retrieve the corresponding conversation.
3. Detect the customer's intent.
4. Load the relevant SOP and grounding context.
5. Generate a structured prompt.
6. Evaluate the conversation using the LLM.
7. Parse the LLM response into structured JSON.
8. Store the evaluation results in MongoDB.
9. Return the QA analysis through the API.

---

# 📦 Example API Response

```json
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
```

---

# 📁 Project Structure

```text
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
```

---

# 🚀 Getting Started

## 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-crm-qa-engine
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment Variables

Create a `.env` file in the project root.

```env
PORT=5000

MONGODB_URI=your_mongodb_uri

GROQ_API_KEY=your_groq_api_key

GEMINI_API_KEY=your_gemini_api_key
```

## 4. Start the Development Server

```bash
npm run dev
```

---

# 📡 API Endpoint

### Analyze a CRM Conversation

**POST**

```http
/api/v1/orchestrator/analyzeFull
```

### Request

```json
{
    "petitionId": "PET12345"
}
```

---

# 🎯 Key Capabilities

- AI-powered conversation evaluation
- Intelligent intent detection and routing
- Category-specific SOP grounding
- Evidence-backed compliance auditing
- Automated coaching recommendations
- MongoDB audit persistence
- RESTful API architecture
- Modular MVC architecture
- Provider-based LLM integration (Groq/Gemini)

---

# 💡 Why This Project?

Customer support quality assurance traditionally relies on manually reviewing only a small percentage of customer interactions, making the process slow, inconsistent, and prone to human bias.

This project automates the QA process by leveraging Large Language Models (LLMs) to evaluate every conversation against official SOPs, extract evidence directly from the dialogue, identify compliance issues, and generate actionable coaching recommendations.

The result is a scalable, AI-powered quality assurance engine that enables faster audits, consistent evaluations, improved agent coaching, and data-driven performance monitoring.

---

# 📈 Future Enhancements

- Agent performance dashboard
- QA score generation
- Multi-language conversation support
- Real-time conversation evaluation
- Supervisor review workflow
- Analytics and reporting dashboard
- WebSocket-based live evaluation updates

---

## 👨‍💻 Author

**Pranshi Gupta**

Built as an AI-powered CRM Quality Assurance solution demonstrating modern backend architecture, LLM orchestration, SOP grounding, and automated compliance evaluation.
