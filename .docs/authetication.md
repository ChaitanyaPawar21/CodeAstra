## Authentication

CodeAstra implements secure user authentication using **bcrypt, JWT (JSON Web Token), and OAuth 2.0**. The authentication system ensures that only authenticated users can access protected application features and their repository analysis data.

### Technologies Used

* **bcrypt** – Securely hashes user passwords before storing them in the database.
* **JWT (JSON Web Token)** – Authenticates users and secures protected API requests.
* **OAuth 2.0** – Provides an alternative authentication mechanism through supported external identity providers.

### Password Authentication

Users can register and log in using their email and password. During registration, the password is hashed using bcrypt before being stored.

The original password is never stored directly. During login, bcrypt is used to verify the entered password against the stored hash.

### JWT Authentication

After successful authentication, CodeAstra generates a JWT for the user.

The JWT is used to authenticate subsequent requests to protected backend APIs. The backend verifies the token before allowing access to protected resources.

This ensures that unauthorized users cannot access protected CodeAstra functionality or user-specific analysis data.

### OAuth 2.0 Authentication

CodeAstra also supports OAuth 2.0-based authentication, allowing users to authenticate through a supported external identity provider.

OAuth 2.0 provides a standardized and secure mechanism for delegated authentication and authorization, allowing users to access CodeAstra without creating a separate password.

After successful OAuth authentication, the authenticated user can be associated with a CodeAstra account and access protected application features.

### Protected Repository Analysis

Authenticated users can submit repositories for analysis. Each analysis can be associated with the authenticated user's identity.

This allows CodeAstra to maintain user-specific analysis history and restrict access to analysis results belonging to other users.

### Security

* Passwords are securely hashed using **bcrypt**.
* Passwords are never stored in plain text.
* **JWT** is used to authenticate protected API requests.
* **OAuth 2.0** provides an additional authentication mechanism.
* Protected resources are accessible only to authenticated users.
* Authentication secrets and credentials should be stored securely using environment variables.

---

## Implementation notes

**Flow.** `POST /api/auth/register|login` (or the Google callback) -> server sets an **HttpOnly, SameSite=Lax, Secure-in-production** cookie `codeastra_token` holding a signed JWT (`userId`, `exp`). The browser sends it automatically; `authMiddleware` verifies it (HS256 only), loads the user, and sets `req.user`. `Authorization: Bearer <jwt>` is also accepted for API clients. The token is never readable by frontend JavaScript.

**Endpoints** (`/api/auth`): `POST /register`, `POST /login`, `GET /me` (protected), `POST /logout`, `GET /google`, `GET /google/callback`. `POST /api/analysis` is protected and stores `req.user.id` in `RepoAnalysis.userId`; any `userId` sent in the request body is ignored.

**Google account linking.** Local emails are not verified, so when Google (which *does* verify the email) claims an existing local account, the local password is removed and previously issued tokens are revoked (`tokensValidAfter`). This prevents someone pre-registering a victim's email with a password they know. The legitimate owner continues with Google.

**Setup.** Copy `backend/.env.example` to `backend/.env` and fill in `JWT_SECRET` (required) and the Google values (optional). In development the Vite dev server proxies `/api` to the backend (`vite.config.ts`), and on Vercel the `/api/*` rewrite does the same, so the cookie is first-party in both.

**Tests.** `cd backend && TEST_MONGO_URI=mongodb://127.0.0.1:27017/codeastra_test npm test` runs the auth integration suite (the database is dropped afterwards - use a throwaway DB). Without `TEST_MONGO_URI` those tests are skipped.
