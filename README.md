# FC Central

> **Engineering Intelligence Platform for Microservices**

FC Central is an internal engineering intelligence platform designed to help developers understand and work with complex microservice systems faster.

It uses **Retrieval-Augmented Generation (RAG)** to combine internal engineering documentation and source code with LLMs, enabling developers to ask questions about APIs, business logic, request flows, integrations, and implementation details.

The initial implementation focuses on:

**`income-assessment-service`**

---

## Why FC Central?

Understanding an unfamiliar microservice often requires developers to go through multiple sources:

* Source code
* API contracts
* Technical documentation
* Business logic
* Integration details
* Request/response flows
* Historical knowledge

FC Central brings this knowledge together into a single developer-facing interface.

Example questions:

```text
What is the business handler for FOUR_WHEELER_PERSONAL?

What API contract is currently being used for /initiation-application?

What is the overall flow from income-assessment-ui to the backend?

What happens after /generate-link is called for Perfios Bank Statement assessment?

Which services integrate with CAP?
```

---

## Architecture

```text
                         ┌─────────────────────┐
                         │     Developer       │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │  Next.js Frontend   │
                         │    (Local Docker)   │
                         └──────────┬──────────┘
                                    │
                              REST / SSE
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    FastAPI Backend  │
                         │    (Local Docker)   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │     RAG Service     │
                         │     LlamaIndex     │
                         └──────┬───────┬──────┘
                                │       │
                    ┌───────────┘       └────────────┐
                    ▼                                ▼
             ┌─────────────┐                 ┌─────────────┐
             │ Qdrant Cloud│                 │ Amazon      │
             │ Vector DB   │                 │ Bedrock     │
             └─────────────┘                 │             │
                                             │ Qwen LLM    │
                                             │ Titan Embed │
                                             └─────────────┘
```

---

## Technology Stack

### Frontend

* Next.js
* React
* TypeScript
* Server-Sent Events (SSE) for streaming responses

### Backend

* Python
* FastAPI
* Pydantic

### RAG

* LlamaIndex
* Qdrant Cloud
* Amazon Bedrock
* Qwen models
* Amazon Titan Text Embeddings V2

### Knowledge Sources

* Markdown engineering documentation
* Spring Boot + Kotlin source code
* Future: Confluence and other engineering knowledge sources

### Infrastructure

* Docker
* Docker Compose
* Local application execution
* Managed cloud inference through Amazon Bedrock

---

## Knowledge Pipeline

FC Central indexes both **documentation and source code**.

```text
Markdown Documentation
        │
        ▼
   Document Loader
        │
        ▼
Semantic Chunking
        │
        ▼
Titan Text Embeddings V2
        │
        ▼
     Qdrant
        │
        │
Kotlin Source Code
        │
        ▼
Code-aware Chunking
        │
        ▼
Titan Text Embeddings V2
        │
        ▼
     Qdrant
```

At query time:

```text
Developer Question
        │
        ▼
Query Processing
        │
        ▼
Qdrant Retrieval
        │
        ▼
Relevant Documentation
        +
Relevant Kotlin Code
        │
        ▼
Context Assembly
        │
        ▼
Qwen LLM via Bedrock
        │
        ▼
Grounded Streaming Response
        │
        ▼
Answer + Sources
```

---

## Initial Knowledge Scope

The initial knowledge base is limited to:

```text
income-assessment-service
```

The source code is implemented using:

* Kotlin
* Spring Boot

Knowledge is logically isolated using service-level metadata so that additional microservices can be introduced later without requiring a separate architecture.

---

## Key Features

* 🔎 **Engineering knowledge search** across documentation and source code
* 💬 **Natural-language developer queries**
* ⚡ **Streaming responses** using SSE
* 📚 **Source citations** for grounded answers
* 🔧 **Kotlin/Spring Boot code understanding**
* 🧩 **Microservice selector**
* 📝 **Conversation history**
* 👍 **Developer feedback**
* 📥 **Add to Knowledge Base** through Confluence
* 🐳 **Dockerized local application**
* 🔌 **Provider abstraction** for future LLM/vector database changes

---

## Provider Flexibility

External providers are isolated behind adapters/interfaces.

The initial configuration uses:

```text
LLM          → Amazon Bedrock / Qwen
Embeddings   → Amazon Bedrock / Titan Text Embeddings V2
Vector DB    → Qdrant Cloud
```

The architecture is designed to allow future providers such as:

```text
LLM:
  Amazon Bedrock
  Google Gemini
  Groq

Vector Database:
  Qdrant
  Other vector stores
```

Changing providers should primarily require implementing/configuring an adapter rather than rewriting the RAG pipeline.

---

## Project Structure

```text
fc-central/
│
├── frontend-service/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── ...
│
├── backend-service/
│   ├── app/
│   │   ├── api/
│   │   ├── application/
│   │   ├── domain/
│   │   └── infrastructure/
│   └── ...
│
├── rag-service/
│   ├── ingestion/
│   ├── retrieval/
│   ├── providers/
│   ├── prompts/
│   └── ...
│
├── knowledge/
│   └── income-assessment-service/
│
├── docker-compose.yml
└── README.md
```

The exact structure may evolve during development.

---

## Running Locally

### Prerequisites

* Docker
* Docker Compose
* AWS account with Amazon Bedrock access
* Qdrant Cloud account
* Required AWS/Qdrant credentials

### Configuration

Create the required environment files from the provided examples:

```bash
cp .env.example .env
```

Configure the required values, including:

```text
AWS_REGION
LLM_PROVIDER
LLM_MODEL
EMBEDDING_PROVIDER
EMBEDDING_MODEL
QDRANT_URL
QDRANT_API_KEY
```

Never commit credentials or `.env` files containing secrets.

### Start the application

```bash
docker compose up --build
```

The frontend and backend will run locally, while managed services such as Amazon Bedrock and Qdrant Cloud remain external.

---

## Development Principles

FC Central follows a few core principles:

* Keep services modular and independently maintainable.
* Prefer simple, well-defined abstractions.
* Keep external providers behind adapters.
* Keep API contracts explicit and stable.
* Keep frontend independent of infrastructure providers.
* Prefer source-grounded answers over unsupported assumptions.
* Preserve source provenance for retrieved knowledge.
* Avoid unnecessary infrastructure and over-engineering.

---

## MVP Scope

The initial MVP focuses on proving that developers can reliably use natural-language queries to understand `income-assessment-service`.

### MVP priorities

1. High-quality document/code ingestion
2. Accurate retrieval
3. Grounded LLM responses
4. Source citations
5. Streaming chat experience
6. Developer feedback
7. Dockerized local execution

Future capabilities may include:

* Additional microservices
* Confluence synchronization
* Git repository synchronization
* Hybrid search
* Reranking
* Query rewriting
* Kibana/Elastic log analysis
* AI-assisted incident investigation
* Proactive RCA
* Metrics and trace correlation

---

## Project Status

🚧 **Active Development — Hackathon MVP**

The initial implementation is focused on `income-assessment-service`. The architecture is intentionally designed to evolve into a broader engineering intelligence platform across microservices.
