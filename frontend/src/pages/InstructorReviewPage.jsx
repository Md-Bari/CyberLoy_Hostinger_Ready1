import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, ClipboardCheck } from 'lucide-react';
import { api } from '../lib/api';

export default function InstructorReviewPage() {
    const [submissions, setSubmissions] = useState([]);
    const [grades, setGrades] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);

    const loadSubmissions = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await api.getAssessmentSubmissions();
            setSubmissions(result.data || []);
        } catch (requestError) {
            setError(requestError.message || 'Could not load submissions.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubmissions();
    }, []);

    const setGrade = (id, key, value) => {
        setGrades((current) => ({
            ...current,
            [id]: { score: 0, passed: false, teacher_notes: '', ...current[id], [key]: value },
        }));
    };

    const submitGrade = async (submission) => {
        const grade = grades[submission.id] || { score: 0, passed: false, teacher_notes: '' };
        setSavingId(submission.id);
        setError('');
        try {
            await api.gradeAssessment(submission.id, grade);
            await loadSubmissions();
        } catch (requestError) {
            setError(requestError.message || 'Unable to save assessment feedback.');
        } finally {
            setSavingId(null);
        }
    };

    return (
        <main className="mx-auto min-h-screen max-w-5xl space-y-6 bg-[#f4f7fb] p-4 text-slate-800 sm:p-8">
            <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                    <ClipboardCheck className="h-6 w-6 text-blue-600" /> Assessment review
                </h1>
                <p className="mt-2 text-sm text-slate-600">Review written work for courses assigned to you, give feedback, and record a pass decision.</p>
            </header>
            {error && <p role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="h-4 w-4" />{error}</p>}
            {loading ? (
                <p role="status" className="p-8 text-center text-sm text-slate-500">Loading submissions...</p>
            ) : submissions.length === 0 ? (
                <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">No assessments are waiting for review.</p>
            ) : submissions.map((submission) => {
                const current = grades[submission.id] || { score: 0, passed: false, teacher_notes: '' };
                return (
                    <article key={submission.id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div>
                            <h2 className="text-lg font-semibold">{submission.lesson?.title || 'Assessment'}</h2>
                            <p className="text-sm text-slate-600">
                                {submission.lesson?.section?.title} · {submission.user?.name} ({submission.user?.email})
                            </p>
                        </div>
                        <ol className="space-y-3">
                            {(submission.answers || []).map((answer, index) => (
                                <li key={index} className="rounded-lg bg-slate-50 p-3 text-sm">
                                    <span className="font-medium">Answer {index + 1}</span>
                                    <p className="mt-1 whitespace-pre-wrap">{String(answer)}</p>
                                </li>
                            ))}
                        </ol>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor={`score-${submission.id}`} className="mb-1 block text-sm font-medium">Score (0–100)</label>
                                <input id={`score-${submission.id}`} type="number" min="0" max="100" value={current.score} onChange={(event) => setGrade(submission.id, 'score', Number(event.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                            </div>
                            <div>
                                <label htmlFor={`notes-${submission.id}`} className="mb-1 block text-sm font-medium">Instructor feedback</label>
                                <textarea id={`notes-${submission.id}`} rows="3" maxLength="10000" value={current.teacher_notes} onChange={(event) => setGrade(submission.id, 'teacher_notes', event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={current.passed} onChange={(event) => setGrade(submission.id, 'passed', event.target.checked)} />
                            Mark assessment as passed
                        </label>
                        <button type="button" onClick={() => submitGrade(submission)} disabled={savingId === submission.id} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                            <CheckCircle className="h-4 w-4" />{savingId === submission.id ? 'Saving...' : 'Save review'}
                        </button>
                    </article>
                );
            })}
        </main>
    );
}
