# CodeAstra AI Chatbot

The CodeAstra AI Chatbot lets users ask questions about an analyzed
GitHub repository and receive AI-generated answers. It is integrated
into the CodeAstra application and uses the Groq API for chatbot
responses.

## Features

-   Ask questions about the analyzed repository.
-   Send available repository-analysis context to the chatbot.
-   Include recent conversation history for follow-up questions.
-   Render formatted answers, including headings, code blocks, and
    tables.
-   Validate empty messages and handle loading and error states.

> **Context note:** Answers depend on the repository information
> supplied by CodeAstra. If source-code contents are not included, the
> chatbot cannot reliably confirm implementation details from those
> files.

## Technology

  Technology           Purpose
  -------------------- -----------------------------------------------------
  React + TypeScript   Chat interface
  Node.js + Express    Backend API
  Groq API             Generates chatbot responses
  `react-markdown`     Renders Markdown responses
  `remark-gfm`         Supports GitHub Flavored Markdown, including tables
  MongoDB              Database used by the wider CodeAstra application

The chatbot uses Groq. CodeAstra's existing architecture-analysis
workflow has a separate NVIDIA/LangGraph integration; the chatbot does
not replace it.

## Files Added or Updated

### Backend

``` text
backend/
└── src/
    ├── controllers/
    │   └── chat.controller.ts
    ├── routes/
    │   └── chat.route.ts
    ├── services/
    │   └── chat.service.ts
    └── app.ts
```

  -----------------------------------------------------------------------
  File                                Responsibility
  ----------------------------------- -----------------------------------
  `chat.controller.ts`                Validates the incoming message,
                                      calls the service, and returns the
                                      reply.

  `chat.route.ts`                     Defines the chat endpoint and
                                      connects it to the controller.

  `chat.service.ts`                   Prepares the prompt and available
                                      repository context, calls Groq, and
                                      returns the answer.

  `app.ts`                            Registers the chat router with
                                      Express.
  -----------------------------------------------------------------------

### Frontend

``` text
frontend/
└── src/
    ├── features/
    │   └── chat/
    │       └── pages/
    │           └── AIChatPage.tsx
    └── shared/
        └── api/
            └── chat.api.ts
```

  -----------------------------------------------------------------------
  File                                Responsibility
  ----------------------------------- -----------------------------------
  `AIChatPage.tsx`                    Manages the chat interface,
                                      messages, loading/error states, and
                                      response display.

  `chat.api.ts`                       Sends the message, conversation
                                      history, and available repository
                                      context to the backend.
  -----------------------------------------------------------------------

## How It Works

1.  The user types a message in `AIChatPage.tsx`.
2.  The page calls `sendChat()` from `chat.api.ts`.
3.  The helper sends a `POST` request to `/api/chat`.
4.  Express routes the request to `chat.controller.ts`.
5.  The controller validates the message and calls `chat.service.ts`.
6.  The service prepares the prompt, recent history, and available
    repository-analysis context.
7.  The service sends the request to Groq.
8.  The response is returned to the frontend and displayed in the chat
    page.

``` text
User
  ↓
AIChatPage.tsx
  ↓
chat.api.ts
  ↓
POST /api/chat
  ↓
chat.route.ts
  ↓
chat.controller.ts
  ↓
chat.service.ts
  ↓
Groq API
  ↓
AI response displayed in the chat page
```

## API Endpoint

  -----------------------------------------------------------------------
  Method                  Endpoint                Purpose
  ----------------------- ----------------------- -----------------------
  `POST`                  `/api/chat`             Sends a message and
                                                  receives an
                                                  AI-generated reply.

  -----------------------------------------------------------------------

### Example request

``` json
{
  "message": "Explain the main entry point of this repository.",
  "history": [
    { "role": "user", "content": "I am exploring this repository." },
    { "role": "assistant", "content": "I can help you understand its structure." }
  ],
  "repoUrl": "https://github.com/owner/repository",
  "repoName": "repository",
  "analysis": {}
}
```

The `analysis` object represents repository-analysis context. Its exact
fields depend on the data produced by the application.

### Example response

``` json
{
  "reply": "The repository's entry point is ..."
}
```

## Installation

Install the Markdown rendering packages in the frontend:

``` bash
cd frontend
npm install react-markdown remark-gfm
```

Install backend dependencies from the existing package manifest:

``` bash
cd backend
npm install
```

## Environment Variables

Add the Groq configuration to the **backend** `.env` file:

``` env
GROQ_API_KEY=your_groq_api_key
AI_MODEL=openai/gpt-oss-120b
```

Keep API keys private. Never commit `.env` files or expose real keys in
frontend code. The model ID above is the one configured during
development; check Groq's console for currently supported model IDs.

## Run Locally

Run the backend and frontend in separate terminals, using the scripts in
each `package.json`.

Example:

``` bash
# Terminal 1
cd backend
npm run dev
```

``` bash
# Terminal 2
cd frontend
npm run dev
```

During development, the backend ran at:

``` text
http://localhost:5000
```

Ensure the frontend API base URL points to the running backend.

## Error Handling and Limits

-   The backend rejects an empty or invalid message.
-   The frontend can display an error if the API request fails.
-   Groq enforces request and token-rate limits. Large repository
    context or long conversation history can cause rate-limit errors.
-   Keep context and conversation history within reasonable limits.
-   The chatbot should not claim to have inspected source files that
    were not supplied to it.

## Security Notes

-   Store `GROQ_API_KEY` only on the backend.
-   Never expose the API key in frontend code.
-   Do not commit `.env` files.
-   Validate and limit user input on the backend.
-   Apply the application's authentication and authorization rules to
    the chat endpoint if it is intended for signed-in users.

## Summary

The CodeAstra AI Chatbot connects the React frontend to an Express
backend and uses Groq to generate conversational responses. The backend
separates endpoint definition (`route`), request handling
(`controller`), and AI logic (`service`). The frontend manages the chat
experience and renders Markdown-formatted answers.
