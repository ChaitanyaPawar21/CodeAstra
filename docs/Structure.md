# CodeAstra Project Structure

```text
CodeAstra/
│
└── backend/                      # Server-side environment, application logic & AI-Pipleline
    ├── src/
    │   ├── ai/                   # AI model instances, tools, and agents
    │   ├── config/               # Database and server configurations
    │   │   ├── config.ts         # Configuration setup
    │   │   └── db.ts             # Mongoose connection setup (MongoDB)
    │   ├── controllers/          # Business logic handlers for specific routes
    │   ├── dao/                  # Data Access Objects (DB query encapsulation)
    │   ├── middlewares/          # Security and request interceptors
    │   ├── models/               # MongoDB schema definitions using Mongoose
    │   ├── routes/               # API endpoint definitions mapping to controllers
    │   ├── services/             # Specialized logic and external integrations
    │   │   └── ai.service.ts     # Core AI logic (orchestrator & pipeline manager complete ai logic of ai/-> folder connect here)
    │   ├── validators/           # Request body validation and sanitization
    │   └── app.ts                # Main Express application configuration
    ├── package.json              # Backend dependencies and execution scripts
    ├── server.ts                 # Entry point for the server
    └── .env                      # Environment secrets (MongoDB, API Keys, JWT, Port)
```