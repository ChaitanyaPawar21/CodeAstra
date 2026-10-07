import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthField, AuthShell, FormError } from '../components/AuthShell';
import { EMAIL_RE, primaryButton } from '../components/authStyles';
import { ApiError, requestPasswordReset } from '../services/auth.api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Forgot password?" subtitle="Enter your account email and we’ll send you a reset link.">
      <FormError message={error} />
      {sent ? (
        <div role="status" className="space-y-4 text-sm">
          <p>If an account exists for that email, a reset link has been sent. Check your inbox.</p>
          <Link to="/login" className="font-bold underline underline-offset-2">Back to login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <AuthField id="email" label="Email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          <button type="submit" disabled={submitting} className={primaryButton}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
          <p className="text-sm text-center"><Link to="/login" className="font-bold underline underline-offset-2">Back to login</Link></p>
        </form>
      )}
    </AuthShell>
  );
}
