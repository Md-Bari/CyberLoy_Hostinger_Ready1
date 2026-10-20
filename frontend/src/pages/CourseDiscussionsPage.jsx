import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MessageSquare, Send } from 'lucide-react';
import { api } from '../lib/api';

export default function CourseDiscussionsPage() {
    const { id } = useParams();
    const [discussions, setDiscussions] = useState([]);
    const [body, setBody] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);

    const load = async () => {
        try {
            const result = await api.getCourseDiscussions(id);
            setDiscussions(result.data || []);
        } catch (requestError) {
            setError(requestError.message || 'Unable to load course discussions.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [id]);

    const submit = async (event) => {
        event.preventDefault();
        setPosting(true);
        setError('');
        try {
            await api.postCourseDiscussion(id, body, replyTo);
            setBody('');
            setReplyTo(null);
            await load();
        } catch (requestError) {
            setError(requestError.message || 'Unable to post your message.');
        } finally {
            setPosting(false);
        }
    };

    return (
        <main className="mx-auto min-h-screen max-w-4xl space-y-6 bg-[#f4f7fb] p-4 text-slate-800 sm:p-8">
            <Link to={`/courses/${id}`} className="text-sm font-medium text-blue-700 hover:underline">Back to course</Link>
            <header className="rounded-2xl border border-slate-200 bg-white p-6">
                <h1 className="flex items-center gap-2 text-2xl font-bold"><MessageSquare className="h-6 w-6 text-blue-600" /> Course discussion</h1>
                <p className="mt-2 text-sm text-slate-600">Share questions and learning notes with people in this course.</p>
            </header>
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
                {replyTo && <p className="text-sm text-slate-600">Replying to a discussion <button type="button" onClick={() => setReplyTo(null)} className="ml-2 text-blue-700 underline">Cancel reply</button></p>}
                <label htmlFor="discussion-body" className="block text-sm font-semibold">Your message</label>
                <textarea id="discussion-body" required maxLength={5000} rows="4" value={body} onChange={(event) => setBody(event.target.value)} className="w-full rounded-lg border border-slate-300 p-3 text-sm" />
                <button type="submit" disabled={posting} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                    <Send className="h-4 w-4" />{posting ? 'Posting...' : replyTo ? 'Post reply' : 'Start discussion'}
                </button>
            </form>
            {loading ? <p role="status">Loading discussions...</p> : discussions.length === 0 ? (
                <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No discussions yet. Start one above.</p>
            ) : discussions.map((item) => (
                <article key={item.id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
                    <div>
                        <h2 className="text-sm font-semibold">{item.user?.name} <span className="text-xs font-normal text-slate-500">{item.user?.role === 'instructor' ? '· Instructor' : ''}</span></h2>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{item.body}</p>
                    </div>
                    <div className="space-y-3 border-l-2 border-slate-200 pl-4">
                        {(item.replies || []).map((reply) => (
                            <div key={reply.id}>
                                <p className="text-xs font-semibold">{reply.user?.name} {reply.user?.role === 'instructor' && <span className="text-blue-700">· Instructor</span>}</p>
                                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{reply.body}</p>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={() => { setReplyTo(item.id); document.getElementById('discussion-body')?.focus(); }} className="text-sm font-medium text-blue-700 hover:underline">Reply</button>
                </article>
            ))}
        </main>
    );
}
