import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, BookOpen, Mail, Lock, UserRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (form.password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            const res = await register(form.name, form.email, form.password, 'user');
            setSuccess('Account created successfully. Redirecting to your learning portal...');
            setTimeout(() => {
                if (res.user?.role === 'admin') {
                    navigate('/admin');
                } else if (res.user?.role === 'instructor') {
                    navigate('/instructor/reviews');
                } else {
                    navigate('/courses');
                }
            }, 800);
        } catch (err) {
            setError(err.message || 'Unable to create your account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
            <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-cyan-950 border border-cyan-500/40 rounded-xl text-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-cyan-950/50">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Create Student Account</h2>
                    <p className="text-xs text-slate-400 mt-1">Join CyberLoy and start your learning path</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{success}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="register-name" className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                        <div className="relative">
                            <UserRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                            <input
                                id="register-name"
                                name="name"
                                type="text"
                                required
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Jane Doe"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="register-email" className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                            <input
                                id="register-email"
                                name="email"
                                type="email"
                                required
                                value={form.email}
                                onChange={handleChange}
                                placeholder="name@domain.com"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="register-password" className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                        <div className="relative">
                            <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                            <input
                                id="register-password"
                                name="password"
                                type="password"
                                required
                                minLength={8}
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Create a secure password"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="register-confirm-password" className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password</label>
                        <div className="relative">
                            <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                            <input
                                id="register-confirm-password"
                                name="confirmPassword"
                                type="password"
                                required
                                value={form.confirmPassword}
                                onChange={handleChange}
                                placeholder="Repeat your password"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-cyan-950/50 disabled:opacity-50"
                    >
                        {loading ? 'Creating account...' : 'Create Student Account'}
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-slate-400">
                    Already have an account?{' '}
                    <Link to="/login" className="text-cyan-400 hover:underline font-semibold">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
