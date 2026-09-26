# NextStep — AI Decision Assistant

NextStep is a full-stack AI decision assistant that helps users turn messy or stressful situations into a clear next step.

The application accepts a user's situation, sends it to the NextStep Mock API, stores the resulting analysis in MongoDB, asks clarifying questions when required, and allows users to submit answers or update their situation.

---

## Features

- Describe a situation in natural language
- Generate an AI-powered situation analysis
- Identify issues and priorities
- Ask clarifying questions when more information is required
- Submit answers to clarifying questions
- Update an existing situation when circumstances change
- Display the recommended next action
- Store situations and version history in MongoDB
- Handle unreliable API responses
- Handle API timeouts
- Handle malformed JSON responses
- Handle HTTP errors such as 429, 500, 502, 503 and 504
- Use idempotency keys for state-changing API requests
- Provide loading and error feedback in the frontend
- Record the results of all 7 shared challenge scenarios

---

## Tech Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Zod

### External API

NextStep Mock API:

`https://nextstepmockapi.onrender.com`

---

## Project Structure

```text
NextStep-FullStack/
│
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── ...
│
├── server/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   └── situationController.js
│   ├── models/
│   │   └── Situation.js
│   ├── routes/
│   │   └── situationRoutes.js
│   ├── services/
│   │   └── nextStepService.js
│   ├── server.js
│   ├── package.json
│   └── ...
│
├── test-results/
│   ├── scenario-1.md
│   ├── scenario-1.png
│   ├── scenario-2.md
│   ├── scenario-2.png
│   ├── scenario-3.md
│   ├── scenario-3.png
│   ├── scenario-4.md
│   ├── scenario-4.png
│   ├── scenario-5.md
│   ├── scenario-5.png
│   ├── scenario-6.md
│   ├── scenario-6.png
│   ├── scenario-7.md
│   └── scenario-7.png
│
├── .env.example
├── .gitignore
└── README.md
```

---

## Architecture

```text
React Frontend
      │
      ▼
Express REST API
      │
      ├── Zod validation
      │
      ├── NextStep service
      │       │
      │       ▼
      │   NextStep Mock API
      │
      ▼
MongoDB / Mongoose
      │
      └── latest situation + version history
```

The backend acts as the integration layer between the frontend, the external NextStep API, and MongoDB.

---

## Request Flow

### Create a situation

```text
User enters situation
        ↓
React POST /api/situations
        ↓
Express validates request
        ↓
NextStep API request
        ↓
Response parsed and checked
        ↓
Situation stored in MongoDB
        ↓
Analysis returned to React
```

### Answer or update a situation

```text
User answers a question / provides an update
        ↓
React POST to backend
        ↓
Express validates request
        ↓
NextStep API with Idempotency-Key
        ↓
New version returned
        ↓
New state + history stored in MongoDB
        ↓
Updated analysis returned to React
```

---

## Data Model

A situation stores:

- `originalText`
- `situationId`
- current `version`
- `mode`
- `summary`
- `issues`
- `priorities`
- `nextAction`
- `clarifyingQuestions`
- `missingInformation`
- `riskFlags`
- `confidence`
- `changes`
- `support`
- `history`
- timestamps

The `history` array stores previous API responses with their version numbers and timestamps. This prevents an update from destroying the previous assessment.

---

## Key Technical Decisions

### 1. Express backend as an integration layer

The frontend does not call the external NextStep API directly. Requests go through the Express backend.

**Why:**
- keeps the candidate ID/header handling on the server
- centralises validation and error handling
- keeps persistence logic out of the client
- gives the application one stable API boundary

**Alternative rejected:** Calling the NextStep API directly from React.

I rejected this because it would make integration, persistence, and failure handling harder to control consistently.

### 2. MongoDB versioned situation storage

Each situation stores the latest structured state together with a history array containing previous responses and versions.

**Why:**
- updates must not erase previous assessments
- the challenge explicitly requires handling changing situations
- version history makes reassessment traceable

**Alternative rejected:** Overwriting the existing document on every update.

That would lose the information needed to understand how the situation changed.

### 3. Idempotency keys for state-changing requests

The backend generates an idempotency key for create, answer, and update operations and sends it to the NextStep API.

For situation creation, the same key is reused when retrying after selected transient failures.

**Why:**
A timeout does not necessarily mean the provider failed to apply the request. Retrying with the same idempotency key avoids accidentally creating duplicate state changes.

**Alternative rejected:** Retrying with a new idempotency key.

That could turn one user action into multiple provider-side operations.

---

## Reliability and Failure Handling

The provided API is intentionally unreliable, so failure handling is part of the implementation.

### Timeout handling

Requests use `AbortController` with a timeout.

A timeout is converted into a controlled `504` error instead of leaving the request hanging indefinitely.

### Malformed JSON

The backend checks the response content type and parses JSON explicitly.

Malformed JSON is detected instead of allowing an unexpected parsing exception to reach the frontend.

For answer submission, when a malformed response is received, the backend safely recovers the latest situation with `GET /v1/situations/{id}` rather than blindly retrying the same state-changing operation.

### HTTP failures

The backend preserves useful error information for:

- `429`
- `500`
- `502`
- `503`
- `504`

The frontend displays the returned error instead of failing silently.

### Idempotent retry

Situation creation retries selected transient failures using the same idempotency key.

This is intentionally conservative: the application does not blindly repeat every failed mutation.

---

## Validation

Incoming create and answer requests are validated using Zod before being passed to the external API.

This prevents malformed frontend requests from unnecessarily reaching the provider.

MongoDB stores the structured situation state and version history.

---

## Shared Scenario Results

All 7 shared scenarios from the challenge were executed against the application.

Each result contains:

- the scenario input
- the observed output
- important UI behaviour
- a screenshot of the actual application result

See the [`test-results`](./test-results/) directory.

### Scenario 1 — Multi-problem

Multiple simultaneous problems involving a viva, broken laptop, unavailable project partner, and a hospitalized parent.

Result: the application identified four issues and asked which travel decision was most urgent.

[View Scenario 1](./test-results/scenario-1.md)

### Scenario 2 — Hinglish

A Hindi-English situation involving a submission deadline, broken laptop, and housing pressure.

Result: the application understood the situation, separated the three issues, and suggested borrowing a laptop as the immediate action.

[View Scenario 2](./test-results/scenario-2.md)

### Scenario 3 — Contradictory

The user gives conflicting Thursday/Friday deadline information and conflicting financial/roommate constraints.

Result: the application returned `needs_clarification` and explicitly asked the user to verify the deadline.

[View Scenario 3](./test-results/scenario-3.md)

### Scenario 4 — Emotional / At-risk

The user expresses exhaustion and asks, "What's the point honestly."

Result: the application switched to `support` mode and did not present the normal productivity/task output.

[View Scenario 4](./test-results/scenario-4.md)

### Scenario 5 — Irrelevant / Misuse

The user asks NextStep to write a 1500-word climate-change essay.

Result: the application returned `out_of_scope` and redirected the user toward planning around the deadline rather than writing the coursework.

[View Scenario 5](./test-results/scenario-5.md)

### Scenario 6 — Adversarial / Prompt Injection

The user pastes a message containing fake system instructions asking for a UPI PIN.

Result: the application treated the content as pasted text, identified it as a UPI scam, and explicitly advised the user not to share their UPI PIN.

[View Scenario 6](./test-results/scenario-6.md)

### Scenario 7 — Worse After Action

The user reports that previous advice led to an angry manager and HR being copied.

Result: the application reassessed the situation, recognised the escalation, and suggested moving the discussion to a call rather than continuing the argument over email.

[View Scenario 7](./test-results/scenario-7.md)

---

## What I Skipped and Why

This is a thin-slice implementation rather than a production-ready system.

### Automated end-to-end test suite

I manually tested the main create, answer, update, validation, timeout and API-failure paths instead of building a full automated E2E test suite.

**Why:** The challenge prioritised a working end-to-end thin slice and explicit handling of an unreliable provider. With the available time, I prioritised the core flow and failure handling.

### Full production deployment

I did not deploy the application.

**Why:** A deployed link/build is optional in the challenge. The application was tested locally end-to-end with React, Express and MongoDB.

### Full authentication and user accounts

No login/authentication system was added.

**Why:** Authentication was outside the core challenge flow and would add significant scope without improving the required situation-analysis workflow.

### Advanced retry/queue infrastructure

I did not add a distributed job queue, persistent retry scheduler, or sophisticated exponential-backoff system.

**Why:** The challenge asks for sensible handling of an unreliable provider, but a local thin slice does not need production-scale infrastructure. The implementation instead uses bounded timeout/recovery behaviour and idempotency.

---

## What Would Break First at 10× Users?

The first pressure points would likely be:

1. **The external NextStep API** — provider rate limits and latency would become more frequent.
2. **A single Node.js process** — the current local setup is not horizontally scaled.
3. **MongoDB write/read load** — every situation and reassessment is persisted synchronously.
4. **In-memory request handling** — there is no external job queue for long-running provider work.

### What I would change

- Run multiple backend instances behind a load balancer.
- Add Redis or another shared cache where useful.
- Introduce a durable queue for provider requests and retries.
- Add MongoDB indexes based on production query patterns.
- Add structured logging and request metrics.
- Add circuit breaking and better provider backoff.
- Move secrets/configuration into deployment environment management.

---


## Curveball Response — Privacy and Situation Ownership

The team sent a change asking us to investigate a case where a user's friend opened NextStep on the friend's own phone and was able to see the user's situation.

I treated this as a privacy and authorization problem rather than a UI issue.

In the current challenge implementation, authentication and user accounts are not implemented because they were outside the required thin-slice scope. Situations are therefore not currently bound to an authenticated user identity.

My response would be to make situation ownership an explicit part of the data model and access-control layer before treating the application as production-ready.

The production design would:

- associate every situation with an authenticated user ID
- verify ownership before returning a situation
- verify ownership before submitting answers
- verify ownership before updating a situation
- prevent a situation ID alone from granting access
- use secure authentication/session handling
- avoid exposing private situation data to another user's device

I would not solve this only by hiding situation IDs in the frontend, because that does not provide real authorization.

For this challenge submission, I kept the existing thin slice stable rather than adding an incomplete authentication system immediately before submission. I documented this as a security/privacy limitation and identified authorization as a required step before production use.


## Jugaad

One practical problem I noticed was that a malformed response from a state-changing request should not automatically trigger an identical mutation retry.

For answer submission, instead of blindly retrying the POST after malformed JSON, the backend recovers the latest situation using a safe GET request.

This gives the user a usable current state while reducing the risk of repeating a state-changing operation unnecessarily.

---

## AI Usage Disclosure

AI tools were used during development, primarily ChatGPT.

### What I asked AI to help with

- project structure and backend architecture
- Express/Mongoose implementation guidance
- API integration patterns
- validation with Zod
- timeout and malformed-response handling
- idempotency and retry strategy
- frontend state and error handling
- README/documentation drafting
- debugging development issues

### What I accepted

I accepted implementation patterns and documentation suggestions after checking them against the challenge requirements and testing the resulting application locally.

### What I modified or rejected

I modified generated suggestions to match the actual project structure, API behaviour, MongoDB schema, and observed responses from the mock API.

I did not blindly accept API assumptions; provider behaviour was tested through the application and Thunder Client.

### One instance where AI was wrong or unhelpful

An initial MongoDB schema assumed that `issues[].urgency` would always be numeric. During testing, the provider returned a string value such as `"high"`, which caused a Mongoose cast error.

I identified the issue from the backend error, changed the schema to tolerate the provider's actual response shape, restarted the application, and verified the update again.

---

## Testing Performed

Manual testing covered:

- situation creation
- GET of stored situations
- clarifying-question answer submission
- situation updates
- MongoDB persistence
- version history
- invalid situation IDs
- empty/invalid request validation
- API `429` handling
- API `500` handling
- API `502`/timeout handling
- malformed JSON handling
- frontend loading states
- frontend error states
- all 7 shared challenge scenarios

The detailed shared-scenario evidence is stored in `test-results/`.

---

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/nextstep
NEXTSTEP_API_URL=https://nextstepmockapi.onrender.com
CANDIDATE_ID=your-email@example.com
```

Use `.env.example` as the template.

The actual `.env` file is intentionally ignored by Git and is not included in the repository.

---

## Installation and Running

### 1. Install backend dependencies

```bash
cd server
npm install
```

### 2. Install frontend dependencies

Open another terminal:

```bash
cd client
npm install
```

### 3. Start MongoDB

Make sure MongoDB is running locally on port `27017`.

### 4. Start the backend

From the `server` directory:

```bash
npm.cmd run dev
```

The backend runs on:

```text
http://localhost:5000
```

### 5. Start the frontend

From the `client` directory:

```bash
npm.cmd run dev
```

The frontend normally runs on:

```text
http://localhost:5173
```

---

## Backend API Routes

The frontend communicates with these local backend routes:

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/situations` | Create a new situation |
| GET | `/api/situations/:id` | Retrieve the latest stored situation |
| POST | `/api/situations/:id/answers` | Submit clarifying-question answers |
| POST | `/api/situations/:id/updates` | Update an existing situation |

The backend then communicates with the official NextStep Mock API and adds the required candidate header.

---

## Known Limitations

- Local MongoDB is used for the challenge implementation.
- Authentication is not implemented.
- There is no production deployment.
- Retry/backoff infrastructure is intentionally lightweight.
- The frontend is focused on the challenge's thin slice rather than a complete production design system.
- Automated E2E tests were not added.

---

## Development Notes

The goal of this implementation was to deliver a reliable thin slice:

**Receive → Analyse → Structure → Prioritise → Respond → Update**

The implementation intentionally prioritises data integrity, version history, provider-failure handling, and a clear user flow over adding a large number of features.

---

## License

This project was created as a technical challenge submission for HAZHTeq Innovations.
