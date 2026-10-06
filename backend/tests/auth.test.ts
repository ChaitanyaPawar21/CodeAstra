/**
 * Auth integration tests (real Express app + real MongoDB).
 *
 * Skipped unless TEST_MONGO_URI is set, e.g.
 *   TEST_MONGO_URI=mongodb://127.0.0.1:27017/codeastra_test npm test
 * The database is DROPPED at the end — never point this at real data.
 * The AI service is mocked; nothing here calls GitHub or the LLM.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import passport from "passport";

const TEST_URI = process.env.TEST_MONGO_URI;
const JWT_SECRET = "test-secret-test-secret-test-secret-123456";

vi.mock("../src/services/ai.service.ts", () => ({
  default: {
    analyseRepository: vi.fn(async () => ({
      success: true,
      errors: [],
      result: { m1: [], m2: null, m3: { graph: [], formattedAscii: "" } },
    })),
  },
}));

const suite = TEST_URI ? describe : describe.skip;

suite("auth + protected analysis (integration)", () => {
  let app: import("express").Express;
  let userModel: typeof import("../src/models/user.model.js").default;
  let repoModel: typeof import("../src/models/repoAnalysis.model.js").default;
  let authService: typeof import("../src/services/auth.service.js").default;
  let aiService: { analyseRepository: ReturnType<typeof vi.fn> };

  const uniq = () => Math.random().toString(36).slice(2, 10);
  const creds = (tag = uniq()) => ({ name: "Test User", email: `user-${tag}@example.com`, password: "Passw0rdOK" });
  const cookieOf = (res: request.Response) =>
    (res.headers["set-cookie"] as unknown as string[] | undefined)?.find((c) => c.startsWith("codeastra_token="));

  beforeAll(async () => {
    Object.assign(process.env, {
      PORT: "5055", MONGO_URI: TEST_URI, GITHUB_TOKEN: "x", NVIDIA_API_KEY: "x",
      JWT_SECRET, FRONTEND_URL: "http://localhost:5173",
      GOOGLE_CLIENT_ID: "fake-client-id", GOOGLE_CLIENT_SECRET: "fake-secret",
      GOOGLE_CALLBACK_URL: "http://localhost:5055/api/auth/google/callback",
    });
    await mongoose.connect(TEST_URI!);
    app = (await import("../src/app.js")).default;
    userModel = (await import("../src/models/user.model.js")).default;
    repoModel = (await import("../src/models/repoAnalysis.model.js")).default;
    authService = (await import("../src/services/auth.service.js")).default;
    aiService = (await import("../src/services/ai.service.js")).default as any;
    await Promise.all([userModel.init(), repoModel.init()]);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  /* ------------------------------ registration ----------------------------- */
  describe("register", () => {
    it("creates an account, sets an HttpOnly JWT cookie, never returns the password", async () => {
      const c = creds();
      const res = await request(app).post("/api/auth/register").send(c);
      expect(res.status).toBe(201);
      expect(res.body.data.user).toMatchObject({ name: c.name, email: c.email, provider: "local" });
      expect(JSON.stringify(res.body)).not.toMatch(/password|\$2[aby]\$/i);
      const cookie = cookieOf(res)!;
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).toMatch(/SameSite=Lax/i);
      const token = cookie.split(";")[0].split("=")[1];
      const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
      expect(payload.userId).toBe(res.body.data.user.id);
    });

    it("stores a bcrypt hash, not the plain password", async () => {
      const c = creds();
      await request(app).post("/api/auth/register").send(c);
      const doc = await userModel.findOne({ email: c.email }).select("+password");
      expect(doc!.password).not.toBe(c.password);
      expect(doc!.password).toMatch(/^\$2[aby]\$12\$/);
      expect(await bcrypt.compare(c.password, doc!.password!)).toBe(true);
    });

    it("never selects the hash by default", async () => {
      const c = creds();
      await request(app).post("/api/auth/register").send(c);
      expect((await userModel.findOne({ email: c.email }))!.password).toBeUndefined();
    });

    it("rejects a duplicate email (409), case-insensitively", async () => {
      const c = creds();
      await request(app).post("/api/auth/register").send(c);
      const res = await request(app).post("/api/auth/register").send({ ...c, email: c.email.toUpperCase() });
      expect(res.status).toBe(409);
    });

    it.each([
      ["invalid email", { email: "not-an-email" }],
      ["missing name", { name: "" }],
      ["too-short password", { password: "Ab1" }],
      ["password without a number", { password: "OnlyLettersHere" }],
      ["password without a letter", { password: "1234567890" }],
      ["password over bcrypt's 72-byte limit", { password: "a1".repeat(40) }],
    ])("rejects %s (400)", async (_label, patch) => {
      const res = await request(app).post("/api/auth/register").send({ ...creds(), ...patch });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  /* --------------------------------- login --------------------------------- */
  describe("login / me / logout", () => {
    it("logs in with correct credentials and issues a JWT cookie", async () => {
      const c = creds();
      await request(app).post("/api/auth/register").send(c);
      const res = await request(app).post("/api/auth/login").send({ email: c.email, password: c.password });
      expect(res.status).toBe(200);
      expect(cookieOf(res)).toBeTruthy();
    });

    it("rejects a wrong password and an unknown email with the SAME 401 message", async () => {
      const c = creds();
      await request(app).post("/api/auth/register").send(c);
      const wrong = await request(app).post("/api/auth/login").send({ email: c.email, password: "WrongPass1" });
      const unknown = await request(app).post("/api/auth/login").send({ email: "nobody@example.com", password: "WrongPass1" });
      expect(wrong.status).toBe(401);
      expect(unknown.status).toBe(401);
      expect(wrong.body.message).toBe(unknown.body.message);
      expect(cookieOf(wrong)).toBeUndefined();
    });

    it("400s on missing fields", async () => {
      expect((await request(app).post("/api/auth/login").send({})).status).toBe(400);
    });

    it("/me returns the user when logged in and 401 when not", async () => {
      const agent = request.agent(app);
      const c = creds();
      await agent.post("/api/auth/register").send(c);
      const ok = await agent.get("/api/auth/me");
      expect(ok.status).toBe(200);
      expect(ok.body.data.user.email).toBe(c.email);
      expect((await request(app).get("/api/auth/me")).status).toBe(401);
    });

    it("logout clears the cookie, after which /me is 401", async () => {
      const agent = request.agent(app);
      await agent.post("/api/auth/register").send(creds());
      const out = await agent.post("/api/auth/logout");
      expect(out.status).toBe(200);
      expect(cookieOf(out)).toMatch(/codeastra_token=;/);
      expect((await agent.get("/api/auth/me")).status).toBe(401);
    });
  });

  /* ------------------------- JWT middleware (401 cases) --------------------- */
  describe("authMiddleware", () => {
    const protectedCall = (headers: Record<string, string> = {}) =>
      request(app).post("/api/analysis").set(headers).send({ repoUrl: "https://github.com/a/b" });

    it("no credentials → 401", async () => {
      const res = await protectedCall();
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("NO_TOKEN");
    });

    it("garbage token → 401", async () => {
      expect((await protectedCall({ Authorization: "Bearer not.a.jwt" })).status).toBe(401);
    });

    it("token signed with the wrong secret → 401", async () => {
      const bad = jwt.sign({ userId: new mongoose.Types.ObjectId().toString() }, "some-other-secret-some-other-secret");
      expect((await protectedCall({ Authorization: `Bearer ${bad}` })).status).toBe(401);
    });

    it("unsigned (alg=none) token → 401", async () => {
      const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
      const none = `${b64({ alg: "none", typ: "JWT" })}.${b64({ userId: new mongoose.Types.ObjectId().toString() })}.`;
      expect((await protectedCall({ Authorization: `Bearer ${none}` })).status).toBe(401);
    });

    it("expired token → 401 TOKEN_EXPIRED", async () => {
      const { body } = await request(app).post("/api/auth/register").send(creds());
      const expired = jwt.sign({ userId: body.data.user.id }, JWT_SECRET, { expiresIn: -10 });
      const res = await protectedCall({ Authorization: `Bearer ${expired}` });
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("TOKEN_EXPIRED");
    });

    it("valid token for a deleted user → 401", async () => {
      const { body } = await request(app).post("/api/auth/register").send(creds());
      await userModel.deleteOne({ _id: body.data.user.id });
      const token = authService.generateToken(body.data.user.id);
      expect((await protectedCall({ Authorization: `Bearer ${token}` })).status).toBe(401);
    });

    it("does not break public routes", async () => {
      expect((await request(app).get("/")).status).toBe(200);
    });
  });

  /* ---------------- analysis ↔ user association (security req.) ------------- */
  describe("RepoAnalysis.userId", () => {
    it("stores the authenticated user's id; ignores a spoofed userId in the body", async () => {
      const a = request.agent(app);
      const reg = await a.post("/api/auth/register").send(creds());
      const spoof = new mongoose.Types.ObjectId().toString();
      const url = `https://github.com/own/repo-${uniq()}`;

      const res = await a.post("/api/analysis").send({ repoUrl: url, userId: spoof });
      expect(res.status).toBe(200);
      const rec = await repoModel.findById(res.body.analysisId);
      expect(String(rec!.userId)).toBe(reg.body.data.user.id);
      expect(String(rec!.userId)).not.toBe(spoof);
      expect(rec!.status).toBe("completed");
    });

    it("keeps User A's and User B's analyses separate, incl. on a cache hit", async () => {
      const A = request.agent(app);
      const B = request.agent(app);
      const a = (await A.post("/api/auth/register").send(creds())).body.data.user.id;
      const b = (await B.post("/api/auth/register").send(creds())).body.data.user.id;
      const urlA = `https://github.com/shared/repo-${uniq()}`;
      const urlB = `https://github.com/only-b/repo-${uniq()}`;

      const ra = await A.post("/api/analysis").send({ repoUrl: urlA });
      const rb = await B.post("/api/analysis").send({ repoUrl: urlB });
      expect(String((await repoModel.findById(ra.body.analysisId))!.userId)).toBe(a);
      expect(String((await repoModel.findById(rb.body.analysisId))!.userId)).toBe(b);

      // B asks for A's repo → served from cache, but recorded as B's.
      const calls = aiService.analyseRepository.mock.calls.length;
      const rb2 = await B.post("/api/analysis").send({ repoUrl: urlA });
      expect(rb2.body.cached).toBe(true);
      expect(aiService.analyseRepository.mock.calls.length).toBe(calls); // no re-run
      expect(String((await repoModel.findById(rb2.body.analysisId))!.userId)).toBe(b);
      expect(rb2.body.analysisId).not.toBe(ra.body.analysisId);

      // B repeating it reuses B's own copy instead of piling up duplicates.
      const rb3 = await B.post("/api/analysis").send({ repoUrl: urlA });
      expect(rb3.body.analysisId).toBe(rb2.body.analysisId);
    });

    it("still validates repoUrl (existing behaviour)", async () => {
      const a = request.agent(app);
      await a.post("/api/auth/register").send(creds());
      expect((await a.post("/api/analysis").send({})).status).toBe(400);
    });
  });

  /* ------------------------------ Google OAuth ----------------------------- */
  describe("Google OAuth 2.0", () => {
    const profile = (over: Partial<Parameters<typeof authService.findOrCreateGoogleUser>[0]> = {}) => ({
      googleId: `g-${uniq()}`, email: `g-${uniq()}@example.com`, emailVerified: true, name: "Gina Google", ...over,
    });

    it("creates a new Google user (no password, provider=google)", async () => {
      const p = profile();
      const u = await authService.findOrCreateGoogleUser(p);
      const doc = await userModel.findById(u.id).select("+password");
      expect(doc).toMatchObject({ provider: "google", googleId: p.googleId, email: p.email });
      expect(doc!.password).toBeUndefined();
    });

    it("recognises a returning Google user — no duplicate", async () => {
      const p = profile();
      const first = await authService.findOrCreateGoogleUser(p);
      const second = await authService.findOrCreateGoogleUser(p);
      expect(second.id).toBe(first.id);
      expect(await userModel.countDocuments({ email: p.email })).toBe(1);
    });

    it("links to an existing local account with the same email — no duplicate", async () => {
      const c = creds();
      const reg = await request(app).post("/api/auth/register").send(c);
      const u = await authService.findOrCreateGoogleUser(profile({ email: c.email }));
      expect(u.id).toBe(reg.body.data.user.id);
      expect(await userModel.countDocuments({ email: c.email })).toBe(1);
    });

    it("pre-registration takeover is neutralised: local password + old tokens die on link", async () => {
      const c = creds();
      const reg = await request(app).post("/api/auth/register").send(c); // "attacker" pre-registers
      const oldToken = authService.generateToken(reg.body.data.user.id);
      await new Promise((r) => setTimeout(r, 1100)); // iat has 1-second resolution
      await authService.findOrCreateGoogleUser(profile({ email: c.email })); // real owner uses Google

      const login = await request(app).post("/api/auth/login").send({ email: c.email, password: c.password });
      expect(login.status).toBe(401);
      const old = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${oldToken}`);
      expect(old.status).toBe(401);
      expect(old.body.code).toBe("TOKEN_REVOKED");
    });

    it("refuses an unverified Google email", async () => {
      await expect(authService.findOrCreateGoogleUser(profile({ emailVerified: false }))).rejects.toMatchObject({ status: 403 });
    });

    it("refuses a different Google account claiming an already-linked email", async () => {
      const p = profile();
      await authService.findOrCreateGoogleUser(p);
      await expect(
        authService.findOrCreateGoogleUser(profile({ email: p.email })),
      ).rejects.toMatchObject({ status: 409 });
    });

    it("/google redirects to Google with a state, and sets the state cookie", async () => {
      const res = await request(app).get("/api/auth/google");
      expect(res.status).toBe(302);
      const loc = new URL(res.headers.location);
      expect(loc.host).toBe("accounts.google.com");
      expect(loc.searchParams.get("client_id")).toBe("fake-client-id");
      expect(loc.searchParams.get("scope")).toContain("email");
      const stateCookie = (res.headers["set-cookie"] as unknown as string[]).find((c) => c.startsWith("codeastra_oauth_state="))!;
      expect(stateCookie).toMatch(/HttpOnly/i);
      expect(stateCookie.split(";")[0].split("=")[1]).toBe(loc.searchParams.get("state"));
    });

    it("callback rejects a missing/forged state (CSRF) and sets no auth cookie", async () => {
      const none = await request(app).get("/api/auth/google/callback?code=abc");
      expect(none.status).toBe(302);
      expect(none.headers.location).toContain("/login?error=google_state_mismatch");
      const forged = await request(app)
        .get("/api/auth/google/callback?code=abc&state=forged")
        .set("Cookie", "codeastra_oauth_state=real");
      expect(forged.headers.location).toContain("google_state_mismatch");
      expect(cookieOf(forged)).toBeUndefined();
    });

    it("full callback (Google's HTTP calls stubbed): creates user, sets JWT cookie, redirects to dashboard", async () => {
      const strategy = (passport as any)._strategy("google");
      const p = profile();
      strategy._oauth2.getOAuthAccessToken = (_c: string, _o: unknown, cb: Function) => cb(null, "at", "rt", {});
      strategy.userProfile = (_t: string, cb: Function) =>
        cb(null, { provider: "google", id: p.googleId, displayName: p.name, emails: [{ value: p.email, verified: true }], _json: {} });

      const start = await request(app).get("/api/auth/google");
      const state = new URL(start.headers.location).searchParams.get("state")!;

      const agent = request.agent(app);
      const cb = await agent.get(`/api/auth/google/callback?code=abc&state=${state}`).set("Cookie", `codeastra_oauth_state=${state}`);
      expect(cb.status).toBe(302);
      expect(cb.headers.location).toBe("http://localhost:5173/dashboard");
      const token = cookieOf(cb)!.split(";")[0].split("=")[1];
      const doc = await userModel.findOne({ googleId: p.googleId });
      expect((jwt.verify(token, JWT_SECRET) as jwt.JwtPayload).userId).toBe(String(doc!._id));

      // …and that cookie really authenticates against the protected API.
      const meRes = await request(app).get("/api/auth/me").set("Cookie", `codeastra_token=${token}`);
      expect(meRes.body.data.user.email).toBe(p.email);
    });

    it("user denying consent on Google's screen → redirect with error, no cookie", async () => {
      const start = await request(app).get("/api/auth/google");
      const state = new URL(start.headers.location).searchParams.get("state")!;
      const res = await request(app).get(`/api/auth/google/callback?error=access_denied&state=${state}`).set("Cookie", `codeastra_oauth_state=${state}`);
      expect(res.headers.location).toContain("error=google_denied");
      expect(cookieOf(res)).toBeUndefined();
    });
  });
});
