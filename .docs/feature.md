### M1: Folder Structure Analysis
Analyze repository folder hierarchy and explain the purpose of each major directory in plain English.

**Expected Output**
```text
M1: Folder Structure
src/
├── controllers/ → Handles incoming requests and business logic
├── models/      → Manages database schemas and queries
├── routes/      → Defines API endpoints and maps them to controllers
└── middleware/  → Preprocesses requests (auth, logging, validation)
```

### M2: Entry Point Detection
Auto-detect the project starting point (e.g., `server.js`, `main.py`, `index.js`) and describe the initial execution flow.

**Expected Output**
```text
M2: Entry Point Detection

Entry Point: server.js

Execution Flow:
server.js loads environment variables
→ Connects to MongoDB via db.config.js
→ Registers Express middleware
→ Mounts API routes from /routes/index.js
→ Starts listening on PORT 3000
```

### M3: Dependency Mapping
Detect file relationships using imports/exports to show how modules interact internally (e.g., `route -> controller -> service -> model`).

**Expected Output**
```text
M3: Dependency Mapping
auth.routes.js
└── auth.controller.js
    └── user.service.js
        └── user.model.js
```

### Bonus Features (Last 3 Features Only)
Implement any of the following to earn additional points:

- **B1 — Critical File Identification**: Highlight files that play major roles in project execution (auth, DB config, API controllers).
- **B2 — Execution Flow Explanation**: Show runtime request flow for major operations (e.g., Request → Route → Controller → Service → Database).
- **B3 — Intelligent Repository Summary**: Generate a high-level summary including tech stack, architecture style, and key design decisions.

### Input & Constraints

- **Input method**: GitHub repository URL only.
- **Supported project types**: Node.js, React, Python, Java, or full-stack projects.
- **AI stack**: Any LLM API of your choice (Claude, GPT-4, Gemini, open-source, etc.).
- **Language & framework**: No restrictions — build with whatever you know best.

### Expected Deliverables

- A working demo accepting a GitHub URL as input.
- Output covering all three mandatory features (M1, M2, M3).
- A short 5-minute presentation explaining your approach and demo.
- GitHub repository of your own solution.