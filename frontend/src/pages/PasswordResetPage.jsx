import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';

export default function PasswordResetPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const initialEmail = searchParams.get('email') || '';
    const [email, setEmail] = useState(initialEmail);
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);
        try {
            if (token) {
                const result = await api.resetPassword({
                    token,
                    email,
                    password,
                    password_confirmation: passwordConfirmation,
                });
                setMessage(result.message);
            } else {
                const result = await api.requestPasswordReset(email);
                setMessage(result.message);
            }
        } catch (requestError) {
            setError(requestError.message || 'Unable to process this request.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="mx-auto flex min-h-[75vh] max-w-md items-center px-4 py-10">
            <section className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-7 text-slate-100 shadow-xl">
                <h1 className="text-2xl font-bold">{token ? 'Choose a new password' : 'Reset your password'}</h1>
                <p className="mt-2 text-sm text-slate-400">
                    {token ? 'Use a new password with at least 12 characters.' : 'We will email a reset link if an account matches.'}
                </p>
                <form onSubmit={submit} className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="reset-email" className="mb-1 block text-sm font-medium">Email address</label>
                        <input
                            id="reset-email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                        />
                    </div>
                    {token && (
                        <>
                            <div>
                                <label htmlFor="new-password" className="mb-1 block text-sm font-medium">New password</label>
                                <input id="new-password" type="password" autoComplete="new-password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label htmlFor="password-confirmation" className="mb-1 block text-sm font-medium">Confirm new password</label>
                                <input id="password-confirmation" type="password" autoComplete="new-password" minLength={12} required value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
                            </div>
                        </>
                    )}
                    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
                    {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}
                    <button type="submit" disabled={loading} className="w-full rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50">
                        {loading ? 'Please wait...' : token ? 'Reset password' : 'Send reset link'}
                    </button>
                </form>
                <Link to="/login" className="mt-5 inline-block text-sm text-cyan-300 hover:underline">Return to sign in</Link>
            </section>
        </main>
    );
}
