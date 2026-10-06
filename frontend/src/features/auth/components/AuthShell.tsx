import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

/** Shared page frame for Login/Register — mirrors the LandingPage look. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FBF3C4] text-black font-sans flex flex-col">
      <header className="flex items-center px-6 sm:px-10 py-5 max-w-5xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-indigo-500 border-2 border-black shadow-md flex items-center justify-center font-bold text-sm">
            CA
          </div>
          <span className="font-bold text-lg tracking-tight">CodeAstra</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md bg-[#FFFBE0] border-2 border-black shadow-md rounded-lg p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-black/60 mt-1 mb-6">{subtitle}</p>
          {children}
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-black/50 font-mono">
        CodeAstra © {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export function AuthField({
  id,
  label,
  error,
  trailing,
  ...inputProps
}: { id: string; label: string; error?: string; trailing?: ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold mb-1.5">{label}</label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full bg-[#FFFDF0] rounded-lg border-2 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 placeholder-black/40 ${
            trailing ? 'pr-11' : ''
          } ${error ? 'border-red-500' : 'border-black'}`}
          {...inputProps}
        />
        {trailing && <div className="absolute inset-y-0 right-0 flex items-center pr-3">{trailing}</div>}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2 bg-red-400/20 border-2 border-red-500 rounded-lg px-3 py-2.5 text-sm text-red-700 mb-4">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-5 text-xs text-black/50 font-mono">
      <span className="flex-1 border-t-2 border-black/15" />
      or
      <span className="flex-1 border-t-2 border-black/15" />
    </div>
  );
}
