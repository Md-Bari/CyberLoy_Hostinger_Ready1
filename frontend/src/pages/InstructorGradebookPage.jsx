import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { BookOpen, Users } from 'lucide-react';

export default function InstructorGradebookPage() {
    const [gradebook, setGradebook] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGradebook();
    }, []);

    const fetchGradebook = async () => {
        try {
            const res = await api.getGradebook();
            setGradebook(res);
        } catch (e) {
            console.error('Failed to load gradebook', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading gradebook...</div>;
    }

    return (
        <div className="min-h-screen bg-[#f4f7fb] py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                        Instructor Gradebook
                    </h1>
                    <p className="text-slate-600 text-sm mt-1">Track student progress and assessment submissions</p>
                </div>

                {gradebook.map((course) => (
                    <div key={course.course_id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-slate-900">{course.course_title}</h2>
                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                    <span className="flex items-center gap-1"><Users className="w-4 h-4" />{course.total_students} Students</span>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Student</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Progress</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Submissions</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Avg Score</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {course.students.map((student) => (
                                        <tr key={student.student_id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-slate-900">{student.name}</div>
                                                    <div className="text-xs text-slate-500">{student.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-32 bg-slate-200 rounded-full h-2 overflow-hidden">
                                                        <div className="bg-blue-600 h-full" style={{ width: `${student.progress_percentage}%` }} />
                                                    </div>
                                                    <span className="text-xs font-semibold">{student.progress_percentage}%</span>
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1">{student.completed_lessons}/{student.total_lessons} lessons</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${student.enrollment_status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                                                    {student.enrollment_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                <div>Total: {student.submissions_count}</div>
                                                {student.pending_submissions > 0 && <div className="text-amber-600 font-semibold">Pending: {student.pending_submissions}</div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                                                {student.average_score ? `${student.average_score}%` : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
