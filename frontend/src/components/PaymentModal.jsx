import React, { useState } from 'react';
import { AlertCircle, CreditCard, Lock, X } from 'lucide-react';
import { api } from '../lib/api';

export default function PaymentModal({ course, isOpen, onClose }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !course) return null;

    const startCheckout = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await api.payCourse(course.id);
            if (!result.checkout_url) {
                throw new Error('Checkout could not be started. Please try again later.');
            }
            window.location.assign(result.checkout_url);
        } catch (requestError) {
            setError(requestError.message || 'Unable to start secure checkout.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80" role="presentation">
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="checkout-title"
                className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-7 text-slate-100 shadow-2xl"
            >
                <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    aria-label="Close checkout"
                    className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                    <X className="h-5 w-5" />
                </button>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-950 text-cyan-300">
                    <CreditCard className="h-6 w-6" />
                </div>
                <h2 id="checkout-title" className="text-xl font-bold">Secure course checkout</h2>
                <p className="mt-2 text-sm text-slate-300">
                    Continue to Stripe to pay for <strong>{course.title}</strong>. Card details are entered only on Stripe.
                </p>
                <p className="mt-4 rounded-xl border border-slate-700 bg-slate-950 p-4 text-lg font-bold">
                    {course.currency || 'USD'} {Number(course.price || 0).toFixed(2)}
                </p>
                {error && (
                    <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {error}
                    </p>
                )}
                <button
                    type="button"
                    onClick={startCheckout}
                    disabled={loading}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
                >
                    <Lock className="h-4 w-4" />
                    {loading ? 'Connecting to Stripe...' : 'Continue to secure payment'}
                </button>
                <p className="mt-3 text-center text-xs text-slate-400">Payments are securely processed by Stripe.</p>
            </section>
        </div>
    );
}
