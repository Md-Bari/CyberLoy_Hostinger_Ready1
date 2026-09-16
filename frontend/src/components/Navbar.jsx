import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, BookOpen, CheckSquare, GraduationCap, LayoutGrid, LogIn, ShieldCheck, User } from 'lucide-react';

export default function Navbar() {
    const { user, isAdmin } = useAuth();
    const location = useLocation();

    const getPageTitle = () => {
        const path = location.pathname;
        if (path.startsWith('/admin/task-builder')) return 'ISO 27001 Task Builder';
        if (path.startsWith('/admin/builder')) return 'Curriculum & Course Builder';
        if (path.startsWith('/admin/students')) return 'Student Directory & Progress';
        if (path.startsWith('/admin')) return 'Executive Compliance Dashboard';
        if (path.startsWith('/my-tasks')) return 'My Assigned ISO 27001 Tasks';
        if (path.startsWith('/learn')) return 'Interactive Classroom';
        if (path.startsWith('/courses')) return 'Course Catalog';
        if (path.startsWith('/certificates')) return 'Certificates Center';
        if (path.startsWith('/certificate/verify')) return 'Certificate Verification';
        return 'Learning Management Portal';
    };

    return (
        <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#07172d]/95 backdrop-blur-md shadow-md">
            <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Brand & Page Context */}
                <div className="flex items-center gap-3">
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 text-slate-950 font-black shadow-lg shadow-cyan-950/50 group-hover:scale-105 transition-transform">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-white hidden sm:inline">
                            CyberLoy <span className="text-cyan-400">LMS</span>
                        </span>
                    </Link>

                    <div className="h-5 w-px bg-slate-800 hidden md:block" />

                    <div className="hidden md:flex items-center gap-2 text-slate-300">
                        <span className="text-xs font-semibold text-cyan-400">/</span>
                        <span className="text-xs font-medium text-slate-300">{getPageTitle()}</span>
                    </div>
                </div>

                {/* Quick Actions & Profile */}
                <div className="flex items-center gap-3">
                    {/* Top Navigation Links */}
                    <div className="hidden lg:flex items-center gap-1 mr-2">
                        <Link
                            to="/courses"
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                location.pathname.startsWith('/courses')
                                    ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                            }`}
                        >
                            Courses
                        </Link>
                        {user && (
                            <Link
                                to="/my-tasks"
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                    location.pathname.startsWith('/my-tasks')
                                        ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60'
                                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                                }`}
                            >
                                ISO 27001 Tasks
                            </Link>
                        )}
                        {isAdmin && (
                            <Link
                                to="/admin"
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                    location.pathname.startsWith('/admin')
                                        ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60'
                                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                                }`}
                            >
                                Admin Center
                            </Link>
                        )}
                    </div>

                    {user ? (
                        <div className="flex items-center gap-3 rounded-full border border-slate-700/80 bg-slate-900/90 pl-1.5 pr-3 py-1 shadow-inner">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-600 to-teal-500 text-xs font-black text-slate-950 shadow-sm">
                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-xs font-bold text-slate-200 leading-tight">
                                    {user.name || 'User'}
                                </span>
                                <span className="text-[10px] font-mono text-cyan-400 leading-tight uppercase">
                                    {isAdmin ? 'Administrator' : 'Student'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                to="/login"
                                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
                            >
                                <LogIn className="h-3.5 w-3.5" />
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                className="rounded-xl bg-cyan-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-400 shadow-md shadow-cyan-950/50"
                            >
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
