import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { ApiError, startGoogleLogin } from '../services/auth.api';
import { AuthField, AuthShell, FormError, OrDivider } from './AuthShell';
import { EMAIL_RE, primaryButton, secondaryButton } from './authStyles';

// `?error=` codes the backend appends when the Google round trip fails.
const OAUTH_ERRORS: Record<string, string> = {
  google_denied: 'Google sign-in was cancelled.',
  google_state_mismatch: 'Google sign-in could not be verified. Please try again.',
  google_failed: 'Google sign-in failed. Please try again.',
  google_email_unverified: 'Your Google account does not have a verified email address.',
  google_account_conflict: 'This email is already linked to a different Google account.',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(OAUTH_ERRORS[params.get('error') ?? ''] ?? null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const errs: typeof fieldErrors = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!EMAIL_RE.test(email.trim())) errs.email = 'Enter a valid email address';
    if (!password) errs.password = 'Password is required';
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to analyze repositories with CodeAstra.">
      <FormError message={error} />

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />
        <AuthField
          id="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="text-black/60 hover:text-black"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        <button type="submit" disabled={submitting} className={primaryButton}>
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? 'Logging in…' : 'Login'}
        </button>
      </form>

      <OrDivider />

      <button type="button" onClick={startGoogleLogin} disabled={submitting} className={secondaryButton}>
        <FaGoogle className="w-4 h-4" />
        Continue with Google
      </button>

      <p className="text-sm text-center mt-6 text-black/70">
        New to CodeAstra?{' '}
        <Link to="/register" state={location.state} className="font-bold text-black underline underline-offset-2">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
