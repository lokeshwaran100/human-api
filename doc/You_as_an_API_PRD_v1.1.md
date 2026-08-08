# PRD — You as an API

**Product name:** You as an API  
**Working codename:** HumanAPI  
**Version:** 1.1  
**Status:** Implementation Ready  
**Target:** Hackathon MVP  
**Primary implementation environment:** Antigravity  
**AI reasoning engine:** Claude  
**Primary demo:** AI Travel Agent → Personal Decision API

---

# 1. Product Overview

## 1.1 Product Summary

**You as an API** is an AI-native personal decision layer that allows external applications and AI agents to interact with a user's **preferences, policies, constraints, and decision-making** without directly accessing the user's private data.

The product turns a human into a programmable interface.

Instead of external applications repeatedly asking users what they want, they can query the user's Personal Agent:

> "Would this user accept this flight?"

The Personal Agent evaluates the request using:

- User preferences
- User-defined policies
- Relevant context
- Permissions
- Memory
- Claude's reasoning capabilities

It returns one of:

- `APPROVE`
- `REJECT`
- `ASK_USER`

The external agent receives the decision and only the information necessary to act.

---

# 2. Problem Statement

Modern software requires humans to repeatedly make decisions that could often be delegated.

Examples:

- Which flight should I book?
- Which hotel should I choose?
- Can this meeting be scheduled?
- Should I buy this product?
- Should I accept this offer?
- Is this expense allowed?

Current AI assistants primarily work as:

```text
Human → AI Assistant → Application
```

The user still has to initiate the interaction.

The next generation of software will increasingly be operated by **AI agents**, creating a different problem:

```text
AI Agent → Human → Decision
```

Agents need a reliable way to understand and act according to an individual's preferences and boundaries.

There is currently no simple interface for:

> **"Ask my AI agent what I would decide, while respecting my permissions and privacy."**

---

# 3. Product Vision

## 3.1 Vision Statement

> **Make every human programmable.**

Not by exposing everything about a person, but by allowing people to define:

- What they prefer
- What they allow
- What they reject
- What their agent can decide
- What requires human approval

The long-term architecture is:

```text
                         HUMAN
                           │
                           ▼
                 ┌──────────────────┐
                 │  Personal Agent  │
                 │     Claude       │
                 └────────┬─────────┘
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
        Travel Agent  Shopping Agent  Work Agent
             │            │            │
             └────────────┼────────────┘
                          │
                     Decisions
```

---

# 4. Product Thesis

The product is **not**:

- Another chatbot
- Another personal assistant
- Another preference database
- Another AI travel agent

The product is:

> **A programmable interface to human intent.**

Traditional APIs expose:

```text
Data
Resources
Actions
```

HumanAPI exposes:

```text
Preferences
Policies
Decisions
Delegated Authority
```

---

# 5. Hackathon MVP

The MVP demonstrates one complete scenario:

### Travel Agent → HumanAPI → Decision

A simulated external Travel Agent searches for flights and asks the user's Personal Agent whether each flight should be accepted.

```text
Travel Agent
     │
     │ Flight offer
     ▼
HumanAPI
     │
     ├── Preferences
     ├── Policies
     ├── Context
     └── Claude
           │
           ▼
       Decision
     ┌─────┼─────┐
     ▼     ▼     ▼
 APPROVE  ASK  REJECT
```

The MVP must also demonstrate how the user's preference model is initially created, reviewed, updated, and learned from user corrections.

---

# 6. Goals

## 6.1 Primary Goals

### G1 — Personal Decision API

Allow external agents to submit a decision request.

```http
POST /api/v1/decisions
```

### G2 — Preference Model

Allow users to establish preferences through:

1. AI-assisted onboarding
2. Direct editing
3. Conversational updates
4. Explicit corrections after decisions

### G3 — Decision Policies

Allow users to define rules governing autonomous decisions.

Example:

```text
Flight < ₹50,000
→ Automatically approve if preferences match

Flight ₹50,000–₹70,000
→ Ask user

Flight > ₹70,000
→ Reject
```

### G4 — Claude Reasoning

Use Claude for semantic reasoning over:

- Request
- Preferences
- Policies
- Relevant context

Claude is the reasoning engine, not the source of truth for authorization.

### G5 — Permission Control

The user controls what the Personal Agent can:

- Read
- Decide
- Execute

### G6 — Privacy

External agents should receive the **decision**, not the user's underlying private data.

### G7 — Explainability

Every decision should include a human-readable explanation.

### G8 — Preference Transparency

The user must be able to see:

- What the agent knows
- Where it came from
- How confident the system is
- Whether it was explicitly provided or inferred

### G9 — Preference Evolution

The Personal Agent should support a controlled feedback loop where users can correct or confirm inferred preferences.

---

# 7. Non-Goals

The MVP must NOT attempt to build:

- Real banking integrations
- Real financial transactions
- Production identity infrastructure
- Full OAuth implementation
- Decentralized identity
- Blockchain integration
- Full agent marketplace
- General-purpose autonomous browser
- Real airline booking
- Fully autonomous purchasing
- Multi-user enterprise administration
- Production-grade compliance
- Autonomous model retraining
- Complex vector memory infrastructure

These can be future roadmap items.

---

# 8. Target Users

## 8.1 Primary User — Individual

A person who wants AI agents to make bounded decisions on their behalf.

Example:

> "I want my travel agent to know what flights I'd accept without giving it access to everything about me."

## 8.2 Secondary User — External AI Agent

An AI agent that needs to interact with a human.

Examples:

- Travel Agent
- Shopping Agent
- Scheduling Agent
- Recruitment Agent
- Procurement Agent

For the MVP, only the **Travel Agent** is required.

---

# 9. Core Concepts

## 9.1 Personal Agent

The AI agent representing the user.

Responsibilities:

- Understand preferences
- Evaluate policies
- Reason over requests
- Make decisions
- Request human approval
- Explain decisions
- Propose preference updates when appropriate

Claude is the reasoning engine.

---

## 9.2 Preference

A preference describes what the user generally likes, dislikes, prioritizes, or tends to choose.

Examples:

```text
Preferred airline: Singapore Airlines
Preferred seat: Aisle
Prefer direct flights
Normal flight budget: ₹60,000
```

Preferences are generally **soft constraints** unless explicitly converted into policies.

---

## 9.3 Policy

A policy defines a hard boundary or delegated authority.

Example:

```text
Never approve a flight above ₹75,000.
```

Policies must be evaluated deterministically before Claude.

---

## 9.4 Decision Request

An external agent submits a structured request.

```json
{
  "type": "flight_purchase",
  "requester": {
    "agent_id": "travel-agent-001"
  },
  "subject": {
    "origin": "BLR",
    "destination": "NRT",
    "date": "2026-10-12"
  },
  "offer": {
    "airline": "Singapore Airlines",
    "price": 54000,
    "currency": "INR",
    "stops": 0,
    "seat": "aisle"
  }
}
```

---

## 9.5 Decision

The Personal Agent returns:

```json
{
  "decision": "APPROVE",
  "confidence": 0.94,
  "reason": "Within budget, direct flight, preferred airline and aisle seat.",
  "requires_user_action": false
}
```

Possible decisions:

```text
APPROVE
REJECT
ASK_USER
```

---

## 9.6 Permission

Permission controls what an external agent can request and what the Personal Agent can do.

Example:

```text
Travel Agent

Read:
✓ Travel preferences

Request decisions:
✓ Flight purchases

Read:
✗ Bank balance

Execute purchase:
✗

Maximum autonomous purchase:
₹50,000
```

---

# 10. Preference Acquisition

Preference acquisition is a first-class part of the product.

The system must support four sources:

```text
1. USER_EXPLICIT
2. USER_CORRECTION
3. AI_INFERRED
4. IMPORTED
```

For the hackathon, the first three are required.

---

# 11. Initial Preference Onboarding

The user should not be forced to complete a long form.

The preferred onboarding experience is an **AI-assisted conversational interview**.

Example:

**Agent:**

> When choosing flights, what matters most to you?

**User:**

> Price is important, but I'll pay more for a direct flight. I usually prefer Singapore Airlines or Emirates.

The AI extracts structured preferences.

```json
{
  "category": "travel",
  "preferences": [
    {
      "key": "preferred_airlines",
      "value": ["Singapore Airlines", "Emirates"],
      "type": "soft",
      "confidence": 0.98
    },
    {
      "key": "prefer_direct",
      "value": true,
      "type": "soft",
      "confidence": 0.95
    }
  ]
}
```

The system must show the extracted preferences to the user for confirmation before activating them.

---

# 12. Onboarding Flow

```text
User starts onboarding
        ↓
AI asks a small number of questions
        ↓
User responds naturally
        ↓
Claude extracts candidate preferences
        ↓
System displays structured interpretation
        ↓
User confirms / edits
        ↓
Preferences become ACTIVE
```

Example confirmation:

```text
I understood that you:

✓ Prefer Singapore Airlines
✓ Prefer Emirates
✓ Prefer direct flights
✓ Are willing to pay more for direct flights

[Confirm] [Edit]
```

---

# 13. Preference Storage

Preferences must contain richer metadata than a simple key/value pair.

## `preferences`

```text
id
user_id
category
key
value
source
confidence
importance
status
created_at
updated_at
```

Example:

| Field | Value |
|---|---|
| category | travel |
| key | preferred_airlines |
| value | ["Singapore Airlines", "Emirates"] |
| source | USER_EXPLICIT |
| confidence | 0.98 |
| importance | HIGH |
| status | ACTIVE |

### `source`

Allowed values:

```text
USER_EXPLICIT
USER_CORRECTION
AI_INFERRED
IMPORTED
```

### `status`

Allowed values:

```text
PROPOSED
ACTIVE
ARCHIVED
REJECTED
```

---

# 14. Preference vs Policy

This distinction is fundamental.

Example preference:

> "I usually don't spend more than ₹60K on flights, but I'd pay more for a really good direct flight."

This becomes a preference.

Example policy:

> "Never book a flight above ₹75K without asking me."

This becomes a policy.

Storage must keep these concepts separate.

```text
USER
 │
 ├── Preferences
 │     ├── Likes
 │     ├── Dislikes
 │     ├── Priorities
 │     └── Tendencies
 │
 └── Policies
       ├── Allow
       ├── Deny
       └── Require approval
```

---

# 15. Preference Transparency

The dashboard must contain a section such as:

## "What my agent knows about me"

Example:

```text
Travel Preferences

Preferred airlines
Singapore Airlines, Emirates
Source: You
Confidence: High

Prefer direct flights
Yes
Source: You
Confidence: High

Preferred seat
Aisle
Source: You
Confidence: High

Normal flight budget
₹60,000
Source: You
Confidence: High
```

Users must be able to:

- Edit
- Delete
- Archive
- View source
- View confidence
- View change history

---

# 16. Updating Preferences

The system must support three primary update mechanisms.

## A. Direct Editing

User edits a preference in the dashboard.

Example:

```text
₹60,000
```

becomes:

```text
₹75,000
```

The update must create a preference version.

---

## B. Conversational Update

User tells the agent:

> "I've started preferring Qatar Airways recently."

Claude detects a preference update and proposes:

```text
I'll update your travel preferences:

Add:
Qatar Airways

Current preferred airlines:
Singapore Airlines
Emirates

[Confirm] [Cancel]
```

Only after confirmation does the preference become active.

---

## C. Correction After a Decision

Example:

Agent rejects:

```text
Singapore Airlines
₹65K
Direct
```

User says:

> "Actually, I'd happily pay ₹65K for a direct Singapore flight."

The agent identifies that this may represent a lasting preference change.

It asks:

```text
Should I remember this for future decisions?

[Just this time] [Remember this]
```

If the user chooses **Remember this**, a preference update is created.

---

# 17. Preference Learning

The system must NOT silently modify active preferences based on behavior.

Example:

User purchases an expensive flight once.

The system must not automatically conclude:

> "User likes expensive flights."

Instead it can create an inference:

```text
Observed:
User purchased ₹72K flight.

Possible preference:
User may be willing to exceed normal budget
for a direct flight.

Confidence:
0.41

Status:
PROPOSED
```

The user must confirm before it becomes active.

---

# 18. Preference Suggestions / Inbox

The product should provide a lightweight **Preference Suggestions** section.

Example:

```text
Preference suggestion

You chose direct flights 4 out of your
last 5 selections.

Should I remember:

"Prefer direct flights even when they
cost up to ₹10K more."

[Remember] [Ignore]
```

This makes the Personal Agent a **living representation** rather than a static profile.

---

# 19. Preference Lifecycle

Every preference follows:

```text
DISCOVERED
    ↓
PROPOSED
    ↓
CONFIRMED
    ↓
ACTIVE
    ↓
UPDATED
    ↓
ARCHIVED
```

No AI-inferred preference should silently become active.

---

# 20. Preference Versioning

Preference changes must be auditable.

Instead of overwriting:

```text
₹60K → ₹75K
```

store:

```text
Version 1
₹60K
Created: Aug 8

Version 2
₹75K
Updated: Aug 20
```

The user should eventually be able to revert to an earlier version.

For the MVP, viewing history is required; rollback is optional.

---

# 21. Decision Priority Hierarchy

The decision engine must use the following hierarchy:

```text
1. Explicit hard policy
2. Explicit user preference
3. User correction
4. Confirmed learned preference
5. AI inference
6. General reasoning
```

The key principle:

> **User explicit input always wins.**

AI inference must never silently override explicit preferences or policies.

---

# 22. Travel Preferences

The MVP should provide predefined travel preference fields.

### Required

- Maximum normal flight budget
- Preferred airlines
- Maximum number of stops
- Preferred seat
- Preferred cabin class
- Preferred departure time
- Maximum flight duration
- Preference for direct vs connecting flights

### Optional

- Preferred airport
- Avoid airlines
- Preferred aircraft
- Baggage requirement

---

# 23. Policy Management

Users must be able to create policies.

Example:

```text
Flight purchases

[ Automatically approve ]
When:
Price <= ₹50,000

AND

Stops <= 1

AND

Preferred airline = true
```

Another:

```text
[ Ask me ]
When:
Price > ₹50,000
AND
Price <= ₹70,000
```

Another:

```text
[ Reject ]
When:
Price > ₹70,000
```

---

# 24. Policy Priority

Policy evaluation order:

```text
1. Hard Deny
2. Hard Allow
3. User Approval Required
4. Preferences
5. Claude Reasoning
```

A hard policy must not be overridden by Claude.

---

# 25. Decision Engine

The decision engine consists of five stages:

```text
Request
   ↓
Validate
   ↓
Permission Check
   ↓
Policy Evaluation
   ↓
Preference Retrieval
   ↓
Claude Reasoning
   ↓
Decision
   ↓
Audit Log
```

---

# 26. Stage 1 — Request Validation

Validate:

- Request type
- Requester
- Required fields
- Data types
- Currency
- Offer information

Invalid requests return:

```http
400 Bad Request
```

---

# 27. Stage 2 — Permission Check

Verify that the requesting agent is allowed to request the decision type.

Example:

```text
Travel Agent
→ flight_purchase
✓ Allowed
```

Unauthorized requests:

```text
Travel Agent
→ bank_transfer
✗ Not allowed
```

Return:

```json
{
  "decision": "REJECT",
  "reason": "Requester does not have permission to request this decision type."
}
```

---

# 28. Stage 3 — Policy Evaluation

Evaluate deterministic policies before invoking Claude.

Example:

```text
Offer = ₹80K

Policy:
> ₹70K → Reject
```

Result:

```text
REJECT
```

Claude does not need to be called.

This makes the system safer and predictable.

---

# 29. Stage 4 — Preference Retrieval

Retrieve only the preferences relevant to the decision.

For a flight request, include:

- Budget
- Airlines
- Stops
- Seat
- Cabin
- Direct-flight preference
- Relevant travel policies

Do not send unrelated personal information to Claude.

---

# 30. Stage 5 — Claude Reasoning

If deterministic policies do not produce a final decision, Claude evaluates the request.

Claude receives:

```text
SYSTEM POLICY

USER PREFERENCES

RELEVANT CONTEXT

REQUEST

AVAILABLE AUTHORITY
```

Claude must return structured JSON.

Example:

```json
{
  "decision": "APPROVE",
  "confidence": 0.92,
  "reason": "The offer matches the user's stated travel preferences and is within the autonomous purchase threshold.",
  "matched_preferences": [
    "Preferred airline",
    "Direct flight",
    "Aisle seat"
  ],
  "matched_policies": [
    "Autonomous travel purchase under ₹50,000"
  ],
  "requires_user_action": false
}
```

---

# 31. Claude Output Constraints

Claude must never:

- Invent preferences
- Override hard policies
- Invent permissions
- Expose private context
- Execute unauthorized actions
- Return unstructured output

If insufficient information exists:

```text
ASK_USER
```

---

# 32. External Agent API

## POST `/api/v1/decisions`

Submit a decision request.

### Request

```json
{
  "request_id": "req_123",
  "agent_id": "travel-agent-001",
  "decision_type": "flight_purchase",
  "payload": {
    "origin": "BLR",
    "destination": "NRT",
    "date": "2026-10-12",
    "airline": "Singapore Airlines",
    "price": 54000,
    "currency": "INR",
    "stops": 0,
    "seat": "aisle",
    "cabin": "economy"
  }
}
```

### Response

```json
{
  "request_id": "req_123",
  "decision": "APPROVE",
  "confidence": 0.94,
  "reason": "Matches travel preferences and is within the autonomous purchase threshold.",
  "requires_user_action": false
}
```

---

# 33. Decision Status API

## GET `/api/v1/decisions/{request_id}`

Returns:

```json
{
  "request_id": "req_123",
  "status": "completed",
  "decision": "APPROVE",
  "created_at": "...",
  "completed_at": "..."
}
```

---

# 34. User Approval API

## POST `/api/v1/decisions/{request_id}/approve`

Used when decision is:

```text
ASK_USER
```

The user can explicitly approve or reject.

---

# 35. Agent Registration

## POST `/api/v1/agents`

Example:

```json
{
  "name": "Travel Agent",
  "description": "Finds and evaluates flights",
  "capabilities": [
    "flight_search",
    "flight_purchase"
  ]
}
```

The system generates:

```text
agent_id
agent_secret
```

For the hackathon, authentication can be simplified to API keys.

---

# 36. Agent Permissions

Each agent has capabilities.

Example:

```json
{
  "agent_id": "travel-agent-001",
  "permissions": [
    "decision:flight_purchase"
  ]
}
```

---

# 37. Privacy Model

The system must follow **minimum necessary disclosure**.

External agents should NOT receive:

- Full user profile
- Raw personal memories
- Unrelated preferences
- Calendar contents
- Financial data
- Private Claude context
- Full internal reasoning traces

They receive:

```text
Decision
Confidence
Minimal explanation
Decision metadata
```

Example:

### Internal

```text
User prefers Singapore Airlines
User dislikes long layovers
User has ₹60K travel budget
User usually chooses aisle seats
```

### External

```text
APPROVE

Matches the user's travel criteria.
```

---

# 38. Decision Audit Log

Every decision must create an audit record.

Fields:

```text
Request ID
Agent ID
Decision type
Decision
Confidence
Policies matched
Preferences matched
Timestamp
User override
```

Example:

```text
REQ-10291

Travel Agent
Flight Purchase

Decision:
APPROVE

Policy:
Under ₹50K autonomous

Preferences:
Preferred airline
Direct flight
Aisle seat

Timestamp:
10:32:11
```

---

# 39. User Override

The user must be able to override AI decisions.

Example:

```text
AI Decision:
REJECT

Reason:
Price exceeds configured budget.

[Override → Approve]
```

The system records:

```text
AI Decision: REJECT
Human Decision: APPROVE
```

---

# 40. Learning From Overrides

Do not implement autonomous model retraining.

Instead, store feedback:

```text
AI:
REJECT

User:
APPROVE

Reason:
"I would pay extra for direct flights."
```

If the user chooses "Remember this", create a `USER_CORRECTION` preference proposal.

If the user chooses "Just this time", record only the override.

---

# 41. UI Requirements

The application should have six primary screens.

## Screen 1 — Dashboard

```text
Hello, Lokeshwaran

Your Agent
● Online

Today's activity

3 Decisions
2 Approved
1 Rejected
0 Awaiting approval

Preference suggestions
1 pending
```

---

## Screen 2 — Agent Onboarding

Conversational onboarding:

```text
Personal Agent

Let's learn how you make decisions.

Agent:
What matters most when choosing a flight?

User:
Price is important, but I prefer direct flights...
```

Then show extracted structured preferences for confirmation.

---

## Screen 3 — Preferences

```text
Travel Preferences

Maximum normal budget
₹60,000

Preferred airlines
Singapore Airlines
Emirates

Maximum stops
1

Preferred seat
Aisle

Cabin
Economy

[Edit] [Delete]
```

Each preference should show source:

```text
Source: You
Confidence: High
```

---

## Screen 4 — Policies

Show policies as human-readable rules.

```text
AUTONOMOUS DECISIONS

Flight < ₹50,000
✓ Automatically approve

Flight ₹50K–₹70K
⚠ Ask me

Flight > ₹70,000
✕ Reject
```

---

## Screen 5 — Connected Agents

```text
Connected Agents

✈ Travel Agent
Connected

Capabilities:
✓ Flight decisions
✓ Hotel decisions

Permissions:
Travel preferences
Decision requests

[Manage]
```

---

## Screen 6 — Decision Activity

Timeline:

```text
10:42 AM

Travel Agent requested:

Singapore Airlines
BLR → Tokyo
₹54,000
Direct
Aisle

────────────────────

APPROVED

Matches your travel preferences
and autonomous purchase policy.
```

The details view should show which policies/preferences influenced the decision without exposing private reasoning.

---

# 42. Preference Suggestion UI

Example:

```text
Preference suggestion

You chose direct flights 4 out of your
last 5 selections.

Should I remember:

"Prefer direct flights even when they
cost up to ₹10K more."

[Remember] [Ignore]
```

---

# 43. Approval UI

For `ASK_USER`:

```text
┌────────────────────────────────┐
│ Travel Agent needs your input  │
├────────────────────────────────┤
│                                │
│ Singapore Airlines             │
│ BLR → Tokyo                    │
│ ₹64,500                        │
│ Direct                         │
│ Aisle                          │
│                                │
│ Your policy requires approval  │
│ for this price range.          │
│                                │
│ [ Reject ]      [ Approve ]    │
└────────────────────────────────┘
```

After override:

```text
Remember this?

[Just this time] [Remember this]
```

---

# 44. Travel Agent Demo UI

The external agent should have its own interface.

```text
TRAVEL AGENT

Searching flights...

✓ Found 12 flights

Evaluating with HumanAPI...

Singapore Airlines
₹54,000
Direct
Aisle

HumanAPI:
✓ APPROVED

Emirates
₹68,000
Direct
Aisle

HumanAPI:
⚠ ASK USER

Air India
₹48,000
2 stops

HumanAPI:
✕ REJECTED
```

---

# 45. Demo Flow

## Step 1 — Configure User

```text
Budget: ₹60K
Preferred airline: Singapore
Seat: Aisle
Max stops: 1
Prefer direct flights
```

## Step 2 — Configure Policy

```text
< ₹50K → Auto approve

₹50K–₹70K → Ask user

> ₹70K → Reject
```

## Step 3 — Connect Travel Agent

```text
Travel Agent
✓ Connected
```

## Step 4 — Submit Flight

```text
₹45K
Singapore
Direct
Aisle
```

Result:

```text
APPROVED
```

## Step 5 — Submit Another

```text
₹68K
Singapore
Direct
Aisle
```

Result:

```text
ASK USER
```

User approves.

System asks:

```text
Remember this preference?

[Just this time] [Remember this]
```

## Step 6 — Submit Third

```text
₹75K
Singapore
Direct
Aisle
```

Result:

```text
REJECTED
```

## Step 7 — Show Privacy

Open request details and demonstrate:

```text
Travel Agent received:

Decision: APPROVE

It did NOT receive:

✕ Full user profile
✕ Private memories
✕ Financial information
✕ Full preference database
✕ Claude internal context
```

This should be the final wow moment.

---

# 46. Technical Architecture

```text
┌─────────────────────────────────────────────┐
│                  Frontend                   │
│                  React.js                  │
└───────────────────┬─────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│                Backend API                  │
│              Node.js / TypeScript           │
├─────────────────────────────────────────────┤
│                                             │
│  Agent Registry                             │
│  Preference Service                         │
│  Policy Engine                              │
│  Decision Engine                            │
│  Permission Service                         │
│  Audit Service                              │
│  Preference Learning Service                │
│                                             │
└───────────────┬─────────────────────────────┘
                │
       ┌────────┴─────────┐
       ▼                  ▼
┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │ Claude API   │
│              │    │              │
│ Users        │    │ Reasoning    │
│ Preferences  │    │ Extraction   │
│ Versions     │    │ Decisions    │
│ Policies     │    │              │
│ Agents       │    └──────────────┘
│ Decisions    │
│ Overrides    │
└──────────────┘
```

---

# 47. Recommended Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

## Backend

- Node.js
- TypeScript
- Fastify

## Database

- Supabase PostgreSQL
- Supabase Auth

## AI

- Claude API

The product is API-centric, so the backend must expose clean REST APIs even though the MVP contains a simulated Travel Agent.

---

# 48. Database Schema

## users

```sql
id
name
email
avatar_url
created_at
updated_at
```

## preferences

```sql
id
user_id
category
key
value
source
confidence
importance
status
created_at
updated_at
```

## preference_versions

```sql
id
preference_id
value
source
changed_by
created_at
```

## preference_suggestions

```sql
id
user_id
category
key
proposed_value
reason
confidence
source
status
created_at
resolved_at
```

Allowed status:

```text
PENDING
ACCEPTED
IGNORED
```

## policies

```sql
id
user_id
name
category
condition
action
priority
enabled
created_at
updated_at
```

## agents

```sql
id
name
description
api_key_hash
status
created_at
updated_at
```

## agent_permissions

```sql
id
agent_id
permission
created_at
```

## decision_requests

```sql
id
request_id
user_id
agent_id
decision_type
payload
status
created_at
completed_at
```

## decisions

```sql
id
request_id
decision
confidence
reason
matched_policies
matched_preferences
requires_user_action
created_at
```

## user_overrides

```sql
id
decision_id
user_id
original_decision
override_decision
reason
remember_preference
created_at
```

---

# 49. API Authentication

For the hackathon:

### External agents

Use API keys.

```http
Authorization: Bearer hapi_xxxxxxxxx
```

### User dashboard

Use Supabase Auth.

Do not spend hackathon time implementing custom authentication.

---

# 50. Decision Engine Pseudocode

```text
receive request

validate request

identify requesting agent

check agent permission

if unauthorized:
    return REJECT

load relevant user policies

evaluate hard policies

if hard reject:
    return REJECT

if hard approve:
    return APPROVE

load relevant explicit preferences

load confirmed user corrections

load confirmed learned preferences

construct Claude context

send request to Claude

validate Claude response

if invalid:
    return ASK_USER

return decision

write audit log
```

AI-inferred, unconfirmed preferences must not be treated as authoritative inputs.

---

# 51. Claude System Prompt

The implementation should use a structured system prompt along these lines:

```text
You are the Personal Decision Agent for a user.

Your job is to determine what decision the user would make
based on their explicit preferences, policies and available context.

You MUST follow hard policies.

You MUST NOT invent preferences.

You MUST NOT override permissions.

You MUST protect private user information.

Explicit user preferences have higher priority than inferred preferences.

If there is insufficient information to confidently make a decision,
return ASK_USER.

Possible decisions:

APPROVE
REJECT
ASK_USER

Return ONLY valid JSON.

Required fields:

decision
confidence
reason
matched_preferences
matched_policies
requires_user_action
```

The exact prompt should be refined during implementation and testing.

---

# 52. Preference Extraction Prompt

For onboarding and conversational updates, use a separate extraction task.

The extractor should:

1. Identify explicit user statements.
2. Convert them into structured preferences.
3. Distinguish preferences from hard policies.
4. Assign confidence.
5. Identify ambiguity.
6. Never invent missing values.
7. Return proposed changes rather than directly modifying active preferences.

Example output:

```json
{
  "proposals": [
    {
      "category": "travel",
      "key": "preferred_airlines",
      "value": ["Singapore Airlines", "Emirates"],
      "source": "USER_EXPLICIT",
      "confidence": 0.98
    }
  ]
}
```

---

# 53. Security Requirements

### SR-001

External agents must not access raw user preferences.

### SR-002

External agents must not access Claude prompts.

### SR-003

External agents must not access private context.

### SR-004

Hard policies must not be overridden by Claude.

### SR-005

Every decision must be auditable.

### SR-006

User approval must be required for configured thresholds.

### SR-007

API keys must never be stored in plaintext.

### SR-008

AI-inferred preferences must never become active without user confirmation.

### SR-009

Preference update requests must require authenticated user confirmation.

### SR-010

The system must distinguish explicit user information from AI inference.

---

# 54. Failure Handling

## Claude unavailable

Return:

```text
ASK_USER
```

Do not automatically approve.

## Claude returns invalid JSON

Retry once.

If still invalid:

```text
ASK_USER
```

## Missing preference

Claude can reason based on available information.

If ambiguity is significant:

```text
ASK_USER
```

## Policy conflict

Example:

```text
Policy A:
Always approve under ₹50K

Policy B:
Never fly Airline X
```

The deny policy wins.

---

# 55. Observability

Dashboard should display:

```text
Decision latency
Claude latency
Decision count
Approval rate
Rejection rate
Human approval rate
Preference suggestions
User overrides
```

Optional for MVP:

- AI vs deterministic decision breakdown
- Preference correction rate
- Most frequently used policies

---

# 56. Performance

Target:

```text
API response:
< 5 seconds

Claude decision:
< 4 seconds

UI update:
< 1 second
```

No sophisticated distributed infrastructure is required.

---

# 57. Acceptance Criteria

## AC-001

A user can create a profile.

## AC-002

A user can complete AI-assisted onboarding.

## AC-003

The system extracts candidate preferences from natural language.

## AC-004

The user must confirm extracted preferences before activation.

## AC-005

A user can view all active preferences.

## AC-006

A user can edit and delete preferences.

## AC-007

A user can view preference source and confidence.

## AC-008

A user can view preference history.

## AC-009

A user can update preferences conversationally.

## AC-010

A user can correct a decision and optionally save the correction as a preference.

## AC-011

AI-inferred preferences remain proposed until user confirmation.

## AC-012

A user can configure travel preferences.

## AC-013

A user can configure autonomous decision policies.

## AC-014

An external Travel Agent can authenticate.

## AC-015

Travel Agent can submit a flight decision request.

## AC-016

System validates Travel Agent permission.

## AC-017

System evaluates hard policies before Claude.

## AC-018

Claude evaluates requests that require reasoning.

## AC-019

System returns `APPROVE`, `REJECT`, or `ASK_USER`.

## AC-020

External agent receives only decision information.

## AC-021

Private user context is never returned to external agents.

## AC-022

User can approve/reject `ASK_USER` requests.

## AC-023

Every decision is visible in the activity dashboard.

## AC-024

Every decision has an explanation.

## AC-025

AI decisions and human overrides are recorded.

---

# 58. Demo Acceptance Criteria

The following scenarios must work reliably.

### Scenario A — Autonomous Approval

```text
Singapore Airlines
₹45,000
Direct
Aisle
```

Expected:

```text
APPROVE
```

### Scenario B — Human Approval

```text
Singapore Airlines
₹65,000
Direct
Aisle
```

Expected:

```text
ASK_USER
```

User approves.

System asks:

```text
Remember this?

[Just this time] [Remember this]
```

### Scenario C — Hard Rejection

```text
Singapore Airlines
₹80,000
Direct
Aisle
```

Expected:

```text
REJECT
```

Claude must not override the hard policy.

### Scenario D — Blocked Airline

```text
Airline:
Airline X

Price:
₹40,000
```

If Airline X is blocked:

```text
REJECT
```

### Scenario E — Preference Learning

After user approves a ₹65K direct flight and chooses "Remember this":

```text
Preference suggestion / update:
User is willing to pay more for direct flights.
```

The new preference must be visible in the dashboard.

---

# 59. Long-Term Roadmap

## Phase 2 — More Agent Types

- Shopping Agent
- Calendar Agent
- Job Agent
- Restaurant Agent

## Phase 3 — Autonomous Actions

Allow:

```text
APPROVE
→ Execute action
```

Examples:

- Book flight
- Schedule meeting
- Purchase product

## Phase 4 — Agent Negotiation

Agents can negotiate with external agents.

```text
Your Agent
     ↕
Seller Agent
     ↕
Service Agent
```

## Phase 5 — Agent Identity

Introduce:

- Verifiable agent identity
- Agent reputation
- Capability discovery
- Trust scores

## Phase 6 — Privacy-Preserving Context

Explore:

- Selective disclosure
- Zero-knowledge proofs
- Encrypted personal context
- Decentralized identity

## Phase 7 — Human Agent Protocol

Eventually define:

```text
DISCOVER
REQUEST
AUTHENTICATE
ASK
DECIDE
AUTHORIZE
EXECUTE
AUDIT
```

---

# 60. Long-Term Product Vision

```text
                       INTERNET
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
   Travel Agent      Shopping Agent    Work Agent
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                    HUMAN PROTOCOL
                          │
             ┌────────────▼────────────┐
             │                         │
             │      YOUR AGENT         │
             │                         │
             │ Preferences             │
             │ Policies                │
             │ Identity                │
             │ Memory                  │
             │ Permissions             │
             │ Decisions               │
             │                         │
             └────────────┬────────────┘
                          │
                          ▼
                         YOU
```

The ultimate proposition is:

> **The internet was built for humans to interact with software. The agentic internet will require software to interact with humans.**

**You as an API is the interface between those two worlds.**

---

# 61. Antigravity Implementation Plan

Antigravity should implement the project in this order.

## Phase 1 — Foundation

1. Create React + TypeScript frontend.
2. Create Node.js + TypeScript backend.
3. Configure Supabase.
4. Configure environment variables.
5. Configure Claude API.
6. Configure Supabase Auth.
7. Establish shared TypeScript types.

## Phase 2 — Data Layer

Implement:

```text
Users
Preferences
Preference Versions
Preference Suggestions
Policies
Agents
Agent Permissions
Decision Requests
Decisions
User Overrides
```

## Phase 3 — Preference System

Implement:

```text
AI onboarding
Preference extraction
Confirmation flow
Preference CRUD
Preference versioning
Conversational updates
Preference suggestions
User correction flow
```

## Phase 4 — Decision Engine

Implement:

```text
Request validation
Permission check
Policy engine
Relevant preference retrieval
Claude decision reasoning
Structured output validation
Audit logging
```

## Phase 5 — External Agent

Build simulated Travel Agent:

1. Generate flight offers.
2. Send decision requests to HumanAPI.
3. Display returned decisions.
4. Handle `ASK_USER`.
5. Display decision explanations.

## Phase 6 — Dashboard

Implement:

```text
Dashboard
Onboarding
Preferences
Preference suggestions
Policies
Connected agents
Activity
Decision detail
Approval modal
```

## Phase 7 — Demo Polish

Prioritize:

- Smooth animations
- Clear decision states
- Request/response visualization
- Agent communication visualization
- Privacy visualization
- Excellent typography
- Responsive layout
- Fast demo flow

The demo should feel like a **future-facing infrastructure product**, not an admin dashboard.

---

# 62. Important Implementation Constraints

Do not over-engineer the MVP.

The core loop is:

```text
External Agent
      ↓
Decision Request
      ↓
Permission Check
      ↓
Policy Engine
      ↓
Relevant Preferences
      ↓
Claude
      ↓
Decision
      ↓
External Agent
```

The preference lifecycle is:

```text
User / AI conversation
        ↓
Candidate preference
        ↓
User confirmation
        ↓
Active preference
        ↓
Decision
        ↓
User correction
        ↓
Preference suggestion
        ↓
User confirmation
        ↓
Updated preference
```

If both loops work reliably, **we have the product**.

Everything else is secondary.

---

# 63. Recommended Landing Page

## Hero

> **You are more than your data.**

## Subheadline

> Give AI agents a way to understand your preferences, respect your boundaries, and ask what you would decide—without exposing your private context.

## Visual

```text
     AI AGENT
         │
         │ "Would you accept this?"
         ▼
   ┌───────────────┐
   │   YOUR AGENT  │
   │               │
   │   THINK       │
   │   CHECK       │
   │   DECIDE      │
   └───────┬───────┘
           │
      ✓ APPROVE
```

Primary CTA:

**Create Your Agent**

Secondary CTA:

**Explore the API**

---

# 64. Hackathon Presentation Narrative

## Slide 1

> **Software has APIs. Humans don't.**

## Slide 2

Show:

> "Would you accept this flight?"

The user doesn't answer.

Their agent does.

## Slide 3

Show the Personal API.

## Slide 4

Show:

```text
₹45K → APPROVE
₹65K → ASK
₹80K → REJECT
```

## Slide 5

Show privacy:

> **The Travel Agent never saw the user's private context.**

## Slide 6

Show preference learning:

> **And when you correct your agent, it learns—with your permission.**

## Slide 7

Reveal the vision:

> **What if every human had an API?**

---

# 65. North Star

The hackathon MVP succeeds if a judge can understand this within **30 seconds**:

> **"Instead of every AI agent asking me what I want, I have an AI agent that already knows my preferences and boundaries and can make authorized decisions on my behalf."**

And within another 30 seconds:

> **"They're not exposing the user's data. They're exposing the user's decision."**

And the final realization should be:

> **"The agent can evolve with the user, but the user remains in control of what it remembers."**

That is the core product insight around which the implementation should be optimized.
