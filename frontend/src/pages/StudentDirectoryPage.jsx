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
    UserPlus,
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

    const [usersPerPage, setUsersPerPage] = useState(5);

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
        <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto bg-[#f4f7fb] text-slate-800 min-h-screen">
            {/* Header Search Banner */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div>
                    <h3 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" /> Student Directory
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Search, filter, and review detailed progress profiles for registered learners.</p>
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
                        className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                    />
                </div>
            </div>

            {/* Create New User Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                        <h4 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-blue-600" /> Create New User
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">Create a student or admin account and assign login credentials in the LMS.</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
                        Admin-only action
                    </div>
                </div>

                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                    <div className="md:col-span-1">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            value={newUserForm.name}
                            onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                            placeholder="Jane Doe"
                            className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={newUserForm.email}
                            onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                            placeholder="student@example.com"
                            className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                        <input
                            type="text"
                            required
                            value={newUserForm.password}
                            onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                            placeholder="Temporary password"
                            className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                        <select
                            value={newUserForm.role}
                            onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                            className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <button
                            type="submit"
                            disabled={creatingUser}
                            className="w-full px-4 py-2.5 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs transition disabled:opacity-50 shadow-sm"
                        >
                            {creatingUser ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Students Table Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-12 text-center text-slate-400 text-xs">Loading directory...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs">
                        No users found matching "{searchTerm}".
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-700">
                                <thead className="bg-[#f8fafc] text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 w-16"># ID</th>
                                        <th className="p-4">Student Profile</th>
                                        <th className="p-4">Joined Date</th>
                                        <th className="p-4 text-center">Courses Enrolled</th>
                                        <th className="p-4 text-center">100% Finished</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-sans">
                                    {paginatedUsers.map((student) => {
                                        const finishedCount = student.courses?.filter(c => c.progress_percentage >= 100).length || 0;
                                        return (
                                            <tr key={student.user_id} className="hover:bg-slate-50/80 transition">
                                                <td className="p-4 font-bold text-slate-400">#{student.user_id}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-[#0f172a] text-white font-bold flex items-center justify-center text-xs shadow-sm">
                                                            {student.user_name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-[#0f172a] block">{student.user_name}</span>
                                                            <span className="text-[11px] text-blue-600 block">{student.user_email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-slate-500 text-xs">{student.joined_at}</td>
                                                <td className="p-4 text-center font-bold text-[#0f172a]">{student.courses?.length || 0} Courses</td>
                                                <td className="p-4 text-center">
                                                    {finishedCount > 0 ? (
                                                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                                                            ✓ {finishedCount} Finished
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={() => handleViewStudentDetail(student.user_id)}
                                                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5 ml-auto border border-slate-200 shadow-xs"
                                                    >
                                                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                                                        <span>{loadingDetail ? 'Loading...' : 'See Details'}</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-[#f8fafc] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
                            <div className="flex items-center gap-3">
                                <span>
                                    Showing <span className="text-[#0f172a] font-bold">{filtered.length > 0 ? startIndex + 1 : 0}</span> to{' '}
                                    <span className="text-[#0f172a] font-bold">{Math.min(startIndex + usersPerPage, filtered.length)}</span> of{' '}
                                    <span className="text-blue-600 font-bold">{filtered.length}</span> students
                                </span>
                                <span className="text-slate-300">•</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-slate-500">Per page:</span>
                                    <select
                                        value={usersPerPage}
                                        onChange={(e) => {
                                            setUsersPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500 shadow-xs"
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 disabled:opacity-40 text-xs font-semibold transition flex items-center gap-1 shadow-xs"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                                    <button
                                        key={pg}
                                        onClick={() => setCurrentPage(pg)}
                                        className={`w-8 h-8 rounded-xl font-bold transition text-xs ${
                                            currentPage === pg
                                                ? 'bg-[#0f172a] text-white shadow-sm'
                                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        {pg}
                                    </button>
                                ))}

                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 disabled:opacity-40 text-xs font-semibold transition flex items-center gap-1 shadow-xs"
                                >
                                    Next <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {message && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold shadow-sm">
                    {message}
                </div>
            )}

            {/* Modal: Student Detail Watch Inspector */}
            {selectedStudentDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-in fade-in">
                    <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 my-8">
                        <button
                            onClick={() => setSelectedStudentDetail(null)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="pb-4 border-b border-slate-100">
                            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                                Student Watch Inspector
                            </span>
                            <h3 className="text-xl font-bold text-[#0f172a] mt-2">
                                {selectedStudentDetail.user?.name} ({selectedStudentDetail.user?.email})
                            </h3>
                        </div>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                            {selectedStudentDetail.courses?.map((c) => (
                                <div key={c.course_id} className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-5 space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 flex-wrap gap-2">
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-bold text-[#0f172a] text-sm">{c.course_title}</h4>
                                            {(c.enrollment_status === 'completed' || c.sections?.every(s => s.completed_lessons > 0 && s.completed_lessons === s.total_lessons)) && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                    <span>✓ 100% COMPLETED</span>
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs font-semibold text-blue-700 capitalize bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                                            Status: {c.enrollment_status}
                                        </span>
                                    </div>

                                    {c.sections?.map((sec) => (
                                        <div key={sec.section_id} className="space-y-2">
                                            <div className="text-xs font-bold text-slate-700">
                                                {sec.title} ({sec.completed_lessons}/{sec.total_lessons} completed)
                                            </div>
                                            <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200/80 p-2 shadow-xs">
                                                {sec.lessons?.map((les) => (
                                                    <div key={les.lesson_id} className="p-2.5 flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-2">
                                                            {les.status === 'completed' ? (
                                                                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                                            ) : (
                                                                <Play className="w-4 h-4 text-blue-600 shrink-0" />
                                                            )}
                                                            <span className="text-slate-800 font-medium">{les.title}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[11px]">
                                                            <span className="text-blue-600 font-bold">{les.progress_percentage}% Watched</span>
                                                            <span className="text-slate-400">({les.watched_seconds}s)</span>
                                                            {les.completed_at && (
                                                                <span className="text-emerald-600 font-semibold">✓ {les.completed_at}</span>
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
