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
