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
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [matrixSearch, setMatrixSearch] = useState('');
    const [matrixPage, setMatrixPage] = useState(1);
    const [matrixPerPage, setMatrixPerPage] = useState(4);

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
            setSuccessMsg('Project plan created successfully!');
            setShowNewPlanModal(false);
            await loadPlans();
            if (res.plan) {
                setSelectedPlanId(res.plan.id);
                loadPlanDetails(res.plan.id);
            }
        } catch (err) {
            alert(err.message || 'Failed to create plan');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveTask = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            if (editingTask) {
                await api.updateProjectTask(editingTask.id, taskForm);
                setSuccessMsg('Task row updated successfully!');
            } else {
                await api.addProjectTask(selectedPlanId, taskForm);
                setSuccessMsg('New task row inserted!');
            }
            setShowNewTaskModal(false);
            setEditingTask(null);
            loadPlanDetails(selectedPlanId);
        } catch (err) {
            alert(err.message || 'Failed to save task');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Delete this task row from the plan?')) return;
        try {
            await api.deleteProjectTask(taskId);
            setSuccessMsg('Task row deleted.');
            loadPlanDetails(selectedPlanId);
        } catch (err) {
            alert(err.message || 'Failed to delete task');
        }
    };

    const handleAssignUsers = async () => {
        setActionLoading(true);
        try {
            await api.assignUsersToProjectPlan(selectedPlanId, selectedUserIds);
            setSuccessMsg('Student assignments updated successfully!');
            setShowAssignModal(false);
            loadPlanDetails(selectedPlanId);
        } catch (err) {
            alert(err.message || 'Failed to update assignments');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAdminUpdateUserProgress = async (userId, taskId, progressVal) => {
        try {
            await api.adminUpdateUserTaskProgress(selectedPlanId, userId, {
                task_id: taskId,
                progress_percentage: progressVal,
            });
            loadPlanDetails(selectedPlanId);
        } catch (err) {
            console.error('Failed to update student progress:', err);
        }
    };

    if (loading && plans.length === 0) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 bg-[#f4f7fb] text-slate-500">
                <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-cyan-600 animate-spin" />
                <p className="text-xs font-semibold">Loading ISO 27001 Task Builder...</p>
            </div>
        );
    }

    const currentPlan = planData?.plan;
    const tasks = planData?.tasks || [];
    const userSummaries = planData?.user_summaries || [];

    const filteredUserSummaries = userSummaries.filter((s) => {
        if (!matrixSearch.trim()) return true;
        const q = matrixSearch.toLowerCase();
        return s.user.name?.toLowerCase().includes(q) || s.user.email?.toLowerCase().includes(q);
    });

    const totalMatrixPages = Math.ceil(filteredUserSummaries.length / matrixPerPage) || 1;
    const paginatedUserSummaries = filteredUserSummaries.slice(
        (matrixPage - 1) * matrixPerPage,
        matrixPage * matrixPerPage
    );

    // Group tasks by phase for structured spreadsheet sections
    const groupedPhases = tasks.reduce((acc, task) => {
        const phase = task.phase || 'General Phase';
        if (!acc[phase]) acc[phase] = [];
        acc[phase].push(task);
        return acc;
    }, {});

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto bg-[#f4f7fb] text-slate-800 min-h-screen">
            {/* Top Page Header Card */}
            <div className="rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Link to="/admin" className="text-slate-500 hover:text-blue-600 transition text-xs font-semibold flex items-center gap-1">
                                <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin
                            </Link>
                            <span className="text-slate-300">•</span>
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold flex items-center gap-1">
                                <Table className="w-3 h-3" /> Excel Spreadsheet Mode
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight flex items-center gap-2.5">
                            <ShieldCheck className="w-7 h-7 text-blue-600" />
                            <span>ISO 27001 Project Plan Task Builder</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                            Structured compliance guidance, assignable implementation tasks, and progress matrices mirroring ISO 27001 standards.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={() => setShowNewPlanModal(true)}
                            className="px-4 py-2.5 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
                        >
                            <Plus className="w-4 h-4 text-cyan-400" />
                            <span>Create New Plan</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Notification Messages */}
            {successMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
                    <span>{successMsg}</span>
                    <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
                </div>
            )}

            {/* Excel Sheet Selector & View Mode Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto">
                    {plans.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => handleSelectPlan(p.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-sm ${
                                selectedPlanId === p.id
                                    ? 'bg-[#0f172a] text-white'
                                    : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/80'
                            }`}
                        >
                            <Table className="w-3.5 h-3.5 text-blue-500" />
                            <span>{p.title}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                selectedPlanId === p.id ? 'bg-slate-800 text-cyan-400' : 'bg-slate-100 text-slate-600'
                            }`}>
                                {p.tasks_count || 0} rows
                            </span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm shrink-0">
                    <button
                        onClick={() => setActiveTab('sheet')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                            activeTab === 'sheet' ? 'bg-[#0f172a] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        <Table className="w-3.5 h-3.5" /> Spreadsheet View
                    </button>
                    <button
                        onClick={() => setActiveTab('matrix')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                            activeTab === 'matrix' ? 'bg-[#0f172a] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        <Users className="w-3.5 h-3.5" /> Student Progress Matrix
                    </button>
                </div>
            </div>

            {currentPlan && (
                <div className="space-y-6">
                    {/* Excel Header Information Box (Matching ISO 27001 Spreadsheet Metadata Header) */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-[#0f172a] tracking-tight">{currentPlan.title}</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Pro tip ➜ Update task status every week. Guidance & columns mirror ISO 27001 standards.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowAssignModal(true)}
                                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 shadow-sm transition"
                                >
                                    <Users className="w-4 h-4 text-blue-600" />
                                    <span>Assigned Students ({currentPlan.assigned_users?.length || 0})</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingTask(null);
                                        setTaskForm({ phase: 'Implementation phase', prefix: '', title: '', details: '', comments: '' });
                                        setShowNewTaskModal(true);
                                    }}
                                    className="px-3.5 py-2 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                                >
                                    <Plus className="w-4 h-4 text-cyan-400" />
                                    <span>Insert Row</span>
                                </button>
                            </div>
                        </div>

                        {/* Excel Header Metadata Grid (Clean White Small Cards) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
                            <div className="bg-[#f8fafc] p-3 rounded-xl border border-slate-200/80">
                                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">STANDARD</span>
                                <span className="text-blue-700 font-bold text-sm">{currentPlan.standard}</span>
                            </div>
                            <div className="bg-[#f8fafc] p-3 rounded-xl border border-slate-200/80">
                                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">COMPANY NAME</span>
                                <span className="text-[#0f172a] font-bold text-sm truncate block">{currentPlan.company_name || 'CyberLoy'}</span>
                            </div>
                            <div className="bg-[#f8fafc] p-3 rounded-xl border border-slate-200/80">
                                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">PROJECT OWNER</span>
                                <span className="text-[#0f172a] font-bold text-sm truncate block">{currentPlan.project_owner || 'CISO'}</span>
                            </div>
                            <div className="bg-[#f8fafc] p-3 rounded-xl border border-slate-200/80">
                                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">DURATION</span>
                                <span className="text-[#0f172a] font-bold text-sm">{currentPlan.weeks_duration} Weeks</span>
                            </div>
                            <div className="bg-[#f8fafc] p-3 rounded-xl border border-slate-200/80">
                                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">TOTAL ROWS</span>
                                <span className="text-blue-600 font-bold text-sm">{tasks.length} Tasks</span>
                            </div>
                            <div className="bg-[#f8fafc] p-3 rounded-xl border border-slate-200/80">
                                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">ASSIGNED USERS</span>
                                <span className="text-emerald-700 font-bold text-sm">{currentPlan.assigned_users?.length || 0} Users</span>
                            </div>
                            <div className="bg-[#f8fafc] p-3 rounded-xl border border-slate-200/80 col-span-2 sm:col-span-1">
                                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">STATUS</span>
                                <span className="text-emerald-700 font-bold text-sm flex items-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Active Sheet
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* View 1: Authentic Clean Excel Spreadsheet Data Grid */}
                    {activeTab === 'sheet' && (
                        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs text-slate-700">
                                    {/* Excel Table Column Headers */}
                                    <thead>
                                        <tr className="bg-[#f8fafc] text-slate-500 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200">
                                            <th className="py-3.5 px-4 w-12 text-center border-r border-slate-200">Row</th>
                                            <th className="py-3.5 px-4 w-28 border-r border-slate-200">Prefix</th>
                                            <th className="py-3.5 px-4 w-64 border-r border-slate-200">Tasks</th>
                                            <th className="py-3.5 px-4 border-r border-slate-200">Details & Guidance</th>
                                            <th className="py-3.5 px-4 w-44 border-r border-slate-200 text-center">Phase</th>
                                            <th className="py-3.5 px-4 w-56 border-r border-slate-200">Comments / Notes</th>
                                            <th className="py-3.5 px-4 w-24 text-center">Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {Object.entries(groupedPhases).map(([phaseName, phaseTasks], phaseIdx) => (
                                            <React.Fragment key={phaseName}>
                                                {/* Phase Group Header Row */}
                                                <tr className="bg-blue-50/60 text-blue-900 font-bold text-xs border-y border-blue-100">
                                                    <td colSpan="7" className="py-2.5 px-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Layers className="w-4 h-4 text-blue-600" />
                                                                <span>PHASE {phaseIdx + 1}: {phaseName.toUpperCase()}</span>
                                                            </div>
                                                            <span className="text-[10px] bg-white border border-blue-200 px-2 py-0.5 rounded-full text-blue-700 font-semibold shadow-xs">
                                                                {phaseTasks.length} Task Rows
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Task Rows in Phase */}
                                                {phaseTasks.map((t, index) => (
                                                    <tr key={t.id} className="hover:bg-slate-50/80 transition group border-b border-slate-100">
                                                        {/* Row # */}
                                                        <td className="py-3 px-4 text-center font-bold text-slate-400 border-r border-slate-100 bg-[#f8fafc]/50">
                                                            {t.sort_order || index + 1}
                                                        </td>

                                                        {/* Prefix */}
                                                        <td className="py-3 px-4 font-bold text-blue-600 border-r border-slate-100">
                                                            {t.prefix || `${phaseIdx + 1}.${index + 1}`}
                                                        </td>

                                                        {/* Task Title */}
                                                        <td className="py-3 px-4 font-bold text-[#0f172a] border-r border-slate-100">
                                                            {t.title}
                                                        </td>

                                                        {/* Details */}
                                                        <td className="py-3 px-4 text-slate-600 text-[11px] leading-relaxed border-r border-slate-100">
                                                            {t.details || <span className="text-slate-400 italic">No details provided</span>}
                                                        </td>

                                                        {/* Phase Name Tag */}
                                                        <td className="py-3 px-4 border-r border-slate-100 text-center">
                                                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200 inline-block truncate max-w-[140px]">
                                                                {t.phase}
                                                            </span>
                                                        </td>

                                                        {/* Comments */}
                                                        <td className="py-3 px-4 text-slate-600 text-[11px] border-r border-slate-100">
                                                            {t.comments ? (
                                                                <span className="font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                                                    💬 {t.comments}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-300">-</span>
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
                                                                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-sm transition"
                                                                    title="Edit Row"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteTask(t.id)}
                                                                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 shadow-sm transition"
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
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                                <div>
                                    <h3 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
                                        <Users className="w-5 h-5 text-blue-600" />
                                        <span>Student Task Completion Matrix</span>
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        View and manage task progress percentages for every assigned user.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="relative w-48 sm:w-64">
                                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={matrixSearch}
                                            onChange={(e) => {
                                                setMatrixSearch(e.target.value);
                                                setMatrixPage(1);
                                            }}
                                            placeholder="Search student..."
                                            className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setShowAssignModal(true)}
                                        className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200 hover:bg-blue-100 transition shadow-sm shrink-0"
                                    >
                                        Assign Students
                                    </button>
                                </div>
                            </div>

                            {userSummaries.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-xs">
                                    No students assigned to this project plan yet. Click "Assign Students" to allocate tasks.
                                </div>
                            ) : filteredUserSummaries.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-xs">
                                    No assigned students match "{matrixSearch}".
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {paginatedUserSummaries.map((summary) => (
                                        <div key={summary.user.id} className="bg-[#f8fafc] rounded-2xl p-5 border border-slate-200/80 space-y-4 shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-[#0f172a] text-white font-bold flex items-center justify-center text-xs shadow-sm">
                                                        {summary.user.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-[#0f172a]">{summary.user.name}</h4>
                                                        <span className="text-xs text-slate-500">{summary.user.email}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <span className="text-[11px] text-slate-500 font-semibold block">Overall Progress</span>
                                                        <span className="text-blue-600 font-extrabold text-base">{summary.overall_progress}%</span>
                                                    </div>
                                                    <div className="w-24 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                                                            style={{ width: `${summary.overall_progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* User Tasks Progress Table */}
                                            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                                                <table className="w-full text-left text-xs text-slate-700">
                                                    <thead>
                                                        <tr className="bg-[#f8fafc] text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                                                            <th className="p-3">Task</th>
                                                            <th className="p-3 w-36">Phase</th>
                                                            <th className="p-3 w-48 text-center">Set Progress %</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {tasks.map((t) => (
                                                            <tr key={t.id} className="hover:bg-slate-50">
                                                                <td className="p-3 font-medium text-[#0f172a]">
                                                                    <span className="text-blue-600 font-bold mr-1.5">{t.prefix}</span> {t.title}
                                                                </td>
                                                                <td className="p-3 text-slate-500 text-[11px]">{t.phase}</td>
                                                                <td className="p-3 text-center">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max="100"
                                                                        defaultValue="0"
                                                                        onBlur={(e) => handleAdminUpdateUserProgress(summary.user.id, t.id, parseInt(e.target.value) || 0)}
                                                                        className="w-20 bg-white border border-slate-200 rounded-lg p-1.5 text-center text-blue-600 font-bold outline-none shadow-sm focus:border-blue-500"
                                                                    />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Matrix Pagination Bar */}
                                    <div className="p-4 border-t border-slate-100 bg-[#f8fafc] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
                                        <div className="flex items-center gap-3">
                                            <span>
                                                Showing <span className="text-[#0f172a] font-bold">{(matrixPage - 1) * matrixPerPage + 1}</span> to{' '}
                                                <span className="text-[#0f172a] font-bold">{Math.min(matrixPage * matrixPerPage, filteredUserSummaries.length)}</span> of{' '}
                                                <span className="text-blue-600 font-bold">{filteredUserSummaries.length}</span> assigned students
                                            </span>
                                            <span className="text-slate-300">•</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-slate-500">Per page:</span>
                                                <select
                                                    value={matrixPerPage}
                                                    onChange={(e) => {
                                                        setMatrixPerPage(Number(e.target.value));
                                                        setMatrixPage(1);
                                                    }}
                                                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500 shadow-xs"
                                                >
                                                    <option value={2}>2</option>
                                                    <option value={4}>4</option>
                                                    <option value={8}>8</option>
                                                    <option value={15}>15</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                disabled={matrixPage === 1}
                                                onClick={() => setMatrixPage((p) => Math.max(1, p - 1))}
                                                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 disabled:opacity-40 text-xs font-semibold transition shadow-xs"
                                            >
                                                Previous
                                            </button>

                                            {Array.from({ length: totalMatrixPages }, (_, i) => i + 1).map((pg) => (
                                                <button
                                                    key={pg}
                                                    onClick={() => setMatrixPage(pg)}
                                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                                                        matrixPage === pg
                                                            ? 'bg-[#0f172a] text-white shadow-sm'
                                                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {pg}
                                                </button>
                                            ))}

                                            <button
                                                disabled={matrixPage === totalMatrixPages}
                                                onClick={() => setMatrixPage((p) => Math.min(totalMatrixPages, p + 1))}
                                                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 disabled:opacity-40 text-xs font-semibold transition shadow-xs"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Modal 1: Create New Plan Modal */}
            {showNewPlanModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
                                <Plus className="w-5 h-5 text-blue-600" /> Create New Project Plan
                            </h3>
                            <button onClick={() => setShowNewPlanModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                        </div>

                        <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">Project Plan Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newPlanForm.title}
                                    onChange={(e) => setNewPlanForm({ ...newPlanForm, title: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:border-blue-500 outline-none shadow-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Compliance Standard</label>
                                    <input
                                        type="text"
                                        value={newPlanForm.standard}
                                        onChange={(e) => setNewPlanForm({ ...newPlanForm, standard: e.target.value })}
                                        placeholder="e.g. ISO 27001, SOC 2"
                                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:border-blue-500 outline-none shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Duration (Weeks)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={newPlanForm.weeks_duration}
                                        onChange={(e) => setNewPlanForm({ ...newPlanForm, weeks_duration: parseInt(e.target.value) || 12 })}
                                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:border-blue-500 outline-none shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Company / Organization</label>
                                    <input
                                        type="text"
                                        value={newPlanForm.company_name}
                                        onChange={(e) => setNewPlanForm({ ...newPlanForm, company_name: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:border-blue-500 outline-none shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Project Owner</label>
                                    <input
                                        type="text"
                                        value={newPlanForm.project_owner}
                                        onChange={(e) => setNewPlanForm({ ...newPlanForm, project_owner: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:border-blue-500 outline-none shadow-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">Description / Guidance</label>
                                <textarea
                                    rows="3"
                                    value={newPlanForm.description}
                                    onChange={(e) => setNewPlanForm({ ...newPlanForm, description: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:border-blue-500 outline-none shadow-sm"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowNewPlanModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-4 py-2 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold flex items-center gap-1.5 shadow-sm"
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
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
                                <Edit2 className="w-5 h-5 text-blue-600" />
                                {editingTask ? 'Edit Task Row' : 'Insert Task Row'}
                            </h3>
                            <button onClick={() => setShowNewTaskModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                        </div>

                        <form onSubmit={handleSaveTask} className="space-y-4 text-xs">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-slate-700 font-semibold mb-1">Phase</label>
                                    <select
                                        value={taskForm.phase}
                                        onChange={(e) => setTaskForm({ ...taskForm, phase: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:border-blue-500 outline-none shadow-sm"
                                    >
                                        <option value="Project setup kick-off">Project setup kick-off</option>
                                        <option value="Implementation phase">Implementation phase</option>
                                        <option value="Audit readiness phase">Audit readiness phase</option>
                                        <option value="Audit phase">Audit phase</option>
                                        <option value="Maintenance phase">Maintenance phase</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-semibold mb-1">Prefix (e.g. 1.1)</label>
                                    <input
                                        type="text"
                                        value={taskForm.prefix}
                                        onChange={(e) => setTaskForm({ ...taskForm, prefix: e.target.value })}
                                        placeholder="1.1"
                                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:border-blue-500 outline-none shadow-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">Task Title</label>
                                <input
                                    type="text"
                                    required
                                    value={taskForm.title}
                                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                    placeholder="e.g. Complete Risk Assessment"
                                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:border-blue-500 outline-none shadow-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">Details & Guidance</label>
                                <textarea
                                    rows="3"
                                    value={taskForm.details}
                                    onChange={(e) => setTaskForm({ ...taskForm, details: e.target.value })}
                                    placeholder="Explanation of how to work on this task..."
                                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:border-blue-500 outline-none shadow-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 font-semibold mb-1">Comments / Notes</label>
                                <input
                                    type="text"
                                    value={taskForm.comments}
                                    onChange={(e) => setTaskForm({ ...taskForm, comments: e.target.value })}
                                    placeholder="e.g. Clause 6.1.2 compliance"
                                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-800 focus:border-blue-500 outline-none shadow-sm"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowNewTaskModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-4 py-2 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold flex items-center gap-1.5 shadow-sm"
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
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-600" />
                                <h3 className="text-base font-bold text-[#0f172a]">Assign Users to Project Plan</h3>
                            </div>
                            <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                        </div>

                        <p className="text-xs text-slate-500">
                            Select users to assign them to this project plan:
                        </p>

                        {/* Search Bar Input */}
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                            <input
                                type="text"
                                value={userSearchTerm}
                                onChange={(e) => setUserSearchTerm(e.target.value)}
                                placeholder="Search user by name or email..."
                                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 shadow-sm"
                            />
                        </div>

                        {/* Dropdown Select Menu */}
                        <div className="text-xs">
                            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Select User from Dropdown</label>
                            <select
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (val && !selectedUserIds.includes(val)) {
                                        setSelectedUserIds([...selectedUserIds, val]);
                                    }
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 shadow-sm"
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
                        <div className="max-h-56 overflow-y-auto space-y-2 text-xs pr-1 divide-y divide-slate-100">
                            {allUsers.filter(u =>
                                u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                                u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
                            ).length === 0 ? (
                                <div className="p-4 text-center text-slate-400 text-xs">
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
                                                    ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#0f172a] block">{u.name}</span>
                                                    <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded capitalize">
                                                        {u.role}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 block">{u.email}</span>
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
                                                className="w-4 h-4 accent-blue-600 rounded"
                                            />
                                        </label>
                                    );
                                })
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <span className="text-xs text-blue-700 font-bold">
                                {selectedUserIds.length} Users Selected
                            </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAssignModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAssignUsers}
                                    disabled={actionLoading}
                                    className="px-4 py-2 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
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
