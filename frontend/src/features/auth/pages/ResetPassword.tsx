import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthField, AuthShell, FormError } from '../components/AuthShell';
import { primaryButton } from '../components/authStyles';
import { ApiError, resetPassword } from '../services/auth.api';

const validatePassword = (value: string): string | null => {
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Password must contain at least one letter and one number.';
  if (new TextEncoder().encode(value).length > 72) return 'Password must be at most 72 bytes.';
  return null;
};

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!token) return setError('This reset link is missing its token. Request a new link.');
    const passwordError = validatePassword(password);
    if (passwordError) return setError(passwordError);
    if (password !== confirmPassword) return setError('Passwords do not match.');

    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setComplete(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Set a new password" subtitle="Choose a new password for your CodeAstra account.">
      <FormError message={error} />
      {complete ? (
        <div role="status" className="space-y-4 text-sm">
          <p>Your password has been updated. You can now log in with it.</p>
          <Link to="/login" className="font-bold underline underline-offset-2">Go to login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <AuthField id="password" label="New password" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} />
          <AuthField id="confirm-password" label="Confirm new password" type="password" autoComplete="new-password" placeholder="Enter it again" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          <button type="submit" disabled={submitting} className={primaryButton}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Updating…' : 'Update password'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
