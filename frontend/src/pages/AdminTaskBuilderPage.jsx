import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
    CheckSquare, Plus, Edit2, Trash2, Users, Save, ShieldCheck,
    Clock, CheckCircle, AlertCircle, ArrowLeft, RefreshCw, Layers,
    FileText, UserCheck, ChevronRight, Sliders, Info, Table, Download, Calendar, Search
} from 'lucide-react';

import { Link } from 'react-router-dom';

export default function AdminTaskBuilderPage() {
    const [plans, setPlans] = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [planData, setPlanData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    // Modals
    const [showNewPlanModal, setShowNewPlanModal] = useState(false);
    const [showNewTaskModal, setShowNewTaskModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [activeTab, setActiveTab] = useState('sheet'); // 'sheet' | 'matrix'

    // Form states
    const [newPlanForm, setNewPlanForm] = useState({
        title: 'ISO 27001 Compliance Project Plan',
        standard: 'ISO 27001',
        description: 'Pro tip ➜ Use this project plan as your main source of guidance during the certification project.',
        company_name: 'CyberLoy LMS Organization',
        project_owner: 'Chief Information Security Officer (CISO)',
        weeks_duration: 12,
    });

    const [taskForm, setTaskForm] = useState({
        phase: 'Implementation phase',
        prefix: '2.9',
        title: '',
        details: '',
        comments: '',
    });

    const [allUsers, setAllUsers] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState([]);

    useEffect(() => {
        loadPlans();
        loadAllUsers();
    }, []);

    const loadPlans = async () => {
        setLoading(true);
        try {
            const res = await api.getAdminProjectPlans();
            setPlans(res.plans || []);
            if (res.plans && res.plans.length > 0) {
                const defaultId = selectedPlanId || res.plans[0].id;
                setSelectedPlanId(defaultId);
                loadPlanDetails(defaultId);
            }
        } catch (err) {
            setError(err.message || 'Failed to load project plans');
        } finally {
            setLoading(false);
        }
    };

    const [userSearchTerm, setUserSearchTerm] = useState('');

    const loadAllUsers = async () => {
        try {
            const res = await api.getAdminUsersList();
            if (res.users) setAllUsers(res.users);
        } catch (err) {
            console.error('Failed to load user list:', err);
        }
    };


    const loadPlanDetails = async (planId) => {
        try {
            const res = await api.getAdminProjectPlanDetails(planId);
            setPlanData(res);
            if (res.plan && res.plan.assigned_users) {
                setSelectedUserIds(res.plan.assigned_users.map(u => u.id));
            }
        } catch (err) {
            console.error('Failed to load plan detail:', err);
        }
    };

    const handleSelectPlan = (id) => {
        setSelectedPlanId(id);
        loadPlanDetails(id);
    };

    const handleCreatePlan = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const res = await api.createProjectPlan(newPlanForm);
            setSuccessMsg('Project Plan created successfully!');
            setShowNewPlanModal(false);
            loadPlans();
            setSelectedPlanId(res.plan.id);
            loadPlanDetails(res.plan.id);
        } catch (err) {
            setError(err.message || 'Failed to create plan');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveTask = async (e) => {
        e.preventDefault();
        if (!selectedPlanId) return;
        setActionLoading(true);
        try {
            if (editingTask) {
                await api.updateProjectTask(editingTask.id, taskForm);
                setSuccessMsg('Task updated successfully!');
            } else {
                await api.addProjectTask(selectedPlanId, taskForm);
                setSuccessMsg('Task added successfully!');
            }
            setShowNewTaskModal(false);
            setEditingTask(null);
            setTaskForm({ phase: 'Implementation phase', prefix: '', title: '', details: '', comments: '' });
            loadPlanDetails(selectedPlanId);
        } catch (err) {
            setError(err.message || 'Failed to save task');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this row?')) return;
        try {
            await api.deleteProjectTask(taskId);
            setSuccessMsg('Task row deleted!');
            loadPlanDetails(selectedPlanId);
        } catch (err) {
            setError(err.message || 'Failed to delete task');
        }
    };

    const handleAssignUsers = async () => {
        if (!selectedPlanId) return;
        setActionLoading(true);
        try {
            await api.assignUsersToProjectPlan(selectedPlanId, selectedUserIds);
            setSuccessMsg('Assigned users updated!');
            setShowAssignModal(false);
            loadPlanDetails(selectedPlanId);
        } catch (err) {
            setError(err.message || 'Failed to assign users');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAdminUpdateUserProgress = async (userId, taskId, pct) => {
        try {
            await api.adminUpdateUserTaskProgress(selectedPlanId, userId, {
                task_id: taskId,
                progress_percentage: pct,
            });
            loadPlanDetails(selectedPlanId);
        } catch (err) {
            console.error('Failed to update progress:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center text-emerald-400 font-mono text-sm">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading Excel Spreadsheet Engine...
            </div>
        );
    }

    const currentPlan = planData?.plan;
    const tasks = currentPlan?.tasks || [];
    const userSummaries = planData?.user_summaries || [];

    // Group tasks by phase
    const groupedPhases = tasks.reduce((acc, t) => {
        if (!acc[t.phase]) acc[t.phase] = [];
        acc[t.phase].push(t);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Top Toolbar Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-emerald-900/60 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                <div className="space-y-1 z-10">
                    <div className="flex items-center gap-2">
                        <Link to="/admin" className="text-slate-400 hover:text-emerald-400 transition text-xs font-mono flex items-center gap-1">
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin
                        </Link>
                        <span className="text-slate-700">•</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                            <Table className="w-3 h-3" /> Excel Spreadsheet Mode
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                        <ShieldCheck className="w-7 h-7 text-emerald-400" />
                        Project Plan Task Management & Builder
                    </h1>
                </div>

                <div className="flex items-center gap-3 shrink-0 z-10">
                    <button
                        onClick={() => setShowNewPlanModal(true)}
                        className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create New Plan</span>
                    </button>
                </div>
            </div>

            {/* Notification Messages */}
            {successMsg && (
                <div className="p-3 bg-emerald-950/90 border border-emerald-800 rounded-xl text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in fade-in">
                    <span>{successMsg}</span>
                    <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-emerald-200">✕</button>
                </div>
            )}

            {/* Excel Sheet Selector & View Mode Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 overflow-x-auto">
                    {plans.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => handleSelectPlan(p.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 ${
                                selectedPlanId === p.id
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 shadow-sm'
                                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                            }`}
                        >
                            <Table className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{p.title}</span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-950 text-[10px] text-slate-400 border border-slate-800">
                                {p.tasks_count || 0} rows
                            </span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
                    <button
                        onClick={() => setActiveTab('sheet')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 ${
                            activeTab === 'sheet' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Table className="w-3.5 h-3.5" /> Spreadsheet View
                    </button>
                    <button
                        onClick={() => setActiveTab('matrix')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 ${
                            activeTab === 'matrix' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Users className="w-3.5 h-3.5" /> Student Progress Matrix
                    </button>
                </div>
            </div>

            {currentPlan && (
                <div className="space-y-6">
                    {/* Excel Header Information Box (Matching ISO 27001 Spreadsheet Metadata Header) */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white tracking-tight">{currentPlan.title}</h2>
                                    <p className="text-xs font-mono text-emerald-400/90 mt-0.5">
                                        Pro tip ➜ Update task status every week. Guidance & columns mirror ISO 27001 standards.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowAssignModal(true)}
                                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold flex items-center gap-1.5 border border-slate-700 transition"
                                >
                                    <Users className="w-4 h-4 text-emerald-400" />
                                    <span>Assigned Students ({currentPlan.assigned_users?.length || 0})</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingTask(null);
                                        setTaskForm({ phase: 'Implementation phase', prefix: '', title: '', details: '', comments: '' });
                                        setShowNewTaskModal(true);
                                    }}
                                    className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5 border border-emerald-500/30 transition"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Insert Row</span>
                                </button>
                            </div>
                        </div>

                        {/* Excel Header Metadata Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs font-mono">
                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                                <span className="text-slate-500 block text-[10px] uppercase font-bold">STANDARD</span>
                                <span className="text-emerald-400 font-bold">{currentPlan.standard}</span>
                            </div>
                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                                <span className="text-slate-500 block text-[10px] uppercase font-bold">COMPANY NAME</span>
                                <span className="text-white font-bold truncate block">{currentPlan.company_name || 'CyberLoy'}</span>
                            </div>
                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                                <span className="text-slate-500 block text-[10px] uppercase font-bold">PROJECT OWNER</span>
                                <span className="text-white font-bold truncate block">{currentPlan.project_owner || 'CISO'}</span>
                            </div>
                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                                <span className="text-slate-500 block text-[10px] uppercase font-bold">DURATION</span>
                                <span className="text-white font-bold">{currentPlan.weeks_duration} Weeks</span>
                            </div>
                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                                <span className="text-slate-500 block text-[10px] uppercase font-bold">TOTAL ROWS</span>
                                <span className="text-cyan-400 font-bold">{tasks.length} Tasks</span>
                            </div>
                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                                <span className="text-slate-500 block text-[10px] uppercase font-bold">ASSIGNED USERS</span>
                                <span className="text-emerald-400 font-bold">{currentPlan.assigned_users?.length || 0} Users</span>
                            </div>
                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                                <span className="text-slate-500 block text-[10px] uppercase font-bold">STATUS</span>
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5" /> Active Sheet
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* View 1: Authentic Excel Spreadsheet Data Grid */}
                    {activeTab === 'sheet' && (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse font-sans text-xs">
                                    {/* Excel Table Column Headers */}
                                    <thead>
                                        <tr className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                                            <th className="py-3 px-4 w-12 text-center border-r border-slate-800">Row</th>
                                            <th className="py-3 px-4 w-28 border-r border-slate-800">Prefix</th>
                                            <th className="py-3 px-4 w-64 border-r border-slate-800">Tasks</th>
                                            <th className="py-3 px-4 border-r border-slate-800">Details & Guidance</th>
                                            <th className="py-3 px-4 w-44 border-r border-slate-800 text-center">Phase</th>
                                            <th className="py-3 px-4 w-56 border-r border-slate-800">Comments / Notes</th>
                                            <th className="py-3 px-4 w-24 text-center">Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-800/80 font-sans">
                                        {Object.entries(groupedPhases).map(([phaseName, phaseTasks], phaseIdx) => (
                                            <React.Fragment key={phaseName}>
                                                {/* Phase Group Header Row (Excel Section Divider Style) */}
                                                <tr className="bg-emerald-950/40 text-emerald-300 font-mono font-bold text-xs border-y border-emerald-900/60">
                                                    <td colSpan="7" className="py-2.5 px-4 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Layers className="w-4 h-4 text-emerald-400" />
                                                            <span>PHASE {phaseIdx + 1}: {phaseName.toUpperCase()}</span>
                                                        </div>
                                                        <span className="text-[10px] bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
                                                            {phaseTasks.length} Task Rows
                                                        </span>
                                                    </td>
                                                </tr>

                                                {/* Task Rows in Phase */}
                                                {phaseTasks.map((t, index) => (
                                                    <tr key={t.id} className="hover:bg-slate-800/50 transition group border-b border-slate-800/60">
                                                        {/* Row # */}
                                                        <td className="py-3 px-4 text-center font-mono text-slate-500 border-r border-slate-800/80 bg-slate-950/40">
                                                            {t.sort_order || index + 1}
                                                        </td>

                                                        {/* Prefix */}
                                                        <td className="py-3 px-4 font-mono font-bold text-emerald-400 border-r border-slate-800/80">
                                                            {t.prefix || `${phaseIdx + 1}.${index + 1}`}
                                                        </td>

                                                        {/* Task Title */}
                                                        <td className="py-3 px-4 font-semibold text-slate-100 border-r border-slate-800/80">
                                                            {t.title}
                                                        </td>

                                                        {/* Details */}
                                                        <td className="py-3 px-4 text-slate-300 text-[11px] leading-relaxed border-r border-slate-800/80">
                                                            {t.details || <span className="text-slate-600 italic">No details</span>}
                                                        </td>

                                                        {/* Phase Name Tag */}
                                                        <td className="py-3 px-4 border-r border-slate-800/80 text-center">
                                                            <span className="text-[10px] font-mono bg-slate-950 text-slate-400 px-2 py-1 rounded border border-slate-800 block truncate">
                                                                {t.phase}
                                                            </span>
                                                        </td>

                                                        {/* Comments */}
                                                        <td className="py-3 px-4 text-amber-300/80 font-mono text-[11px] border-r border-slate-800/80">
                                                            {t.comments ? (
                                                                <span>💬 {t.comments}</span>
                                                            ) : (
                                                                <span className="text-slate-600 italic">-</span>
                                                            )}
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="py-3 px-4 text-center">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingTask(t);
                                                                        setTaskForm({
                                                                            phase: t.phase,
                                                                            prefix: t.prefix || '',
                                                                            title: t.title,
                                                                            details: t.details || '',
                                                                            comments: t.comments || '',
                                                                        });
                                                                        setShowNewTaskModal(true);
                                                                    }}
                                                                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                                                    title="Edit Row"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteTask(t.id)}
                                                                    className="p-1 rounded bg-red-950/60 hover:bg-red-900/80 text-red-400 transition border border-red-800/60"
                                                                    title="Delete Row"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* View 2: Student Progress Matrix */}
                    {activeTab === 'matrix' && (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                <div>
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <Users className="w-5 h-5 text-emerald-400" />
                                        <span>Student Task Completion Matrix</span>
                                    </h3>
                                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                                        View and manage task progress percentages for every assigned user.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowAssignModal(true)}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs font-mono border border-emerald-500/30"
                                >
                                    Assign Students
                                </button>
                            </div>

                            {userSummaries.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 font-mono text-xs">
                                    No students assigned to this project plan yet.
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {userSummaries.map((summary) => (
                                        <div key={summary.user.id} className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-cyan-600 text-white font-bold flex items-center justify-center text-xs shadow-md">
                                                        {summary.user.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-white">{summary.user.name}</h4>
                                                        <span className="text-xs text-slate-500 font-mono">{summary.user.email}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="text-right font-mono">
                                                        <span className="text-xs text-slate-400 block">Overall Progress</span>
                                                        <span className="text-emerald-400 font-bold text-base">{summary.overall_progress}%</span>
                                                    </div>
                                                    <div className="w-24 bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                                                        <div
                                                            className="h-full bg-emerald-400 transition-all duration-500"
                                                            style={{ width: `${summary.overall_progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* User Tasks Progress Table */}
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left font-mono text-xs">
                                                    <thead>
                                                        <tr className="bg-slate-900 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                                                            <th className="p-2">Task</th>
                                                            <th className="p-2 w-32">Phase</th>
                                                            <th className="p-2 w-64">Set Progress %</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-900">
                                                        {tasks.map((t) => (
                                                            <tr key={t.id} className="hover:bg-slate-900/50">
                                                                <td className="p-2 text-slate-200">
                                                                    <span className="text-emerald-400 font-bold mr-1">{t.prefix}</span> {t.title}
                                                                </td>
                                                                <td className="p-2 text-slate-400 text-[10px]">{t.phase}</td>
                                                                <td className="p-2">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max="100"
                                                                        defaultValue="0"
                                                                        onBlur={(e) => handleAdminUpdateUserProgress(summary.user.id, t.id, parseInt(e.target.value) || 0)}
                                                                        className="w-20 bg-slate-900 border border-slate-800 rounded p-1 text-center text-emerald-400 font-bold outline-none"
                                                                    />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Modal 1: Create New Plan Modal */}
            {showNewPlanModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Plus className="w-5 h-5 text-emerald-400" /> Create New Project Plan
                            </h3>
                            <button onClick={() => setShowNewPlanModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
                        </div>

                        <form onSubmit={handleCreatePlan} className="space-y-4 text-xs font-mono">
                            <div>
                                <label className="block text-slate-400 mb-1">Project Plan Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newPlanForm.title}
                                    onChange={(e) => setNewPlanForm({ ...newPlanForm, title: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-emerald-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-400 mb-1">Compliance Standard</label>
                                    <input
                                        type="text"
                                        value={newPlanForm.standard}
                                        onChange={(e) => setNewPlanForm({ ...newPlanForm, standard: e.target.value })}
                                        placeholder="e.g. ISO 27001, SOC 2"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1">Duration (Weeks)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={newPlanForm.weeks_duration}
                                        onChange={(e) => setNewPlanForm({ ...newPlanForm, weeks_duration: parseInt(e.target.value) || 12 })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-400 mb-1">Company / Organization</label>
                                    <input
                                        type="text"
                                        value={newPlanForm.company_name}
                                        onChange={(e) => setNewPlanForm({ ...newPlanForm, company_name: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1">Project Owner</label>
                                    <input
                                        type="text"
                                        value={newPlanForm.project_owner}
                                        onChange={(e) => setNewPlanForm({ ...newPlanForm, project_owner: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1">Description / Guidance</label>
                                <textarea
                                    rows="3"
                                    value={newPlanForm.description}
                                    onChange={(e) => setNewPlanForm({ ...newPlanForm, description: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-emerald-500 outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowNewPlanModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5"
                                >
                                    {actionLoading ? 'Creating...' : 'Create Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal 2: Add / Edit Task Modal */}
            {showNewTaskModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Edit2 className="w-5 h-5 text-emerald-400" />
                                {editingTask ? 'Edit Task Row' : 'Insert Task Row'}
                            </h3>
                            <button onClick={() => setShowNewTaskModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
                        </div>

                        <form onSubmit={handleSaveTask} className="space-y-4 text-xs font-mono">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-slate-400 mb-1">Phase</label>
                                    <select
                                        value={taskForm.phase}
                                        onChange={(e) => setTaskForm({ ...taskForm, phase: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-emerald-500 outline-none"
                                    >
                                        <option value="Project setup kick-off">Project setup kick-off</option>
                                        <option value="Implementation phase">Implementation phase</option>
                                        <option value="Audit readiness phase">Audit readiness phase</option>
                                        <option value="Audit phase">Audit phase</option>
                                        <option value="Maintenance phase">Maintenance phase</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1">Prefix (e.g. 1.1)</label>
                                    <input
                                        type="text"
                                        value={taskForm.prefix}
                                        onChange={(e) => setTaskForm({ ...taskForm, prefix: e.target.value })}
                                        placeholder="1.1"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1">Task Title</label>
                                <input
                                    type="text"
                                    required
                                    value={taskForm.title}
                                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                    placeholder="e.g. Complete Risk Assessment"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-emerald-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1">Details & Guidance</label>
                                <textarea
                                    rows="3"
                                    value={taskForm.details}
                                    onChange={(e) => setTaskForm({ ...taskForm, details: e.target.value })}
                                    placeholder="Explanation of how to work on this task..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-emerald-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1">Comments / Notes</label>
                                <input
                                    type="text"
                                    value={taskForm.comments}
                                    onChange={(e) => setTaskForm({ ...taskForm, comments: e.target.value })}
                                    placeholder="e.g. Clause 6.1.2 compliance"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-emerald-500 outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowNewTaskModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5"
                                >
                                    {actionLoading ? 'Saving...' : 'Save Row'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal 3: Assign Students / Users Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-emerald-400" />
                                <h3 className="text-base font-bold text-white">Assign Users to Project Plan</h3>
                            </div>
                            <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
                        </div>

                        <p className="text-xs text-slate-400 font-mono">
                            Select users from the list or dropdown to assign them to this project plan:
                        </p>

                        {/* Search Bar Input */}
                        <div className="relative font-mono">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                            <input
                                type="text"
                                value={userSearchTerm}
                                onChange={(e) => setUserSearchTerm(e.target.value)}
                                placeholder="Search user by name or email..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
                            />
                        </div>

                        {/* Dropdown Select Menu */}
                        <div className="font-mono text-xs">
                            <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Select User from Dropdown</label>
                            <select
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (val && !selectedUserIds.includes(val)) {
                                        setSelectedUserIds([...selectedUserIds, val]);
                                    }
                                }}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
                            >
                                <option value="">-- Choose user to add to assignment --</option>
                                {allUsers.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} ({u.email}) {selectedUserIds.includes(u.id) ? '✓ Assigned' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filtered User Checkbox List */}
                        <div className="max-h-56 overflow-y-auto space-y-2 font-mono text-xs pr-1 divide-y divide-slate-800/40">
                            {allUsers.filter(u =>
                                u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                                u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
                            ).length === 0 ? (
                                <div className="p-4 text-center text-slate-500 text-xs font-mono">
                                    No users found matching "{userSearchTerm}".
                                </div>
                            ) : (
                                allUsers.filter(u =>
                                    u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                                    u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
                                ).map((u) => {
                                    const isSelected = selectedUserIds.includes(u.id);
                                    return (
                                        <label
                                            key={u.id}
                                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                                                isSelected
                                                    ? 'bg-emerald-950/40 border-emerald-800 text-white'
                                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-100 block">{u.name}</span>
                                                    <span className="text-[10px] bg-slate-900 border border-slate-800 text-cyan-400 px-1.5 py-0.5 rounded capitalize">
                                                        {u.role}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-slate-500 block">{u.email}</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedUserIds([...selectedUserIds, u.id]);
                                                    } else {
                                                        setSelectedUserIds(selectedUserIds.filter((id) => id !== u.id));
                                                    }
                                                }}
                                                className="w-4 h-4 accent-emerald-500 rounded"
                                            />
                                        </label>
                                    );
                                })
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                            <span className="text-xs font-mono text-emerald-400 font-bold">
                                {selectedUserIds.length} Users Selected
                            </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAssignModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAssignUsers}
                                    disabled={actionLoading}
                                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5"
                                >
                                    {actionLoading ? 'Saving...' : 'Save Assignments'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

