import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, BookOpen, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [verificationNotice, setVerificationNotice] = useState(false);
    const [resendMessage, setResendMessage] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await login(email, password);
            if (res.user?.role === 'admin') {
                navigate('/admin');
            } else if (res.user?.role === 'instructor') {
                navigate('/instructor/reviews');
            } else {
                navigate('/courses');
            }
        } catch (err) {
            setError(err.message || 'Login failed. Please check credentials.');
            setVerificationNotice(Boolean(err.data?.email_verification_required));
        } finally {
            setLoading(false);
        }
    };

    const resendVerification = async () => {
        try {
            const result = await api.resendVerification(email);
            setResendMessage(result.message);
        } catch (err) {
            setResendMessage(err.message || 'Unable to resend verification email.');
        }
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-cyan-950 border border-cyan-500/40 rounded-xl text-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-cyan-950/50">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h2>
                    <p className="text-xs text-slate-400 mt-1">Sign in to access your CyberLoy LMS account</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="login-email" className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                            <input
                                type="email"
                                id="login-email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@domain.com"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="login-password" className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                        <div className="relative">
                            <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                            <input
                                type="password"
                                id="login-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-cyan-950/50 disabled:opacity-50"
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                {verificationNotice && (
                    <div className="mt-4 space-y-2">
                        <button type="button" onClick={resendVerification} className="text-sm text-cyan-300 underline">Resend verification email</button>
                        {resendMessage && <p role="status" className="text-xs text-slate-300">{resendMessage}</p>}
                    </div>
                )}
                <div className="mt-5 text-center">
                    <Link to="/reset-password" className="text-sm text-cyan-300 hover:underline">Forgot your password?</Link>
                </div>
            </div>
        </div>
    );
}
