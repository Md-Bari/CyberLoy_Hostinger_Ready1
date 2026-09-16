import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    BarChart3,
    BookOpen,
    CheckSquare,
    ChevronRight,
    FileText,
    GraduationCap,
    LayoutGrid,
    LifeBuoy,
    LogOut,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Upload,
    Users,
    Award,
    FileCheck,
    Layers,
    ListTodo
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import EmergencySupportModal from './EmergencySupportModal';

export default function PortalSidebar({ activeTab, setActiveTab }) {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);

    const isAdminUser = isAdmin || user?.role === 'admin';

    const adminNavSections = [
        {
            title: 'EXECUTIVE & COMPLIANCE',
            items: [
                {
                    id: 'dashboard',
                    label: 'Executive Dashboard',
                    icon: LayoutGrid,
                    path: '/admin',
                    badge: 'Live',
                    description: 'ISO 27001 overview & metrics',
                },
                {
                    id: 'task-builder',
                    label: 'ISO 27001 Task Builder',
                    icon: ListTodo,
                    path: '/admin/task-builder',
                    badge: 'GRC',
                    description: 'Project plans, tasks & assignments',
                },
            ],
        },
        {
            title: 'LMS & ACADEMY',
            items: [
                {
                    id: 'builder',
                    label: 'Course & Curriculum Builder',
                    icon: GraduationCap,
                    path: '/admin/builder',
                    description: 'Create & edit courses, modules, lessons',
                },
                {
                    id: 'students',
                    label: 'Student Directory',
                    icon: Users,
                    path: '/admin/students',
                    description: 'Student enrollments & progress tracking',
                },
                {
                    id: 'courses',
                    label: 'Browse Course Catalog',
                    icon: BookOpen,
                    path: '/courses',
                    description: 'Explore all published courses',
                },
            ],
        },
        {
            title: 'CERTIFICATES & TOOLS',
            items: [
                {
                    id: 'my-certificates',
                    label: 'Certificates Center',
                    icon: Award,
                    path: '/certificates',
                    description: 'Issued certificates & downloads',
                },
                {
                    id: 'verify-cert',
                    label: 'Verify Certificate',
                    icon: FileCheck,
                    path: '/certificate/verify',
                    description: 'Public authenticity verification',
                },
            ],
        },
    ];

    const studentNavSections = [
        {
            title: 'MY WORKSPACE',
            items: [
                {
                    id: 'my-tasks',
                    label: 'My ISO 27001 Tasks',
                    icon: CheckSquare,
                    path: '/my-tasks',
                    badge: 'Active',
                    description: 'Assigned implementation tasks',
                },
                {
                    id: 'courses',
                    label: 'Course Catalog & Classroom',
                    icon: BookOpen,
                    path: '/courses',
                    description: 'Video lessons, quizzes & study labs',
                },
                {
                    id: 'certificates',
                    label: 'My Certificates',
                    icon: Award,
                    path: '/certificates',
                    description: 'Earned course & compliance awards',
                },
            ],
        },
        {
            title: 'TOOLS & VERIFICATION',
            items: [
                {
                    id: 'verify',
                    label: 'Verify Certificate',
                    icon: FileCheck,
                    path: '/certificate/verify',
                    description: 'Public blockchain/hash verification',
                },
            ],
        },
    ];

    const navSections = isAdminUser ? adminNavSections : studentNavSections;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="w-72 shrink-0 bg-[#07172d] border-r border-slate-800 min-h-screen flex flex-col text-slate-100 select-none shadow-2xl z-30">
            {/* Header Brand */}
            <div className="px-5 py-5 border-b border-slate-800 bg-[#081b35]">
                <Link to={isAdminUser ? '/admin' : '/courses'} className="flex items-center gap-3 group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-400 text-slate-950 shadow-md shadow-cyan-950/50 group-hover:scale-105 transition-transform">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                            CyberLoy
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono">
                                LMS
                            </span>
                        </div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400/80">
                            {isAdminUser ? 'Admin Portal' : 'Student Workspace'}
                        </div>
                    </div>
                </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6 custom-scrollbar">
                {navSections.map((section) => (
                    <div key={section.title}>
                        <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                            {section.title}
                        </div>

                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            if (location.pathname !== item.path) {
                                                navigate(item.path);
                                            }
                                            if (setActiveTab) {
                                                setActiveTab(item.id);
                                            }
                                        }}
                                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition duration-150 ${
                                            isActive
                                                ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/10 border border-cyan-500/40 text-cyan-300 shadow-sm'
                                                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                                            <div className="truncate">
                                                <div className="text-xs font-semibold tracking-wide truncate">{item.label}</div>
                                            </div>
                                        </div>

                                        {item.badge && (
                                            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase shrink-0 ${
                                                isActive
                                                    ? 'bg-cyan-500 text-slate-950 font-extrabold'
                                                    : 'bg-slate-800 text-cyan-400 border border-cyan-900/60'
                                            }`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Quick Emergency Incident Support Banner */}
                <div className="pt-2">
                    <button
                        onClick={() => setShowEmergencyModal(true)}
                        className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl bg-gradient-to-r from-rose-950/40 to-red-950/20 border border-rose-800/40 text-rose-300 hover:bg-rose-950/60 hover:border-rose-700/60 transition group text-left"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-rose-950 border border-rose-700/50 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform shrink-0">
                                <ShieldAlert className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-rose-200">Incident Support</div>
                                <div className="text-[10px] text-rose-400/80">24/7 Rapid Response</div>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-rose-400/70 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </nav>

            {/* Footer Profile & Logout */}
            <div className="border-t border-slate-800 bg-[#081b35] p-3 space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-900/80 p-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-600 to-teal-500 text-slate-950 text-xs font-black shadow-sm">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="truncate text-left">
                            <div className="text-xs font-bold text-slate-200 truncate">{user?.name || 'User'}</div>
                            <div className="text-[10px] font-mono uppercase text-cyan-400">
                                {isAdminUser ? 'Administrator' : 'Student'}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowEmergencyModal(true)}
                        title="Incident Support"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-950/60 transition border border-slate-700"
                    >
                        <LifeBuoy className="h-3.5 w-3.5" />
                    </button>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-red-950/50 hover:border-red-800/60 hover:text-red-300"
                >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                </button>
            </div>

            <EmergencySupportModal
                isOpen={showEmergencyModal}
                onClose={() => setShowEmergencyModal(false)}
            />
        </aside>
    );
}
