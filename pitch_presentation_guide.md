# FC Central & Saathi — 10-Minute Presentation Guide (6 Slides)

**File**: [`FC_Central_Hackathon_Pitch_Deck.pptx`](file:///Users/siddhantbhanot/Developer/fc-central/FC_Central_Hackathon_Pitch_Deck.pptx)  
**Duration**: 10 Minutes (~5-6 min demo, ~4-5 min slides)  
**Tone**: Grounded, realistic, direct. Focuses strictly on the real problems we built this to solve without exaggerated statistics or corporate fluff.

---

## Judging Criteria Coverage (Quick Check)

- **Business Impact & Customer Value (30%)**: Solves slow onboarding and tribal knowledge bottlenecks in dev teams; eliminates lost client context and slow prep for banking RMs (Slides 2 & 6).
- **AI Innovation & Technical Excellence (25%)**: Multi-provider fallback (Bedrock Sonnet 4.6 $\to$ Groq/OpenAI), grounded RAG, customer-isolated vector storage (Slide 5).
- **Product Maturity, Feasibility & Scalability (20%)**: Dockerized, 100% working live MVP demonstrated end-to-end, clean modular architecture (Slides 4 & 5).
- **Risk, Security & Compliance (15%)**: Zero customer training on external LLMs, server-side secret storage, dedicated Qdrant tenant isolation (Slide 5).
- **Presentation & Storytelling (10%)**: Crisp, straightforward 6-slide narrative with clear persona walkthrough (Alex the Dev & Priya the RM) (All Slides).

---

## 10-Minute Flow

```
[0:00 - 1:00] Slide 1: Title & Overview (The 30-second summary)
[1:00 - 2:30] Slide 2: The Real Problem (Fragmented Knowledge in Dev & Banking)
[2:30 - 4:00] Slide 3: Our Solution (Two Focused Workspaces)
[4:00 - 8:00] Slide 4: LIVE DEMO (Alex in Knowledge Cafe & Priya in Saathi)
[8:00 - 9:00] Slide 5: Reliability & Architecture (Multi-Provider Fallback & Qdrant Isolation)
[9:00 - 10:00] Slide 6: Practical Value & Next Steps (Conclusion & Q&A)
```

---

### Slide 1: Title Slide (0:00 - 1:00)
- **Title**: FC Central & Saathi
- **Subtitle**: Internal Engineering Intelligence & Banking Relationship Assistant
- **What to say**:
  > *"Good morning. Today we're presenting FC Central and Saathi. At its core, this project tackles a very real problem we experience every day in both tech and banking: fragmented knowledge and lost context. We built two dedicated, role-tailored workspaces on one robust AI architecture: one for engineering, and one for banking staff. Let's look at the specific problems we set out to solve."*

---

### Slide 2: The Problem (1:00 - 2:30)
- **Engineering side**:
  - Details about microservices, APIs, and deployment parameters live in senior devs' heads or old Slack chats.
  - Onboarding takes weeks of asking senior developers basic questions.
  - Senior developers lose sprint focus answering repetitive questions.
- **Banking RM side**:
  - Customer context (past conversations, preferences, risk appetite) is scattered across notes and emails.
  - Pre-meeting prep is tedious and repetitive.
  - When an RM leaves or hands over a portfolio, relationship history gets lost.
- **What to say**:
  > *"Here is the real problem we see daily. On the tech side, our services have complex business logic and deployment pipelines. When a new engineer joins, they spend weeks bugging senior developers on Slack just to figure out how things work. On the banking frontline, Relationship Managers speak to dozens of clients. Important details about a client's upcoming plans or preferences get lost in notebooks or email threads. And when an account changes hands, the new RM has to start from scratch. Both problems come down to the same root issue: accessing grounded, organized knowledge when you need it."*

---

### Slide 3: The Solution (2:30 - 4:00)
- **Engineering Workspace**:
  - **Dev Chat**: Ask questions about microservices, get answers backed by verified source code citations.
  - **Knowledge Cafe**: University-style courses (Jenkins Pipelines, Income Assessment) with clear syllabi and interactive quizzes.
  - **Architecture Diagrams**: Automatically rendered visual flowcharts for pipelines and service flows.
- **Saathi (Banking Workspace)**:
  - **Customer AI Brief**: Instant snapshot of portfolio, liquid assets, and risk category.
  - **Ask Saathi**: Ask client-specific questions with fast streaming answers.
  - **Add Live Context**: Add a note after a call (e.g. 'Daughter moving to UK in fall'); AI remembers it immediately.
  - **Banking Courses**: Modules for credit underwriting, NRI wealth, and KYC/AML compliance.
- **What to say**:
  > *"Instead of creating a confusing all-in-one screen, we built two purpose-tailored workspaces. For developers: Dev Chat gives code-grounded answers with real file links, and Knowledge Cafe turns runbooks into self-paced courses with interactive quizzes and visual flowcharts. For banking staff: you land directly in Saathi. You pick a client, get an instant AI profile, and can ask questions about them. Best of all, you can add notes on the fly right from the UI, and the AI remembers it for all future answers. Let's show you this live."*

---

### Slide 4: Live Product Walkthrough (4:00 - 8:00)
- **Demo Script**:
  1. **Dev Workspace** (`engineer@freecharge.com`):
     - Open Knowledge Cafe $\to$ *Jenkins Deployment Pipelines* $\to$ Lesson 8 (*Release Process*).
     - Point out the rendered visual flowchart showing SIT, QA, and Sandbox gates.
     - Switch to Dev Chat $\to$ Ask: *"What are the main endpoints and business rules for income-assessment?"*
     - Show the returned file path and schema citation.
  2. **Banking Workspace** (`rm@axisbank.com`):
     - Switch login to banking staff $\to$ UI loads directly into Saathi.
     - Select client **Vikram Malhotra** $\to$ Show instant AI Brief (portfolio size, asset mix, risk profile).
     - Click **`+ Add Context`** $\to$ Type: *"Client plans to fund daughter's UK higher education in Sept 2026; needs remittance advisory and tax clearance."*
     - Hit Save.
     - In **Ask Saathi**, ask: *"What should I pitch Vikram for his upcoming UK education expenses?"*
     - Show the streaming response using AWS Bedrock Sonnet 4.6 referencing his liquid funds and recommending remittance advisory based on the note we just added.

---

### Slide 5: Reliability & Architecture (8:00 - 9:00)
- **Multi-Provider LLM Fallback**: AWS Bedrock Sonnet 4.6 as primary, with automatic failover to Groq / OpenAI so the UI never breaks.
- **Customer-Isolated Vector Storage**: Qdrant vector database with dedicated collections per customer — zero risk of cross-customer data leakage.
- **Security & Privacy**: No client data used to train public models; server-side secret management.
- **Dockerized**: FastAPI backend, React frontend, Qdrant, and SQLite all run together via Docker Compose.
- **What to say**:
  > *"Under the hood, we focused on reliability: First, multi-provider fallback. If AWS Bedrock throttles or times out during high load, our adapter transparently falls back to Groq or OpenAI — the user never sees a broken screen. Second, security. In Qdrant, each customer's data has dedicated collection and payload filtering, so Customer A's notes cannot bleed into Customer B's answers. And finally, the whole stack is cleanly structured and Dockerized, ready to run on Day 1."*

---

### Slide 6: Practical Value & Logical Next Steps (9:00 - 10:00)
- **What It Delivers Today**:
  - Independent developer ramp-up with less senior engineer interruption.
  - Instant client prep for RMs and zero lost context across account handovers.
- **Where It Goes Next**:
  - Webhooks from Git/Jenkins to auto-update Knowledge Cafe courses as code changes.
  - Direct read-sync with Core Banking (Finacle) and CRM systems.
  - Voice memo transcription directly into client vector memory.
- **What to say**:
  > *"To wrap up: FC Central and Saathi solves two genuine, practical friction points. It frees up developers and gets them onboarded faster, while giving banking relationship managers instant context so they're always prepared. It's built cleanly, it's reliable, and it's working live today. Thank you, and we're happy to take your questions!"*
