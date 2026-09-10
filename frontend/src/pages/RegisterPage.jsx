import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, BookOpen, Shield, UserCheck } from 'lucide-react';

export default function RegisterPage() {
    return (
        <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
            <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-cyan-950 border border-cyan-500/40 rounded-xl text-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-cyan-950/50">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Account Registration</h2>
                    <p className="text-xs text-slate-400 mt-1">New accounts are created by the admin only.</p>
                </div>

                <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <div className="font-semibold">Registration is currently disabled for users.</div>
                        <div className="mt-1 text-red-200/90">Please sign in with the provided demo account or ask the administrator to create your login credentials.</div>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3 text-sm text-slate-300">
                    <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-cyan-300"><UserCheck className="w-4 h-4" /> Student demo</span>
                        <span className="font-mono text-slate-200">student@cyberloy.com</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-amber-300"><Shield className="w-4 h-4" /> Admin demo</span>
                        <span className="font-mono text-slate-200">admin@cyberloy.com</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 text-xs text-slate-400">
                        Demo password: <span className="font-mono text-slate-200">password123</span>
                    </div>
                </div>

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
