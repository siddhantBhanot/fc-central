---
id: income-assessment-kt
title: Income Assessment — KT
description: Learn the architecture, workflows, business logic, external integrations, and important code paths for income-assessment-service.
target_service: income-assessment-service
domain: Banking & Credit Microservices
target_audience: New Backend & Fullstack Engineers
difficulty: Intermediate
estimated_duration: 1.5 hours
icon: Layers
tags:
  - Spring Boot
  - WebFlux
  - MongoDB
  - Kafka
  - Integrations
---

# Income Assessment — Knowledge Transfer Curriculum

## 01. Service Overview
- **Summary**: Business domain responsibility, statement-based vs ITR-based assessment journeys, and core system goals.
- **Context**:
  - lessons/01-service-overview/01-overview.md
  - lessons/01-service-overview/02-business-domain.md
- **Knowledge Check**:
  - **Question**: Which of the following best describes the core business responsibility of income-assessment-service?
  - **Type**: multiple_choice
  - **Options**:
    - Debit/credit card authorization and merchant settlement
    - [x] End-to-end income verification and assessment via bank statements and ITR returns
    - Customer biometric face verification and identity deduplication
    - Real-time loan ledger journal entry postings
  - **Explanation**: income-assessment-service acts as a stateful orchestrator evaluating applicant income profiles from bank statements (Perfios/AA) and tax records (ITR) to compute financial eligibility.

## 02. Architecture
- **Summary**: High-level runtime architecture, Spring WebFlux non-blocking execution model, and layer-by-layer request journey.
- **Context**:
  - lessons/02-architecture/01-architecture-overview.md
  - lessons/02-architecture/02-component-responsibilities.md
  - lessons/02-architecture/03-architecture-diagram.md
- **Knowledge Check**:
  - **Question**: What reactive runtime framework powers income-assessment-service?
  - **Type**: multiple_choice
  - **Options**:
    - Django ASGI with Celery workers
    - [x] Spring Boot with Spring WebFlux (Project Reactor)
    - Express.js with Node cluster
    - Ruby on Rails with Puma
  - **Explanation**: The service is implemented in Kotlin using Spring WebFlux for reactive, non-blocking HTTP request processing and downstream service orchestration.

## 03. Request Lifecycle
- **Summary**: Tracing incoming requests from UI gateways through controllers, KeyData contextual wrappers, and version dispatchers.
- **Context**:
  - lessons/03-request-lifecycle/01-initiation-flow.md
  - lessons/03-request-lifecycle/02-request-lifecycle.md
  - lessons/03-request-lifecycle/03-four-wheeler-flow.md
- **Knowledge Check**:
  - **Question**: What is the purpose of KeyData in the income-assessment-service request pipeline?
  - **Type**: multiple_choice
  - **Options**:
    - Storing sensitive cryptographic private keys for AES encryption
    - [x] Encapsulating request-scoped identifiers (appId, journeyId, user context) across orchestrator layers
    - Managing database connection pool credentials
    - Caching Redis auth tokens for third-party sessions
  - **Explanation**: KeyData acts as the immutable request context wrapper carrying applicationId, applicant details, and correlation IDs through controllers, resolvers, and business handlers.

## 04. Business Logic
- **Summary**: Business rule engine, CommonVersionResolver implementation selection, and journey-specific assessment handlers.
- **Context**:
  - lessons/04-business-logic/01-rule-engine.md
  - lessons/04-business-logic/02-version-resolver.md
  - lessons/04-business-logic/03-assessment-handlers.md
- **Knowledge Check**:
  - **Question**: How does CommonVersionResolver select which business assessment handler executes a request?
  - **Type**: multiple_choice
  - **Options**:
    - By selecting a random handler from a round-robin pool
    - [x] By evaluating product journey type, incoming version headers, and feature configuration flags
    - By querying the user's mobile operating system
    - By calling an external Python machine learning microservice
  - **Explanation**: CommonVersionResolver inspects product journey identifiers (e.g. FOUR_WHEELER_PERSONAL) and tenant configuration to route requests to the appropriate V1 or Revamped V2 assessment handler.

## 05. External Integrations
- **Summary**: Integration ecosystems including Perfios (bank statements), Zenith AA-Orch (Account Aggregator), CAP, and Finacle.
- **Context**:
  - lessons/05-external-integrations/01-perfios-integration.md
  - lessons/05-external-integrations/02-zenith-account-aggregator.md
  - lessons/05-external-integrations/03-cap-finacle-integration.md
- **Knowledge Check**:
  - **Question**: Which integration is utilized for Account Aggregator (AA) consent flows and bank statement fetch?
  - **Type**: multiple_choice
  - **Options**:
    - Razorpay Route
    - [x] Zenith / AA-Orch
    - Twilio Verify
    - Salesforce Service Cloud
  - **Explanation**: Zenith (AA-Orch) manages consent artifacts, financial information provider (FIP) discovery, and secure electronic statement pulling via Account Aggregators.

## 06. Important Code Paths
- **Summary**: Code navigation map: ApplicationController, orchestrator services, WebClient builders, and MongoDB repository patterns.
- **Context**:
  - lessons/06-important-code-paths/01-controllers-and-ingress.md
  - lessons/06-important-code-paths/02-service-orchestrators.md
  - lessons/06-important-code-paths/03-persistence-mongo-kafka.md
- **Knowledge Check**:
  - **Question**: Which Kotlin controller serves as the primary ingress point for assessment initiation?
  - **Type**: multiple_choice
  - **Options**:
    - [x] ApplicationController
    - HealthCheckController
    - PaymentCallbackController
    - TokenAuthController
  - **Explanation**: ApplicationController hosts the primary `/initiation-application`, `/generate-link`, and assessment query endpoints.

## 07. Configuration
- **Summary**: Spring application.yml hierarchies, environment-specific overrides, Kafka topic properties, and timeout tuning.
- **Context**:
  - lessons/07-configuration/01-spring-profiles-and-yml.md
  - lessons/07-configuration/02-feature-flags-and-secrets.md
- **Knowledge Check**:
  - **Question**: Where are external integration URLs and read/connect timeouts configured?
  - **Type**: multiple_choice
  - **Options**:
    - Hardcoded directly in Kotlin WebClient companion objects
    - [x] Externalized in application.yml properties mapped to @ConfigurationProperties classes
    - Stored in a browser cookie
    - Passed as URL query parameters from the frontend
  - **Explanation**: In accordance with 12-factor principles, all endpoints, timeouts, and credentials are configuration-driven via Spring application.yml and environment variables.

## 08. Troubleshooting
- **Summary**: Common production issues, Perfios callback timeouts, MongoDB connection drops, and runbook triaging workflows.
- **Context**:
  - lessons/08-troubleshooting/01-common-failure-modes.md
  - lessons/08-troubleshooting/02-runbook-and-triage.md
  - lessons/08-troubleshooting/03-health-checks-and-metrics.md
- **Knowledge Check**:
  - **Question**: What should an engineer inspect first when assessment status remains stuck in 'IN_PROGRESS'?
  - **Type**: multiple_choice
  - **Options**:
    - The browser CSS stylesheets
    - [x] Webhook callback logs, Kafka consumer group lag, and downstream Perfios transaction status
    - The frontend bundle size
    - The DNS registrar configuration
  - **Explanation**: Stuck assessments usually indicate either a delayed third-party statement callback from Perfios or consumer lag on Kafka event notification topics.

## 09. End-to-End Journey
- **Summary**: Comprehensive walkthrough of a real statement assessment journey: from initiation and user link upload to webhook callback and final credit score report.
- **Context**:
  - lessons/09-end-to-end-journey/01-statement-assessment-journey.md
  - lessons/09-end-to-end-journey/02-itr-assessment-journey.md
- **Knowledge Check**:
  - **Question**: What event signals completion of a statement-based assessment to downstream loan underwriters?
  - **Type**: multiple_choice
  - **Options**:
    - A direct telephone SMS trigger
    - [x] An asynchronous Kafka event emitted on the income assessment outcome topic
    - A manual database row update by developers
    - A HTTP polling loop from the mobile client
  - **Explanation**: The orchestrator emits an event on the designated Kafka outcome topic containing calculated salary, average monthly balance, and fraud risk indicators.

## 10. Knowledge Check
- **Summary**: Final comprehensive assessment testing your mastery across architecture, business handlers, integrations, and debugging.
- **Context**:
  - lessons/10-knowledge-check/01-assessment-rubric.md
- **Knowledge Check**:
  - **Question**: If a new journey 'TWO_WHEELER_COMMERCIAL' needs to be added, what is the architectural procedure?
  - **Type**: multiple_choice
  - **Options**:
    - Rewrite the entire Spring Boot application from scratch
    - [x] Implement AssessmentHandler, register it in Spring context, and update CommonVersionResolver routing logic
    - Directly modify the MongoDB schema collection indexes
    - Create a separate Kubernetes cluster for the new journey
  - **Explanation**: The modular design allows adding new journeys cleanly by implementing `AssessmentHandler` and configuring `CommonVersionResolver` without altering existing journey handlers.
