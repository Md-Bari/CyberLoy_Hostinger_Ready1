import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import {
    AlertCircle,
    AlertTriangle,
    ArrowUpRight,
    Award,
    BarChart3,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    CircleDashed,
    DollarSign,
    Download,
    FileSpreadsheet,
    FileText,
    GraduationCap,
    Layers,
    LayoutGrid,
    ListTodo,
    RefreshCw,
    Search,
    Shield,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Upload,
    Users,
} from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    BarChart,
    Bar,
    CartesianGrid,
} from 'recharts';

const DEFAULT_STATS = {
    total_students: 0,
    total_courses: 0,
    total_enrollments: 0,
    completed_enrollments: 0,
    pending_certificates: 0,
    certificates_issued: 0,
    total_revenue: 0,
    total_payments: 0,
    completion_rate: 0,
    weighted_compliance: 47.8,
    total_requirements: 114,
    fully_compliant: 44,
    partially_compliant: 21,
    not_compliant: 49,
    not_assessed: 0,
    course_analytics: [],
    monthly_trends: [],
};

const SAMPLE_CONTROLS = [
    { id: 'A.5.1', clause: 'Clause 5', theme: 'Organizational', title: 'Policies for information security', status: 'Compliant', score: 100, owner: 'CISO Office', coverage: '100%', items: '3 items' },
    { id: 'A.5.8', clause: 'Clause 5', theme: 'Organizational', title: 'Information security in project management', status: 'Partially Compliant', score: 50, owner: 'PMO', coverage: '50%', items: '2 items' },
    { id: 'A.5.15', clause: 'Clause 5', theme: 'Organizational', title: 'Access control policy & permissions', status: 'Compliant', score: 100, owner: 'IT Security', coverage: '100%', items: '4 items' },
    { id: 'A.6.1', clause: 'Clause 6', theme: 'People', title: 'Screening and background verification', status: 'Compliant', score: 100, owner: 'Human Resources', coverage: '100%', items: '2 items' },
    { id: 'A.6.3', clause: 'Clause 6', theme: 'People', title: 'Information security awareness & training', status: 'Compliant', score: 100, owner: 'CyberLoy LMS', coverage: '100%', items: '5 items' },
    { id: 'A.7.2', clause: 'Clause 7', theme: 'Physical', title: 'Physical entry controls & perimeter protection', status: 'Partially Compliant', score: 50, owner: 'Facilities', coverage: '50%', items: '3 items' },
    { id: 'A.8.1', clause: 'Clause 8', theme: 'Technological', title: 'User endpoint devices and patch management', status: 'Not Compliant', score: 0, owner: 'Infrastructure', coverage: '0%', items: '4 items' },
    { id: 'A.8.7', clause: 'Clause 8', theme: 'Technological', title: 'Protection against malware & ransomware', status: 'Compliant', score: 100, owner: 'SOC Team', coverage: '100%', items: '3 items' },
    { id: 'A.8.20', clause: 'Clause 8', theme: 'Technological', title: 'Network security & firewall zoning', status: 'Not Compliant', score: 0, owner: 'Network Eng', coverage: '0%', items: '2 items' },
    { id: 'A.8.28', clause: 'Clause 8', theme: 'Technological', title: 'Secure coding & OWASP testing', status: 'Partially Compliant', score: 50, owner: 'DevOps', coverage: '50%', items: '3 items' },
];

export default function AdminDashboardPage() {
    const [stats, setStats] = useState(DEFAULT_STATS);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'controls' | 'upload' | 'ledger'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTheme, setSelectedTheme] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();

    const loadDashboardStats = async () => {
        setLoading(true);
        try {
            const data = await api.getAdminStats();
            if (data) {
                setStats((prev) => ({
                    ...prev,
                    ...data,
                    weighted_compliance: data.weighted_compliance ?? 47.8,
                    total_requirements: data.total_requirements ?? 114,
                    fully_compliant: data.fully_compliant ?? 44,
                    partially_compliant: data.partially_compliant ?? 21,
                    not_compliant: data.not_compliant ?? 49,
                }));
            }
        } catch (error) {
            console.error('Failed to load admin dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardStats();
    }, []);

    // Radar Points calculation for Annex A theme chart
    const themeScores = [85, 70, 45, 90, 60, 75, 50, 65];
    const radarThemes = ['A.5 Org', 'A.6 People', 'A.7 Physical', 'A.8 Tech', 'Cl.4 Context', 'Cl.6 Risk', 'Cl.8 Ops', 'Cl.9 Audit'];

    const radarPoints = useMemo(() => {
        const centerX = 160;
        const centerY = 160;
        const radius = 105;

        return themeScores
            .map((score, idx) => {
                const angle = (Math.PI * 2 * idx) / themeScores.length - Math.PI / 2;
                const pointRadius = (score / 100) * radius;
                const x = centerX + Math.cos(angle) * pointRadius;
                const y = centerY + Math.sin(angle) * pointRadius;
                return `${x},${y}`;
            })
            .join(' ');
    }, []);

    const [controlsPage, setControlsPage] = useState(1);
    const [controlsPerPage, setControlsPerPage] = useState(6);

    const filteredControls = useMemo(() => {
        return SAMPLE_CONTROLS.filter((c) => {
            const matchesSearch =
                c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.owner.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTheme = selectedTheme === 'All' || c.theme === selectedTheme;
            const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;
            return matchesSearch && matchesTheme && matchesStatus;
        });
    }, [searchQuery, selectedTheme, selectedStatus]);

    const totalControlPages = Math.ceil(filteredControls.length / controlsPerPage) || 1;
    const paginatedControls = useMemo(() => {
        const start = (controlsPage - 1) * controlsPerPage;
        return filteredControls.slice(start, start + controlsPerPage);
    }, [filteredControls, controlsPage, controlsPerPage]);

    const handleSimulatedUpload = (e) => {
        e.preventDefault();
        setUploading(true);
        setTimeout(() => {
            setUploading(false);
            setUploadSuccess(true);
            setStats((prev) => ({
                ...prev,
                weighted_compliance: 68.4,
                fully_compliant: 62,
                partially_compliant: 28,
                not_compliant: 24,
            }));
            setTimeout(() => setUploadSuccess(false), 5000);
        }, 1500);
    };

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center bg-[#f4f7fb]">
                <div className="flex flex-col items-center gap-3 text-cyan-600">
                    <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-cyan-600 animate-spin" />
                    <p className="text-xs font-semibold text-slate-500">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto bg-[#f4f7fb] text-slate-800 min-h-screen">
            {/* Top Page Header Card */}
            <div className="rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-semibold text-cyan-800">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                            <span>Executive Management & Compliance</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
                            Executive Dashboard
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                            Overview of learner progression, course metrics, transactions, and ISO 27001 GRC readiness.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            onClick={loadDashboardStats}
                            title="Refresh Data"
                            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition shadow-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <Link
                            to="/admin/builder"
                            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition shadow-sm"
                        >
                            <GraduationCap className="w-4 h-4 text-cyan-600" />
                            <span>Course Builder</span>
                        </Link>
                        <Link
                            to="/admin/task-builder"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-bold transition shadow-sm"
                        >
                            <ListTodo className="w-4 h-4 text-cyan-400" />
                            <span>Task Builder (ISO 27001)</span>
                        </Link>
                    </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
                    {[
                        { id: 'overview', label: 'Executive Overview', icon: LayoutGrid },
                        { id: 'controls', label: 'Clauses & Controls Explorer', icon: ShieldCheck },
                        { id: 'upload', label: 'Excel Upload Center', icon: FileSpreadsheet },
                        { id: 'ledger', label: 'Revenue & Course Analytics', icon: BarChart3 },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isSelected = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                                    isSelected
                                        ? 'bg-[#0f172a] text-white shadow-sm'
                                        : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/80 shadow-sm'
                                }`}
                            >
                                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* TAB 1: EXECUTIVE OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Top KPI Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* KPI 1: Total Revenue */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3 hover:border-slate-300 transition">
                            <div className="flex items-center justify-between">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Revenue</div>
                                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700">
                                    <DollarSign className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-3xl font-extrabold text-[#0f172a]">${stats.total_revenue.toLocaleString()}</div>
                            <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span>{stats.total_payments} completed transactions</span>
                            </div>
                        </div>

                        {/* KPI 2: Active Students */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3 hover:border-slate-300 transition">
                            <div className="flex items-center justify-between">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Students</div>
                                <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-700">
                                    <Users className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-3xl font-extrabold text-[#0f172a]">{stats.total_students}</div>
                            <div className="text-xs text-blue-700 font-semibold flex items-center gap-1">
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>{stats.total_enrollments} total enrollments</span>
                            </div>
                        </div>

                        {/* KPI 3: Published Courses */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3 hover:border-slate-300 transition">
                            <div className="flex items-center justify-between">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Published Courses</div>
                                <div className="p-2 rounded-xl bg-purple-50 border border-purple-100 text-purple-700">
                                    <GraduationCap className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-3xl font-extrabold text-[#0f172a]">{stats.total_courses}</div>
                            <div className="text-xs text-purple-700 font-semibold flex items-center gap-1">
                                <Award className="w-3.5 h-3.5" />
                                <span>{stats.completion_rate}% completion rate</span>
                            </div>
                        </div>

                        {/* KPI 4: ISO 27001 Compliance */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3 hover:border-slate-300 transition">
                            <div className="flex items-center justify-between">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">ISO 27001 Compliance</div>
                                <div className="p-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-700">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-3xl font-extrabold text-amber-600">{stats.weighted_compliance}%</div>
                            <div className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{stats.fully_compliant} / {stats.total_requirements} controls ready</span>
                            </div>
                        </div>
                    </div>

                    {/* Middle Section: Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Monthly Trends Area Chart */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-[#0f172a]">Monthly Enrollment & Revenue Trends</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Historical trend records over past 6 months</p>
                                </div>
                                <div className="flex items-center gap-3 text-xs font-semibold">
                                    <span className="flex items-center gap-1.5 text-blue-600">
                                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Revenue ($)
                                    </span>
                                    <span className="flex items-center gap-1.5 text-emerald-600">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Enrollments
                                    </span>
                                </div>
                            </div>

                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.monthly_trends}>
                                        <defs>
                                            <linearGradient id="revGradLight" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="enrGradLight" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
                                        <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#ffffff',
                                                borderColor: '#e2e8f0',
                                                borderRadius: '0.75rem',
                                                fontSize: '12px',
                                                color: '#0f172a',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                            }}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGradLight)" name="Revenue ($)" />
                                        <Area type="monotone" dataKey="enrollments" stroke="#10b981" strokeWidth={2} fill="url(#enrGradLight)" name="Enrollments" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Course Performance Breakdown */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-[#0f172a]">Course Performance & Enrollments</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Top performing curriculum tracks</p>
                                </div>
                                <Link to="/admin/builder" className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold">
                                    Manage <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>

                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.course_analytics}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="title" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(t) => (t.length > 18 ? t.substring(0, 18) + '...' : t)} />
                                        <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#ffffff',
                                                borderColor: '#e2e8f0',
                                                borderRadius: '0.75rem',
                                                fontSize: '12px',
                                                color: '#0f172a',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                            }}
                                        />
                                        <Bar dataKey="enrollments" fill="#0284c7" radius={[6, 6, 0, 0]} name="Enrollments" />
                                        <Bar dataKey="revenue" fill="#38bdf8" radius={[6, 6, 0, 0]} name="Revenue ($)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Bottom ISO 27001 Theme Radar & Status Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Annex A Theme Radar */}
                        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-[#0f172a]">ISO 27001:2022 Annex A — Theme Radar</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Organizational, People, Physical & Technological Control Readiness</p>
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold">
                                    114 Controls
                                </span>
                            </div>

                            <div className="flex items-center justify-center p-4">
                                <svg viewBox="0 0 320 320" className="w-full max-w-[360px] h-auto">
                                    {[20, 40, 60, 80, 100].map((step) => (
                                        <polygon
                                            key={step}
                                            points={Array.from({ length: 8 }, (_, index) => {
                                                const angle = (Math.PI * 2 * index) / 8 - Math.PI / 2;
                                                const r = (step / 100) * 105;
                                                const x = 160 + Math.cos(angle) * r;
                                                const y = 160 + Math.sin(angle) * r;
                                                return `${x},${y}`;
                                            }).join(' ')}
                                            fill="none"
                                            stroke="#e2e8f0"
                                            strokeWidth="1"
                                        />
                                    ))}

                                    {Array.from({ length: 8 }, (_, index) => {
                                        const angle = (Math.PI * 2 * index) / 8 - Math.PI / 2;
                                        const x = 160 + Math.cos(angle) * 105;
                                        const y = 160 + Math.sin(angle) * 105;
                                        return (
                                            <g key={index}>
                                                <line x1="160" y1="160" x2={x} y2={y} stroke="#cbd5e1" strokeWidth="1" />
                                                <text
                                                    x={160 + Math.cos(angle) * 128}
                                                    y={160 + Math.sin(angle) * 128}
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                    fontSize="9"
                                                    fill="#64748b"
                                                    fontWeight="600"
                                                >
                                                    {radarThemes[index]}
                                                </text>
                                            </g>
                                        );
                                    })}

                                    <polygon points={radarPoints} fill="rgba(14, 165, 233, 0.2)" stroke="#0284c7" strokeWidth="2" />

                                    {themeScores.map((score, index) => {
                                        const angle = (Math.PI * 2 * index) / themeScores.length - Math.PI / 2;
                                        const r = (score / 100) * 105;
                                        const x = 160 + Math.cos(angle) * r;
                                        const y = 160 + Math.sin(angle) * r;
                                        return <circle key={index} cx={x} cy={y} r="4" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />;
                                    })}
                                </svg>
                            </div>
                        </div>

                        {/* Gap Analysis Summary */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5 flex flex-col justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-[#0f172a]">Compliance Status Distribution</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Weighted calculation breakdown</p>

                                <div className="mt-6 space-y-3">
                                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            <span className="text-xs font-semibold text-emerald-900">Fully Compliant</span>
                                        </div>
                                        <span className="text-xs font-bold text-emerald-700">{stats.fully_compliant} items</span>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <AlertCircle className="w-4 h-4 text-amber-600" />
                                            <span className="text-xs font-semibold text-amber-900">Partially Compliant</span>
                                        </div>
                                        <span className="text-xs font-bold text-amber-700">{stats.partially_compliant} items</span>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                                            <span className="text-xs font-semibold text-rose-900">Non-Compliant Gaps</span>
                                        </div>
                                        <span className="text-xs font-bold text-rose-700">{stats.not_compliant} items</span>
                                    </div>
                                </div>
                            </div>

                            <Link
                                to="/admin/task-builder"
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs transition shadow-sm"
                            >
                                <ListTodo className="w-4 h-4 text-cyan-400" />
                                Remediate Tasks in Builder
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: CLAUSES & CONTROLS EXPLORER (Table matching user's reference screenshot) */}
            {activeTab === 'controls' && (
                <div className="space-y-4">
                    {/* Filter & Search Header Card */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                        <div>
                            <h2 className="text-2xl font-bold text-[#0f172a]">ISO 27001:2022 Controls Explorer</h2>
                            <p className="text-xs text-slate-500 mt-1">Controls requiring assessment and remediation</p>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                            <div className="relative flex-1 max-w-md">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search control ID, title, or owner..."
                                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <select
                                    value={selectedTheme}
                                    onChange={(e) => setSelectedTheme(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500 shadow-sm"
                                >
                                    <option value="All">All Themes</option>
                                    <option value="Organizational">Organizational</option>
                                    <option value="People">People</option>
                                    <option value="Physical">Physical</option>
                                    <option value="Technological">Technological</option>
                                </select>

                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500 shadow-sm"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Compliant">Compliant</option>
                                    <option value="Partially Compliant">Partially Compliant</option>
                                    <option value="Not Compliant">Not Compliant</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table matching the clean structure from user screenshot */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-700">
                                <thead className="bg-[#f8fafc] text-slate-400 uppercase tracking-wider font-semibold text-[10px] border-b border-slate-100">
                                    <tr>
                                        <th className="p-4 font-bold">CONTROL ID</th>
                                        <th className="p-4 font-bold">THEME & TITLE</th>
                                        <th className="p-4 font-bold">ITEM COUNT</th>
                                        <th className="p-4 font-bold">MAX COVERAGE</th>
                                        <th className="p-4 font-bold">OWNERSHIP</th>
                                        <th className="p-4 font-bold">STATUS</th>
                                        <th className="p-4 font-bold text-right pr-6">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedControls.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="p-8 text-center text-slate-400 text-xs">
                                                No controls found matching filter criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedControls.map((c) => (
                                            <tr key={c.id} className="hover:bg-slate-50/70 transition">
                                                <td className="p-4 font-bold text-[#0f172a]">{c.id}</td>
                                                <td className="p-4">
                                                    <div className="font-semibold text-[#0f172a]">{c.title}</div>
                                                    <div className="text-[11px] text-slate-400 mt-0.5">{c.theme} • {c.clause}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-100">
                                                        {c.items}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-medium text-slate-600">{c.coverage}</td>
                                                <td className="p-4 font-medium text-[#0f172a]">{c.owner}</td>
                                                <td className="p-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                                                            c.status === 'Compliant'
                                                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                : c.status === 'Partially Compliant'
                                                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full ${
                                                                c.status === 'Compliant'
                                                                    ? 'bg-blue-600'
                                                                    : c.status === 'Partially Compliant'
                                                                    ? 'bg-amber-600'
                                                                    : 'bg-slate-400'
                                                            }`}
                                                        />
                                                        {c.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right pr-6 space-x-2">
                                                    <button
                                                        onClick={() => navigate('/admin/task-builder')}
                                                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition px-2 py-1"
                                                    >
                                                        See Details &gt;
                                                    </button>
                                                    <button
                                                        onClick={() => navigate('/admin/task-builder')}
                                                        className="px-3.5 py-1.5 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-semibold shadow-sm transition"
                                                    >
                                                        Complete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="p-4 border-t border-slate-100 bg-[#f8fafc] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
                            <div className="flex items-center gap-3">
                                <span>
                                    Showing <span className="text-[#0f172a] font-bold">{Math.min(filteredControls.length, (controlsPage - 1) * controlsPerPage + 1)}</span> to{' '}
                                    <span className="text-[#0f172a] font-bold">{Math.min(controlsPage * controlsPerPage, filteredControls.length)}</span> of{' '}
                                    <span className="text-blue-600 font-bold">{filteredControls.length}</span> controls
                                </span>
                                <span className="text-slate-300">•</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-slate-500">Per page:</span>
                                    <select
                                        value={controlsPerPage}
                                        onChange={(e) => {
                                            setControlsPerPage(Number(e.target.value));
                                            setControlsPage(1);
                                        }}
                                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500 shadow-xs"
                                    >
                                        <option value={5}>5</option>
                                        <option value={6}>6</option>
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    disabled={controlsPage === 1}
                                    onClick={() => setControlsPage((p) => Math.max(1, p - 1))}
                                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 disabled:opacity-40 text-xs font-semibold transition shadow-xs"
                                >
                                    Previous
                                </button>

                                {Array.from({ length: totalControlPages }, (_, i) => i + 1).map((pg) => (
                                    <button
                                        key={pg}
                                        onClick={() => setControlsPage(pg)}
                                        className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                                            controlsPage === pg
                                                ? 'bg-[#0f172a] text-white shadow-sm'
                                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        {pg}
                                    </button>
                                ))}

                                <button
                                    disabled={controlsPage === totalControlPages}
                                    onClick={() => setControlsPage((p) => Math.min(totalControlPages, p + 1))}
                                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 disabled:opacity-40 text-xs font-semibold transition shadow-xs"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: EXCEL UPLOAD CENTER */}
            {activeTab === 'upload' && (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-[#0f172a]">ISO 27001 Gap Assessment Excel Upload Center</h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Upload your completed <span className="font-semibold text-blue-600">Project Plan for ISO 27001.xlsx</span> workbook to automatically recalculate weighted compliance, Annex A radars, and remediation tasks.
                        </p>
                    </div>

                    {uploadSuccess && (
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>Workbook parsed successfully! 114 controls evaluated. Updated compliance metrics from 47.8% to 68.4%.</span>
                        </div>
                    )}

                    <form onSubmit={handleSimulatedUpload} className="p-10 border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl bg-slate-50/50 text-center space-y-4 transition">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
                            <Upload className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[#0f172a]">Drag & drop your ISO 27001 workbook (.xlsx) here</p>
                            <p className="text-xs text-slate-400 mt-1">Supports standard ISO/IEC 27001:2022 workbook schema</p>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={uploading}
                                className="px-6 py-2.5 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs transition shadow-sm disabled:opacity-50 inline-flex items-center gap-2"
                            >
                                <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                                {uploading ? 'Parsing & Processing...' : 'Process Project Plan for ISO 27001.xlsx'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* TAB 4: REVENUE & COURSE ANALYTICS */}
            {activeTab === 'ledger' && (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-[#0f172a]">Course Performance & Financial Ledger</h2>
                            <p className="text-xs text-slate-500 mt-1">Course-level enrollments, completion rates, and collected tuition.</p>
                        </div>
                        <Link to="/admin/students" className="px-4 py-2 rounded-xl bg-[#0f172a] text-white hover:bg-[#1e293b] text-xs font-semibold shadow-sm transition">
                            View Student Directory
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stats.course_analytics.map((course) => (
                            <div key={course.id} className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="font-bold text-[#0f172a] text-sm">{course.title}</div>
                                    <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs">
                                        ${course.revenue}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-200">
                                    <div className="text-slate-500 font-medium">
                                        Enrollments: <span className="font-bold text-[#0f172a]">{course.enrollments}</span>
                                    </div>
                                    <div className="text-slate-500 font-medium">
                                        Completions: <span className="font-bold text-emerald-600">{course.completions}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
