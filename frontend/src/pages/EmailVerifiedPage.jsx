import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export default function EmailVerifiedPage() {
    const [params] = useSearchParams();
    const verified = params.get('status') === 'success';

    return (
        <main className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-10">
            <section className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-100 shadow-xl">
                <h1 className="text-2xl font-bold">{verified ? 'Email verified' : 'Verification complete'}</h1>
                <p role="status" className="mt-3 text-sm text-slate-300">
                    {verified ? 'Your account is ready. You can now sign in.' : 'Open the verification link from your email to activate your account.'}
                </p>
                <Link to="/login" className="mt-6 inline-flex rounded-lg bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950">Go to sign in</Link>
            </section>
        </main>
    );
}
