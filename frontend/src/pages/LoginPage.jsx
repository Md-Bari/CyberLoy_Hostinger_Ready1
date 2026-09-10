import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Shield, UserCheck, BookOpen, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
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
            } else {
                navigate('/courses');
            }
        } catch (err) {
            setError(err.message || 'Login failed. Please check credentials.');
        } finally {
            setLoading(false);
        }
    };

    const setDemoUser = (type) => {
        if (type === 'admin') {
            setEmail('admin@cyberloy.com');
            setPassword('password123');
        } else {
            setEmail('student@cyberloy.com');
            setPassword('password123');
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
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@domain.com"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                        <div className="relative">
                            <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                            <input
                                type="password"
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

                {/* Quick Demo Credentials Buttons */}
                <div className="mt-6 pt-6 border-t border-slate-800">
                    <p className="text-[11px] font-mono text-slate-400 text-center mb-3 uppercase tracking-wider">Quick Demo Login</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setDemoUser('user')}
                            className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                        >
                            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Student Demo</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setDemoUser('admin')}
                            className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 text-xs font-medium border border-amber-800/60 transition"
                        >
                            <Shield className="w-3.5 h-3.5 text-amber-400" />
                            <span>Admin Demo</span>
                        </button>
                    </div>

                    <div className="mt-4 space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-[11px] text-slate-300">
                        <div>
                            <span className="font-semibold text-cyan-400">Student demo:</span> student@cyberloy.com / password123
                        </div>
                        <div>
                            <span className="font-semibold text-amber-400">Admin demo:</span> admin@cyberloy.com / password123
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
