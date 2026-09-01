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
            <div className="min-h-[70vh] flex items-center justify-center text-emerald-400 font-mono text-sm">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading Assigned Excel Project Spreadsheet...
            </div>
        );
    }

    if (plans.length === 0) {
        return (
            <div className="max-w-xl mx-auto my-20 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
                <Table className="w-12 h-12 text-slate-600 mx-auto" />
                <h2 className="text-xl font-bold text-white">No Project Plans Assigned</h2>
                <p className="text-sm text-slate-400">You currently have no compliance or operational project plans assigned by your organization lead.</p>
                <div className="pt-2">
                    <Link
                        to="/courses"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
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
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
            {/* Top Toolbar Banner */}
            <div className="bg-slate-900 border border-emerald-900/60 rounded-2xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                                <Table className="w-3 h-3" /> Excel Project Spreadsheet Mode
                            </span>
                            {currentPlan?.standard && (
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800 text-[10px] font-mono">
                                    {currentPlan.standard}
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                            <ShieldCheck className="w-7 h-7 text-emerald-400" />
                            {currentPlan?.title || 'ISO 27001 Project Plan'}
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
                            Pro tip ➜ Update your task progress percentage directly in the interactive spreadsheet grid below.
                        </p>
                    </div>

                    {/* Overall Progress Summary Widget */}
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 shrink-0 space-y-2 min-w-[240px]">
                        <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-400">Project Progression</span>
                            <span className="text-emerald-400 font-bold text-sm">{overallProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                            <div
                                className={`h-full transition-all duration-500 ${
                                    overallProgress >= 100 ? 'bg-emerald-400' : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                                }`}
                                style={{ width: `${overallProgress}%` }}
                            />
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono text-right">
                            {completedTasks} of {totalTasks} tasks completed
                        </div>
                    </div>
                </div>

                {/* Metadata Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs font-mono pt-2 border-t border-slate-800/80">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">STANDARD</span>
                        <span className="text-emerald-400 font-bold">{currentPlan?.standard || 'ISO 27001'}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">COMPANY NAME</span>
                        <span className="text-white font-bold truncate block">{currentPlan?.company_name || 'CyberLoy'}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">PROJECT OWNER</span>
                        <span className="text-white font-bold truncate block">{currentPlan?.project_owner || 'CISO'}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">DURATION</span>
                        <span className="text-white font-bold">{currentPlan?.weeks_duration || 12} Weeks</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">MY COMPLETED TASKS</span>
                        <span className="text-cyan-400 font-bold">{completedTasks} / {totalTasks}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">MY OVERALL STATUS</span>
                        <span className="text-emerald-400 font-bold">
                            {overallProgress >= 100 ? '✓ Certified 100%' : 'In Implementation'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Plan Selector Tabs */}
            {plans.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
                    {plans.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => handleSelectPlan(p.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 whitespace-nowrap ${
                                selectedPlanId === p.id
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40'
                                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                            }`}
                        >
                            <Table className="w-3.5 h-3.5" />
                            <span>{p.title}</span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-950 text-[10px] text-slate-400">
                                {p.user_overall_progress || 0}%
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Authentic Excel Spreadsheet Data Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-sans text-xs">
                        {/* Excel Table Column Headers */}
                        <thead>
                            <tr className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                                <th className="py-3.5 px-4 w-24 border-r border-slate-800">Prefix</th>
                                <th className="py-3.5 px-4 w-64 border-r border-slate-800">Tasks</th>
                                <th className="py-3.5 px-4 border-r border-slate-800">Details & Guidance</th>
                                <th className="py-3.5 px-4 w-56 border-r border-slate-800 text-center">
                                    Progress (per task)
                                </th>
                                <th className="py-3.5 px-4 w-28 border-r border-slate-800 text-center">
                                    Progress (phase)
                                </th>
                                <th className="py-3.5 px-4 w-64">Comments & Notes</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-800/80 font-sans">
                            {phases.map((phase, phaseIdx) => (
                                <React.Fragment key={phase.phase_name}>
                                    {/* Phase Header Row (Excel Header Banner Style) */}
                                    <tr className="bg-emerald-950/50 text-emerald-300 font-mono font-bold text-xs border-y border-emerald-900/80">
                                        <td colSpan="4" className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <Layers className="w-4 h-4 text-emerald-400" />
                                                <span>PHASE {phaseIdx + 1}: {phase.phase_name.toUpperCase()}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center border-r border-slate-800/80">
                                            <span className="text-[11px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded font-bold">
                                                {phase.phase_progress_percentage}% Phase
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-400 text-[10px]">
                                            {phase.completed_tasks} of {phase.total_tasks} phase tasks completed
                                        </td>
                                    </tr>

                                    {/* Task Rows */}
                                    {phase.tasks.map((task) => {
                                        const isDone = task.user_progress_percentage >= 100;
                                        return (
                                            <tr
                                                key={task.id}
                                                className={`transition group border-b border-slate-800/60 ${
                                                    isDone ? 'bg-emerald-950/15' : 'hover:bg-slate-800/40'
                                                }`}
                                            >
                                                {/* Prefix */}
                                                <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 border-r border-slate-800/80">
                                                    {task.prefix || `${phaseIdx + 1}.${task.id}`}
                                                </td>

                                                {/* Tasks */}
                                                <td className="py-3.5 px-4 font-semibold text-slate-100 border-r border-slate-800/80">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span>{task.title}</span>
                                                        {isDone && (
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Details */}
                                                <td className="py-3.5 px-4 text-slate-300 text-[11px] leading-relaxed border-r border-slate-800/80">
                                                    {task.details || <span className="text-slate-600 italic">-</span>}
                                                </td>

                                                {/* Progress (per task) Manual Entry Text Box Cell */}
                                                <td className="py-3.5 px-4 border-r border-slate-800/80 bg-slate-950/40">
                                                    <div className="flex items-center justify-between gap-2 font-mono">
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
                                                                className="w-16 bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-center text-xs font-bold text-emerald-400 focus:border-emerald-500 outline-none"
                                                            />
                                                            <span className="text-slate-400 text-xs font-bold">%</span>
                                                        </div>

                                                        <button
                                                            onClick={() => handleUpdateTaskProgress(task.id, isDone ? 0 : 100, task.user_comments)}
                                                            disabled={savingTaskId === task.id}
                                                            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-semibold transition ${
                                                                isDone
                                                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                                                            }`}
                                                        >
                                                            {isDone ? '✓ 100%' : 'Set 100%'}
                                                        </button>
                                                    </div>
                                                </td>


                                                {/* Progress (phase) */}
                                                <td className="py-3.5 px-4 border-r border-slate-800/80 text-center font-mono text-[11px] text-slate-400">
                                                    {phase.phase_progress_percentage}%
                                                </td>

                                                {/* Comments / Notes */}
                                                <td className="py-3.5 px-4">
                                                    <input
                                                        type="text"
                                                        defaultValue={task.user_comments || task.comments || ''}
                                                        onBlur={(e) => handleUpdateTaskProgress(task.id, task.user_progress_percentage, e.target.value)}
                                                        placeholder="Click to add note/comment..."
                                                        className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-amber-300 font-mono focus:border-emerald-500 outline-none"
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
