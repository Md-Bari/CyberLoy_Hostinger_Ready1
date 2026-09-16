import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
    CheckSquare, ShieldCheck, Clock, CheckCircle2, AlertCircle,
    RefreshCw, Layers, ArrowLeft, Sliders, ChevronDown, Check, Sparkles, Table, Info
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentTasksPage() {
    const [plans, setPlans] = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [planData, setPlanData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [savingTaskId, setSavingTaskId] = useState(null);

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        setLoading(true);
        try {
            const res = await api.getStudentProjectPlans();
            setPlans(res.plans || []);
            if (res.plans && res.plans.length > 0) {
                const defaultId = res.plans[0].id;
                setSelectedPlanId(defaultId);
                loadPlanDetails(defaultId);
            }
        } catch (err) {
            setError(err.message || 'Failed to load project plans');
        } finally {
            setLoading(false);
        }
    };

    const loadPlanDetails = async (planId) => {
        try {
            const res = await api.getStudentProjectPlanDetails(planId);
            setPlanData(res);
        } catch (err) {
            console.error('Failed to load project plan details:', err);
        }
    };

    const handleSelectPlan = (id) => {
        setSelectedPlanId(id);
        loadPlanDetails(id);
    };

    const handleUpdateTaskProgress = async (taskId, newPct, comments = '') => {
        if (!selectedPlanId) return;
        setSavingTaskId(taskId);
        try {
            await api.updateTaskProgress(selectedPlanId, taskId, {
                progress_percentage: newPct,
                user_comments: comments,
            });
            loadPlanDetails(selectedPlanId);
        } catch (err) {
            console.error('Failed to update task progress:', err);
        } finally {
            setSavingTaskId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 bg-[#f4f7fb] text-slate-500">
                <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-emerald-600 animate-spin" />
                <p className="text-xs font-semibold">Loading Assigned Project Spreadsheet...</p>
            </div>
        );
    }

    if (plans.length === 0) {
        return (
            <div className="max-w-xl mx-auto my-20 p-8 bg-white border border-slate-200/80 rounded-2xl text-center space-y-4 shadow-sm">
                <Table className="w-12 h-12 text-slate-400 mx-auto" />
                <h2 className="text-xl font-bold text-[#0f172a]">No Project Plans Assigned</h2>
                <p className="text-xs text-slate-500">You currently have no compliance or operational project plans assigned by your organization lead.</p>
                <div className="pt-2">
                    <Link
                        to="/courses"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs shadow-sm transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Go to My Courses</span>
                    </Link>
                </div>
            </div>
        );
    }

    const currentPlan = planData?.plan;
    const phases = planData?.phases || [];
    const overallProgress = planData?.overall_progress || 0;
    const completedTasks = planData?.completed_tasks || 0;
    const totalTasks = planData?.total_tasks || 0;

    return (
        <div className="min-h-screen bg-[#f4f7fb] text-slate-800 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
            {/* Top Toolbar Banner (White Card) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
                                <Table className="w-3 h-3" /> Excel Project Spreadsheet Mode
                            </span>
                            {currentPlan?.standard && (
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold">
                                    {currentPlan.standard}
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight flex items-center gap-2">
                            <ShieldCheck className="w-7 h-7 text-emerald-600" />
                            {currentPlan?.title || 'ISO 27001 Project Plan'}
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
                            Pro tip ➜ Update your task progress percentage directly in the interactive spreadsheet grid below.
                        </p>
                    </div>

                    {/* Overall Progress Summary Widget (Clean White Card) */}
                    <div className="bg-[#f8fafc] p-4 rounded-xl border border-slate-200/80 shrink-0 space-y-2 min-w-[240px]">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-semibold">Project Progression</span>
                            <span className="text-emerald-700 font-extrabold text-sm">{overallProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                            <div
                                className="h-full bg-emerald-600 transition-all duration-500 rounded-full"
                                style={{ width: `${overallProgress}%` }}
                            />
                        </div>
                        <div className="text-[11px] text-slate-400 text-right">
                            {completedTasks} of {totalTasks} tasks completed
                        </div>
                    </div>
                </div>

                {/* Metadata Row (Clean White Small Cards) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs pt-3 border-t border-slate-100">
                    <div className="bg-[#f8fafc] p-3 rounded-xl border border-slate-200/80">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">STANDARD</span>
                        <span className="text-emerald-700 font-bold text-sm">{currentPlan?.standard || 'ISO 27001'}</span>
                    </div>
                    <div className="bg-[#f8fafc] p-3 rounded-xl border border-slate-200/80">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">COMPANY NAME</span>
                        <span className="text-[#0f172a] font-bold text-sm truncate block">{currentPlan?.company_name || 'CyberLoy'}</span>
                    </div>
                    <div className="bg-[#f8fafc] p-3 rounded-xl border border-slate-200/80">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">PROJECT OWNER</span>
                        <span className="text-[#0f172a] font-bold text-sm truncate block">{currentPlan?.project_owner || 'CISO'}</span>
                    </div>
                    <div className="bg-[#f8fafc] p-3 rounded-xl border border-slate-200/80">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">DURATION</span>
                        <span className="text-[#0f172a] font-bold text-sm">{currentPlan?.weeks_duration || 12} Weeks</span>
                    </div>
                    <div className="bg-[#f8fafc] p-3 rounded-xl border border-slate-200/80">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">MY COMPLETED TASKS</span>
                        <span className="text-blue-600 font-bold text-sm">{completedTasks} / {totalTasks}</span>
                    </div>
                    <div className="bg-[#f8fafc] p-3 rounded-xl border border-slate-200/80">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">MY OVERALL STATUS</span>
                        <span className="text-emerald-700 font-bold text-sm flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {overallProgress >= 100 ? 'Certified 100%' : 'In Implementation'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Plan Selector Tabs */}
            {plans.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {plans.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => handleSelectPlan(p.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 whitespace-nowrap shadow-sm ${
                                selectedPlanId === p.id
                                    ? 'bg-[#0f172a] text-white'
                                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
                            }`}
                        >
                            <Table className="w-3.5 h-3.5 text-blue-500" />
                            <span>{p.title}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                selectedPlanId === p.id ? 'bg-slate-800 text-cyan-400' : 'bg-slate-100 text-slate-600'
                            }`}>
                                {p.user_overall_progress || 0}%
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Authentic Excel Spreadsheet Data Table (White Card) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs text-slate-700">
                        {/* Excel Table Column Headers */}
                        <thead>
                            <tr className="bg-[#f8fafc] text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200">
                                <th className="py-3.5 px-4 w-24 border-r border-slate-200">Prefix</th>
                                <th className="py-3.5 px-4 w-64 border-r border-slate-200">Tasks</th>
                                <th className="py-3.5 px-4 border-r border-slate-200">Details & Guidance</th>
                                <th className="py-3.5 px-4 w-56 border-r border-slate-200 text-center">
                                    Progress (per task)
                                </th>
                                <th className="py-3.5 px-4 w-28 border-r border-slate-200 text-center">
                                    Progress (phase)
                                </th>
                                <th className="py-3.5 px-4 w-64">Comments & Notes</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 font-sans">
                            {phases.map((phase, phaseIdx) => (
                                <React.Fragment key={phase.phase_name}>
                                    {/* Phase Header Row */}
                                    <tr className="bg-emerald-50/70 text-emerald-900 font-bold text-xs border-y border-emerald-100">
                                        <td colSpan="4" className="py-2.5 px-4">
                                            <div className="flex items-center gap-2">
                                                <Layers className="w-4 h-4 text-emerald-600" />
                                                <span>PHASE {phaseIdx + 1}: {phase.phase_name.toUpperCase()}</span>
                                            </div>
                                        </td>
                                        <td className="py-2.5 px-4 text-center border-r border-slate-100">
                                            <span className="text-[10px] bg-white text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold shadow-xs">
                                                {phase.phase_progress_percentage}% Phase
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                                            {phase.completed_tasks} of {phase.total_tasks} phase tasks completed
                                        </td>
                                    </tr>

                                    {/* Task Rows */}
                                    {phase.tasks.map((task) => {
                                        const isDone = task.user_progress_percentage >= 100;
                                        return (
                                            <tr
                                                key={task.id}
                                                className={`transition group border-b border-slate-100 ${
                                                    isDone ? 'bg-emerald-50/30' : 'hover:bg-slate-50/80'
                                                }`}
                                            >
                                                {/* Prefix */}
                                                <td className="py-3.5 px-4 font-bold text-emerald-700 border-r border-slate-100">
                                                    {task.prefix || `${phaseIdx + 1}.${task.id}`}
                                                </td>

                                                {/* Tasks */}
                                                <td className="py-3.5 px-4 font-semibold text-[#0f172a] border-r border-slate-100">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span>{task.title}</span>
                                                        {isDone && (
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Details */}
                                                <td className="py-3.5 px-4 text-slate-600 text-[11px] leading-relaxed border-r border-slate-100">
                                                    {task.details || <span className="text-slate-400 italic">-</span>}
                                                </td>

                                                {/* Progress (per task) Manual Entry Text Box Cell */}
                                                <td className="py-3.5 px-4 border-r border-slate-100 bg-[#f8fafc]/50">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                defaultValue={task.user_progress_percentage}
                                                                key={task.user_progress_percentage}
                                                                onBlur={(e) => {
                                                                    const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                                                    handleUpdateTaskProgress(task.id, val, task.user_comments);
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                                                        handleUpdateTaskProgress(task.id, val, task.user_comments);
                                                                    }
                                                                }}
                                                                className="w-16 bg-white border border-slate-200 rounded-lg py-1 px-2 text-center text-xs font-bold text-emerald-700 focus:border-emerald-500 outline-none shadow-sm"
                                                            />
                                                            <span className="text-slate-400 text-xs font-bold">%</span>
                                                        </div>

                                                        <button
                                                            onClick={() => handleUpdateTaskProgress(task.id, isDone ? 0 : 100, task.user_comments)}
                                                            disabled={savingTaskId === task.id}
                                                            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition shadow-xs ${
                                                                isDone
                                                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                                                            }`}
                                                        >
                                                            {isDone ? '✓ 100%' : 'Set 100%'}
                                                        </button>
                                                    </div>
                                                </td>

                                                {/* Progress (phase) */}
                                                <td className="py-3.5 px-4 border-r border-slate-100 text-center text-[11px] text-slate-500 font-semibold">
                                                    {phase.phase_progress_percentage}%
                                                </td>

                                                {/* Comments / Notes */}
                                                <td className="py-3.5 px-4">
                                                    <input
                                                        type="text"
                                                        defaultValue={task.user_comments || task.comments || ''}
                                                        onBlur={(e) => handleUpdateTaskProgress(task.id, task.user_progress_percentage, e.target.value)}
                                                        placeholder="Click to add note/comment..."
                                                        className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-amber-800 placeholder-slate-400 focus:border-emerald-500 outline-none shadow-sm"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
