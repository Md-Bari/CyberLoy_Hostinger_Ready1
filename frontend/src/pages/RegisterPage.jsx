import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, Shield, AlertCircle, BookOpen } from 'lucide-react';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await register(name, email, password, role);
            if (res.user?.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/courses');
            }
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-cyan-950 border border-cyan-500/40 rounded-xl text-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-cyan-950/50">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Create Account</h2>
                    <p className="text-xs text-slate-400 mt-1">Join CyberLoy LMS Platform</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                        <div className="relative">
                            <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                            />
                        </div>
                    </div>

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
                                placeholder="Minimum 6 characters"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Select Role</label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition ${role === 'user' ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="user"
                                    checked={role === 'user'}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="hidden"
                                />
                                <User className="w-4 h-4" />
                                <span>General Student</span>
                            </label>
                            <label className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition ${role === 'admin' ? 'bg-amber-950/60 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                                <input
                                    type="radio"
                                    name="role"
                                    value="admin"
                                    checked={role === 'admin'}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="hidden"
                                />
                                <Shield className="w-4 h-4" />
                                <span>Administrator</span>
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-cyan-950/50 disabled:opacity-50 mt-2"
                    >
                        {loading ? 'Creating Account...' : 'Register'}
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
