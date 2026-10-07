import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { ApiError, startGoogleLogin } from '../services/auth.api';
import { AuthField, AuthShell, FormError, OrDivider } from '../components/AuthShell';
import { EMAIL_RE, primaryButton, secondaryButton } from '../components/authStyles';

type Errors = Partial<Record<'name' | 'email' | 'password' | 'confirmPassword', string>>;

// Mirrors the server's rules (the server is still the source of truth).
const validatePassword = (pw: string): string | undefined => {
  if (!pw) return 'Password is required';
  if (pw.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Password must contain at least one letter and one number';
  return undefined;
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Errors>({});

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const errs: Errors = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!EMAIL_RE.test(email.trim())) errs.email = 'Enter a valid email address';
    const pwError = validatePassword(password);
    if (pwError) errs.password = pwError;
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (confirmPassword !== password) errs.confirmPassword = 'Passwords do not match';
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        // Surface server-side validation next to the offending field too.
        const serverErrs: Errors = {};
        for (const fe of err.fieldErrors) {
          if (fe.field === 'name' || fe.field === 'email' || fe.field === 'password') serverErrs[fe.field] = fe.message;
        }
        setFieldErrors(serverErrs);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = (
    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      className="text-black/60 hover:text-black"
    >
      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <AuthShell title="Create your account" subtitle="Start mapping codebases in minutes.">
      <FormError message={error} />

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthField
          id="name"
          label="Name"
          type="text"
          autoComplete="name"
          placeholder="Ada Lovelace"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
        />
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
          autoComplete="new-password"
          placeholder="At least 8 characters, with a number"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          trailing={toggle}
        />
        <AuthField
          id="confirmPassword"
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={fieldErrors.confirmPassword}
        />

        <button type="submit" disabled={submitting} className={primaryButton}>
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <OrDivider />

      <button type="button" onClick={startGoogleLogin} disabled={submitting} className={secondaryButton}>
        <FaGoogle className="w-4 h-4" />
        Continue with Google
      </button>

      <p className="text-sm text-center mt-6 text-black/70">
        Already have an account?{' '}
        <Link to="/login" state={location.state} className="font-bold text-black underline underline-offset-2">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
