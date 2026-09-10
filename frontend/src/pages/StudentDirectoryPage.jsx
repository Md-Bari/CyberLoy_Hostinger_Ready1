import React, { useState, useEffect } from 'react';
import {
    Search,
    Users,
    Plus,
    Eye,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    CheckCircle2,
    Play,
    X,
} from 'lucide-react';
import { api } from '../lib/api';

export default function StudentDirectoryPage() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', role: 'user' });
    const [creatingUser, setCreatingUser] = useState(false);
    const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [message, setMessage] = useState('');

    const usersPerPage = 5;

    useEffect(() => {
        loadStudentDirectory();
    }, []);

    const loadStudentDirectory = async () => {
        setLoading(true);
        try {
            const data = await api.getUserActivities();
            setActivities(data || []);
        } catch (error) {
            console.error('Failed to load student directory:', error);
            setActivities([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setCreatingUser(true);
        setMessage('');

        try {
            await api.createUser({
                name: newUserForm.name,
                email: newUserForm.email,
                password: newUserForm.password,
                role: newUserForm.role,
            });

            setMessage(`${newUserForm.role === 'admin' ? 'Admin' : 'User'} "${newUserForm.name}" created successfully.`);
            setNewUserForm({ name: '', email: '', password: '', role: 'user' });
            await loadStudentDirectory();
        } catch (error) {
            alert(error.message || 'Failed to create user');
        } finally {
            setCreatingUser(false);
        }
    };

    const handleViewStudentDetail = async (userId) => {
        setLoadingDetail(true);
        try {
            const res = await api.getStudentProgressDetail(userId);
            setSelectedStudentDetail(res);
        } catch (error) {
            alert('Failed to load student progress detail');
        } finally {
            setLoadingDetail(false);
        }
    };

    const filtered = activities.filter((u) =>
        u.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / usersPerPage) || 1;
    const startIndex = (currentPage - 1) * usersPerPage;
    const paginatedUsers = filtered.slice(startIndex, startIndex + usersPerPage);

    return (
        <div className="space-y-6 p-6 lg:p-8">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-cyan-400" /> Student Directory
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Search, filter, and review detailed progress profiles for registered learners.</p>
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by student name or email..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                        <h4 className="text-base font-bold text-white">Create New User</h4>
                        <p className="text-xs text-slate-400 mt-1">Create a student or admin account and assign login credentials in the LMS.</p>
                    </div>
                    <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-mono uppercase tracking-wider">
                        <Plus className="w-3.5 h-3.5" />
                        Admin-only action
                    </div>
                </div>

                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                    <div className="md:col-span-1">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
                        <input
                            type="text"
                            required
                            value={newUserForm.name}
                            onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                            placeholder="Jane Doe"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Email</label>
                        <input
                            type="email"
                            required
                            value={newUserForm.email}
                            onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                            placeholder="student@example.com"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
                        <input
                            type="text"
                            required
                            value={newUserForm.password}
                            onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                            placeholder="Temporary password"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Role</label>
                        <select
                            value={newUserForm.role}
                            onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <button
                            type="submit"
                            disabled={creatingUser}
                            className="w-full px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition disabled:opacity-50"
                        >
                            {creatingUser ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="p-12 text-center text-slate-500 text-xs font-mono">Loading directory...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 text-xs font-mono">
                        No users found matching "{searchTerm}".
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                                    <tr>
                                        <th className="p-4 w-16"># ID</th>
                                        <th className="p-4">Student Profile</th>
                                        <th className="p-4">Joined Date</th>
                                        <th className="p-4 text-center">Courses Enrolled</th>
                                        <th className="p-4 text-center">100% Finished</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/80 font-sans">
                                    {paginatedUsers.map((student) => {
                                        const finishedCount = student.courses?.filter(c => c.progress_percentage >= 100).length || 0;
                                        return (
                                            <tr key={student.user_id} className="hover:bg-slate-800/40 transition">
                                                <td className="p-4 font-mono text-slate-500 font-bold">#{student.user_id}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-bold flex items-center justify-center text-xs shadow">
                                                            {student.user_name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-white block">{student.user_name}</span>
                                                            <span className="text-[11px] text-cyan-400 font-mono block">{student.user_email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 font-mono text-slate-400 text-xs">{student.joined_at}</td>
                                                <td className="p-4 text-center font-mono font-bold text-slate-200">{student.courses?.length || 0} Courses</td>
                                                <td className="p-4 text-center font-mono">
                                                    {finishedCount > 0 ? (
                                                        <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-[10px]">
                                                            ✓ {finishedCount} Finished
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-500 text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={() => handleViewStudentDetail(student.user_id)}
                                                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white font-bold text-xs transition flex items-center gap-1.5 ml-auto border border-slate-700"
                                                    >
                                                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                                                        <span>{loadingDetail ? 'Loading...' : 'See Details'}</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
                            <span className="text-slate-400">
                                Showing <span className="text-white font-bold">{startIndex + 1}</span> to{' '}
                                <span className="text-white font-bold">{Math.min(startIndex + usersPerPage, filtered.length)}</span> of{' '}
                                <span className="text-cyan-400 font-bold">{filtered.length}</span> students
                            </span>

                            <div className="flex items-center gap-2">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:hover:bg-slate-800 text-xs font-bold transition flex items-center gap-1"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                                    <button
                                        key={pg}
                                        onClick={() => setCurrentPage(pg)}
                                        className={`w-8 h-8 rounded-xl font-bold transition ${
                                            currentPage === pg
                                                ? 'bg-cyan-500 text-slate-950 shadow-md'
                                                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                                        }`}
                                    >
                                        {pg}
                                    </button>
                                ))}

                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:hover:bg-slate-800 text-xs font-bold transition flex items-center gap-1"
                                >
                                    Next <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {message && (
                <div className="bg-emerald-950 border border-emerald-800 text-emerald-300 px-4 py-3 rounded-xl text-xs font-medium shadow-lg">
                    {message}
                </div>
            )}

            {selectedStudentDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
                    <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8">
                        <button
                            onClick={() => setSelectedStudentDetail(null)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="pb-4 border-b border-slate-800">
                            <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-800">
                                Student Watch Inspector
                            </span>
                            <h3 className="text-xl font-bold text-white mt-2">
                                {selectedStudentDetail.user?.name} ({selectedStudentDetail.user?.email})
                            </h3>
                        </div>

                        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
                            {selectedStudentDetail.courses?.map((c) => (
                                <div key={c.course_id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 flex-wrap gap-2">
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-bold text-white text-sm">{c.course_title}</h4>
                                            {(c.enrollment_status === 'completed' || c.sections?.every(s => s.completed_lessons > 0 && s.completed_lessons === s.total_lessons)) && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/80 font-mono text-xs font-bold shadow-lg shadow-emerald-500/20 animate-pulse">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                    <span>✓ 100% COMPLETED</span>
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs font-mono text-cyan-400 capitalize bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                                            Status: {c.enrollment_status}
                                        </span>
                                    </div>

                                    {c.sections?.map((sec) => (
                                        <div key={sec.section_id} className="space-y-2">
                                            <div className="text-xs font-bold text-slate-300">
                                                {sec.title} ({sec.completed_lessons}/{sec.total_lessons} completed)
                                            </div>
                                            <div className="divide-y divide-slate-800/40 bg-slate-900/60 rounded-xl border border-slate-800/60 p-2">
                                                {sec.lessons?.map((les) => (
                                                    <div key={les.lesson_id} className="p-2.5 flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-2">
                                                            {les.status === 'completed' ? (
                                                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                                            ) : (
                                                                <Play className="w-4 h-4 text-cyan-400 shrink-0" />
                                                            )}
                                                            <span className="text-slate-200 font-medium">{les.title}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 font-mono text-[11px]">
                                                            <span className="text-cyan-400 font-bold">{les.progress_percentage}% Watched</span>
                                                            <span className="text-slate-500">({les.watched_seconds}s)</span>
                                                            {les.completed_at && (
                                                                <span className="text-emerald-400">✓ {les.completed_at}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
