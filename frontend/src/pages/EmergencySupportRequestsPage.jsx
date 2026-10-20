import React, { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    LoaderCircle,
    Mail,
    Phone,
    RefreshCw,
    Search,
    ShieldAlert,
} from 'lucide-react';
import { api } from '../lib/api';

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
];

const statusStyles = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
};

export default function EmergencySupportRequestsPage() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [error, setError] = useState('');

    const loadTickets = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError('');

        try {
            const data = await api.getEmergencySupportTickets();
            setTickets(Array.isArray(data) ? data : []);
        } catch (requestError) {
            setTickets([]);
            setError(requestError.message || 'Unable to load emergency support requests.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadTickets();
    }, []);

    const filteredTickets = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        return tickets.filter((ticket) => {
            const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
            const matchesSearch = !query || [ticket.name, ticket.email, ticket.contact, ticket.description, String(ticket.id)]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(query));
            return matchesStatus && matchesSearch;
        });
    }, [tickets, searchTerm, statusFilter]);

    const counts = useMemo(() => ({
        total: tickets.length,
        pending: tickets.filter((ticket) => ticket.status === 'pending').length,
        in_progress: tickets.filter((ticket) => ticket.status === 'in_progress').length,
        resolved: tickets.filter((ticket) => ticket.status === 'resolved').length,
    }), [tickets]);

    const updateStatus = async (ticket, status) => {
        if (ticket.status === status) return;
        setUpdatingId(ticket.id);
        setError('');
        try {
            const response = await api.updateEmergencySupportStatus(ticket.id, status);
            const updatedTicket = response.ticket || { ...ticket, status };
            setTickets((current) => current.map((item) => item.id === ticket.id ? updatedTicket : item));
        } catch (requestError) {
            setError(requestError.message || 'Unable to update the request status.');
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#f4f7fb] p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1600px] space-y-6">
                <section
                    className="rounded-2xl border border-rose-800/60 p-6 text-white shadow-sm sm:p-7"
                    style={{ backgroundImage: 'linear-gradient(to right, #4c0519, #020617)' }}
                >
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                        <div className="flex gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-300 ring-1 ring-rose-300/30">
                                <ShieldAlert className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-300">24/7 incident response</p>
                                <h1 className="mt-1 text-xl font-bold sm:text-2xl">Emergency Support Requests</h1>
                                <p className="mt-1 text-xs text-slate-300">Every incident request submitted by users is shown here, newest first.</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => loadTickets(true)}
                            disabled={refreshing || loading}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh requests
                        </button>
                    </div>
                </section>

                <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                        ['All requests', counts.total, 'text-slate-700'],
                        ['Pending', counts.pending, 'text-amber-700'],
                        ['In progress', counts.in_progress, 'text-blue-700'],
                        ['Resolved', counts.resolved, 'text-emerald-700'],
                    ].map(([label, count, color]) => (
                        <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
                            <p className={`mt-1 text-2xl font-extrabold ${color}`}>{count}</p>
                        </div>
                    ))}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                        <div className="relative w-full sm:max-w-md">
                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Search request, name, email, or ticket ID..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-xs text-slate-800 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-rose-400"
                        >
                            <option value="all">All statuses</option>
                            {STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                        </select>
                    </div>

                    {error && (
                        <div className="mx-4 mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 sm:mx-5">
                            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
                            <LoaderCircle className="h-5 w-5 animate-spin text-rose-500" /> Loading requests...
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
                            <CheckCircle2 className="h-9 w-9 text-emerald-400" />
                            <p className="mt-3 text-sm font-bold text-slate-700">No support requests found</p>
                            <p className="mt-1 text-xs text-slate-500">{tickets.length ? 'Try a different search or status filter.' : 'New emergency reports will appear here.'}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredTickets.map((ticket) => (
                                <article key={ticket.id} className="p-4 transition hover:bg-slate-50 sm:p-5">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-mono text-xs font-bold text-slate-400">#{ticket.id}</span>
                                                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusStyles[ticket.status] || statusStyles.pending}`}>
                                                    {(ticket.status || 'pending').replace('_', ' ')}
                                                </span>
                                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500"><Clock3 className="h-3.5 w-3.5" />{formatDate(ticket.created_at)}</span>
                                            </div>
                                            <h2 className="mt-3 text-sm font-bold text-slate-900">{ticket.name}</h2>
                                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                                                <a className="inline-flex items-center gap-1 hover:text-blue-700" href={`mailto:${ticket.email}`}><Mail className="h-3.5 w-3.5" />{ticket.email}</a>
                                                <a className="inline-flex items-center gap-1 hover:text-blue-700" href={`tel:${ticket.contact}`}><Phone className="h-3.5 w-3.5" />{ticket.contact}</a>
                                            </div>
                                            <p className="mt-3 whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs leading-5 text-slate-700">{ticket.description}</p>
                                        </div>
                                        <div className="w-full shrink-0 lg:w-40">
                                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Request status</label>
                                            <select
                                                value={ticket.status || 'pending'}
                                                disabled={updatingId === ticket.id}
                                                onChange={(event) => updateStatus(ticket, event.target.value)}
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 outline-none transition focus:border-rose-400 disabled:cursor-wait disabled:opacity-60"
                                            >
                                                {STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
