import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutGrid, GraduationCap, Banknote, Briefcase, Wrench,
    ClipboardList, LogOut, ChevronRight, ChevronDown, BookOpen,
    Users, CheckSquare, CreditCard, Plus, Award, ShieldCheck, Sparkles, ShieldAlert
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import EmergencySupportModal from './EmergencySupportModal';
import logoUrl from '@/assets/cyberloy-logo.png';

export default function PortalSidebar({ activeTab, setActiveTab, paymentsCount = 0 }) {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);

    const isAdminUser = isAdmin || user?.role === 'admin';

    // Collapsible submenu states
    const [academicOpen, setAcademicOpen] = useState(true);
    const [financialOpen, setFinancialOpen] = useState(false);
    const [studentServicesOpen, setStudentServicesOpen] = useState(true);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="w-72 shrink-0 bg-[#080E21] border-r border-[#162447] min-h-screen flex flex-col font-sans text-slate-200 select-none shadow-2xl">
            {/* Top Emblem Header (Exact Daffodil / CyberLoy Style) */}
            <div className="p-4 border-b border-[#162447] bg-[#0A1128]">
                <Link to="/" className="flex items-center gap-3 group w-full">
                    <img
                        src={logoUrl}
                        alt="CyberLoy"
                        className="h-full w-full object-contain transition-transform group-hover:scale-105"
                    />
                </Link>
            </div>

            {/* Navigation Menu List */}
            <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto text-sm">
                {isAdminUser ? (
                    /* ADMIN SIDEBAR NAVIGATION ITEMS */
                    <>
                        {/* 1. Dashboard Analytics */}
                        <button
                            onClick={() => {
                                if (location.pathname !== '/admin') navigate('/admin');
                                if (setActiveTab) setActiveTab('analytics');
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all ${
                                location.pathname === '/admin' && (activeTab === 'analytics' || !activeTab)
                                    ? 'bg-[#16244A] text-white border-l-4 border-cyan-400 shadow-md'
                                    : 'text-slate-300 hover:bg-[#0F1C3F] hover:text-white'
                            }`}
                        >
                            <div className="flex items-center gap-3.5">
                                <LayoutGrid className="w-5 h-5 text-cyan-400 shrink-0" />
                                <span>Dashboard Analytics</span>
                            </div>
                        </button>

                        {/* 2. Academic Management (Collapsible) */}
                        <div>
                            <button
                                onClick={() => setAcademicOpen(!academicOpen)}
                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-slate-300 hover:bg-[#0F1C3F] hover:text-white transition"
                            >
                                <div className="flex items-center gap-3.5">
                                    <GraduationCap className="w-5 h-5 text-cyan-400 shrink-0" />
                                    <span>Academic Management</span>
                                </div>
                                {academicOpen ? (
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                )}
                            </button>

                            {academicOpen && (
                                <div className="ml-9 mt-1 space-y-1 pl-2 border-l border-[#1A2C5A]">
                                    <Link
                                        to="/admin/builder"
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                                            location.pathname === '/admin/builder'
                                                ? 'bg-[#16244A] text-cyan-300 font-bold'
                                                : 'text-slate-400 hover:text-slate-100 hover:bg-[#0F1C3F]'
                                        }`}
                                    >
                                        <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                                        <span>Course Curriculum Builder</span>
                                    </Link>

                                    <button
                                        onClick={() => {
                                            if (location.pathname !== '/admin') navigate('/admin');
                                            if (setActiveTab) setActiveTab('new_course');
                                        }}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition text-left ${
                                            activeTab === 'new_course'
                                                ? 'bg-[#16244A] text-cyan-300 font-bold'
                                                : 'text-slate-400 hover:text-slate-100 hover:bg-[#0F1C3F]'
                                        }`}
                                    >
                                        <Plus className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Publish New Course</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 3. Financial Service (Collapsible) */}
                        <div>
                            <button
                                onClick={() => setFinancialOpen(!financialOpen)}
                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-slate-300 hover:bg-[#0F1C3F] hover:text-white transition"
                            >
                                <div className="flex items-center gap-3.5">
                                    <Banknote className="w-5 h-5 text-emerald-400 shrink-0" />
                                    <span>Financial Service</span>
                                </div>
                                {financialOpen ? (
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                )}
                            </button>

                            {financialOpen && (
                                <div className="ml-9 mt-1 space-y-1 pl-2 border-l border-[#1A2C5A]">
                                    <button
                                        onClick={() => {
                                            if (location.pathname !== '/admin') navigate('/admin');
                                            if (setActiveTab) setActiveTab('payments');
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                                            activeTab === 'payments'
                                                ? 'bg-[#16244A] text-emerald-300 font-bold'
                                                : 'text-slate-400 hover:text-slate-100 hover:bg-[#0F1C3F]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>Payment Transactions</span>
                                        </div>
                                        {paymentsCount > 0 && (
                                            <span className="bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded font-mono text-[10px]">
                                                {paymentsCount}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 4. ISO 27001 Task Builder */}
                        <Link
                            to="/admin/task-builder"
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all ${
                                location.pathname === '/admin/task-builder'
                                    ? 'bg-[#16244A] text-white border-l-4 border-emerald-400 shadow-md'
                                    : 'text-slate-300 hover:bg-[#0F1C3F] hover:text-white'
                            }`}
                        >
                            <div className="flex items-center gap-3.5">
                                <Briefcase className="w-5 h-5 text-amber-400 shrink-0" />
                                <span>ISO 27001 Task Builder</span>
                            </div>
                        </Link>

                        {/* 5. Student Management */}
                        <Link
                            to="/admin/students"
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all ${
                                location.pathname === '/admin/students'
                                    ? 'bg-[#16244A] text-white border-l-4 border-cyan-400 shadow-md'
                                    : 'text-slate-300 hover:bg-[#0F1C3F] hover:text-white'
                            }`}
                        >
                            <div className="flex items-center gap-3.5">
                                <Users className="w-5 h-5 text-cyan-400 shrink-0" />
                                <span>Student Management</span>
                            </div>
                        </Link>

                        {/* 6. Emergency Incident Escalation Tickets */}
                        <button
                            onClick={() => {
                                if (location.pathname !== '/admin') navigate('/admin');
                                if (setActiveTab) setActiveTab('support');
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all ${
                                location.pathname === '/admin' && activeTab === 'support'
                                    ? 'bg-[#16244A] text-white border-l-4 border-rose-500 shadow-md'
                                    : 'text-slate-300 hover:bg-[#0F1C3F] hover:text-white'
                            }`}
                        >
                            
                        </button>

                        {/* 7. All Courses */}
                        <Link
                            to="/courses"
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all ${
                                location.pathname === '/courses'
                                    ? 'bg-[#16244A] text-white border-l-4 border-cyan-400 shadow-md'
                                    : 'text-slate-300 hover:bg-[#0F1C3F] hover:text-white'
                            }`}
                        >
                            <div className="flex items-center gap-3.5">
                                <BookOpen className="w-5 h-5 text-blue-400 shrink-0" />
                                <span>All Courses</span>
                            </div>
                        </Link>

                    </>
                ) : (
                    /* STUDENT SIDEBAR NAVIGATION ITEMS */
                    <>
                        {/* 1. All Courses / My Learning */}
                        <Link
                            to="/courses"
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all ${
                                location.pathname === '/courses'
                                    ? 'bg-[#16244A] text-white border-l-4 border-cyan-400 shadow-md'
                                    : 'text-slate-300 hover:bg-[#0F1C3F] hover:text-white'
                            }`}
                        >
                            <div className="flex items-center gap-3.5">
                                <BookOpen className="w-5 h-5 text-cyan-400 shrink-0" />
                                <span>My Courses & Learning</span>
                            </div>
                        </Link>

                        {/* 2. My ISO Excel Tasks */}
                        <Link
                            to="/my-tasks"
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all ${
                                location.pathname === '/my-tasks'
                                    ? 'bg-[#16244A] text-white border-l-4 border-emerald-400 shadow-md'
                                    : 'text-slate-300 hover:bg-[#0F1C3F] hover:text-white'
                            }`}
                        >
                            <div className="flex items-center gap-3.5">
                                <ClipboardList className="w-5 h-5 text-emerald-400 shrink-0" />
                                <span>My ISO Excel Tasks</span>
                            </div>
                        </Link>

                        {/* 3. My Certificates */}
                        <Link
                            to="/certificates"
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all ${
                                location.pathname === '/certificates'
                                    ? 'bg-[#16244A] text-white border-l-4 border-amber-400 shadow-md'
                                    : 'text-slate-300 hover:bg-[#0F1C3F] hover:text-white'
                            }`}
                        >
                            <div className="flex items-center gap-3.5">
                                <Award className="w-5 h-5 text-amber-400 shrink-0" />
                                <span>My Certificates</span>
                            </div>
                        </Link>
                    </>
                )}

                <div className="pt-6 border-t border-[#162447] mt-4 space-y-1.5">
                    <button
                        onClick={() => setShowEmergencyModal(true)}
                        className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition bg-rose-950/20 border border-rose-800/50"
                    >
                        <ShieldAlert className="w-5 h-5 shrink-0" />
                        <span>Emergency Support</span>
                    </button>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition"
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        <span>Logout</span>
                    </button>
                </div>
            </nav>

            {/* Footer User Info */}
            {user && (
                <div className="p-4 border-t border-[#162447] bg-[#0A1128] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-cyan-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0 uppercase">
                        {user.name?.charAt(0)}
                    </div>
                    <div className="overflow-hidden font-mono text-xs">
                        <span className="text-white font-bold block truncate">{user.name}</span>
                        <span className="text-[10px] text-slate-400 capitalize block">{user.role} Account</span>
                    </div>
                </div>
            )}

            <EmergencySupportModal
                isOpen={showEmergencyModal}
                onClose={() => setShowEmergencyModal(false)}
            />
        </aside>
    );
}

