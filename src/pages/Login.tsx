import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

export default function Login() {
  const { signIn } = useAuth();
  const { t } = useLang();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) setError(error);
    else nav('/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-xl font-bold text-slate-800">{t('app_name')}</h1>
        {error && <p className="mb-4 rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</p>}
        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium text-slate-600">Email</span>
          <input
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </label>
        <label className="mb-6 block">
          <span className="mb-1 block text-sm font-medium text-slate-600">Password</span>
          <input
            type="password" required value={password} onChange={e => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </label>
        <button
          type="submit" disabled={busy}
          className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {busy ? '…' : 'Login'}
        </button>
      </form>
    </div>
  );
}
