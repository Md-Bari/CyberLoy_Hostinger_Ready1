import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, ClipboardCheck, FileText, ShieldCheck } from 'lucide-react';
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
            [id]: {
                score: 0,
                passed: false,
                teacher_notes: '',
                ...current[id],
                [key]: value,
            },
        }));
    };

    const submitGrade = async (submission) => {
        const grade = grades[submission.id] || {
            score: submission.score ?? 0,
            passed: Boolean(submission.passed),
            teacher_notes: submission.teacher_notes || '',
        };
        setSavingId(submission.id);
        setError('');
        try {
            await api.gradeAssessment(submission.id, { ...grade, status: 'reviewed' });
            await loadSubmissions();
        } catch (requestError) {
            setError(requestError.message || 'Unable to save assessment feedback.');
        } finally {
            setSavingId(null);
        }
    };

    const renderQuestionResults = (submission) => {
        const questionResults = Array.isArray(submission.question_results) ? submission.question_results : [];
        if (questionResults.length === 0) return null;

        return (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                    <span>Question review</span>
                    <span>{submission.score ?? 0}%</span>
                </div>
                {questionResults.map((result, index) => (
                    <div key={`${result.question || 'question'}-${index}`} className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-700">
                        <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-800">Q{index + 1}. {result.question || 'Question'}</span>
                            <span className={`rounded-full px-2 py-0.5 font-bold ${result.is_correct ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {result.is_correct ? 'Correct' : 'Incorrect'}
                            </span>
                        </div>
                        <div className="mt-2 grid gap-1 text-[11px] text-slate-600 sm:grid-cols-2">
                            <p><span className="font-medium text-slate-500">Selected:</span> {result.selected_answer ?? 'No answer'}</p>
                            {result.correct_answer && <p><span className="font-medium text-slate-500">Correct:</span> {result.correct_answer}</p>}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <main className="mx-auto min-h-screen max-w-6xl space-y-6 bg-[#f4f7fb] p-4 text-slate-800 sm:p-8">
            <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                    <ClipboardCheck className="h-6 w-6 text-blue-600" /> Assessment Review Hub
                </h1>
                <p className="mt-2 text-sm text-slate-600">Review submissions, mark MCQ responses, score written work, and publish the final result to students.</p>
            </header>

            {error && <p role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="h-4 w-4" />{error}</p>}

            {loading ? (
                <p role="status" className="p-8 text-center text-sm text-slate-500">Loading submissions...</p>
            ) : submissions.length === 0 ? (
                <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">No assessment submissions are waiting for review.</p>
            ) : submissions.map((submission) => {
                const current = grades[submission.id] || {
                    score: submission.score ?? 0,
                    passed: Boolean(submission.passed),
                    teacher_notes: submission.teacher_notes || '',
                };
                const latestStatus = submission.status === 'reviewed' ? 'Published' : 'Pending';

                return (
                    <article key={submission.id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                                    <span>{submission.lesson?.title || 'Assessment'}</span>
                                </div>
                                <h2 className="mt-1 text-lg font-semibold text-slate-900">{submission.user?.name} ({submission.user?.email})</h2>
                                <p className="text-sm text-slate-600">{submission.lesson?.section?.title || 'Course lesson'}</p>
                            </div>
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${latestStatus === 'Published' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                                <ShieldCheck className="h-3 w-3" /> {latestStatus}
                            </span>
                        </div>

                        {submission.submission_text && (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                                <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Student response</div>
                                <p className="whitespace-pre-wrap">{submission.submission_text}</p>
                            </div>
                        )}

                        {Array.isArray(submission.answers) && submission.answers.length > 0 && (
                            <ol className="space-y-3">
                                {submission.answers.map((answer, index) => (
                                    <li key={index} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                                        <span className="font-medium text-slate-800">Answer {index + 1}</span>
                                        <p className="mt-1 whitespace-pre-wrap">{String(answer)}</p>
                                    </li>
                                ))}
                            </ol>
                        )}

                        {renderQuestionResults(submission)}

                        <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor={`score-${submission.id}`} className="mb-1 block text-sm font-medium text-slate-700">Score (0–100)</label>
                                <input
                                    id={`score-${submission.id}`}
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={current.score}
                                    onChange={(event) => setGrade(submission.id, 'score', Number(event.target.value))}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label htmlFor={`notes-${submission.id}`} className="mb-1 block text-sm font-medium text-slate-700">Instructor feedback</label>
                                <textarea
                                    id={`notes-${submission.id}`}
                                    rows="3"
                                    maxLength="10000"
                                    value={current.teacher_notes}
                                    onChange={(event) => setGrade(submission.id, 'teacher_notes', event.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                checked={current.passed}
                                onChange={(event) => setGrade(submission.id, 'passed', event.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Publish as passed / completed
                        </label>

                        <button
                            type="button"
                            onClick={() => submitGrade(submission)}
                            disabled={savingId === submission.id}
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
                        >
                            <CheckCircle className="h-4 w-4" />
                            {savingId === submission.id ? 'Saving result...' : 'Publish result'}
                        </button>
                    </article>
                );
            })}
        </main>
    );
}
