import React, { useState, useEffect } from 'react';
import { ShieldCheck, CreditCard, Lock, CheckCircle, Sparkles, X, Smartphone, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';

export default function PaymentModal({ course, isOpen, onClose, onSuccess }) {
    const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'wallet'
    const [cardNumber, setCardNumber] = useState('');
    const [cardHolder, setCardHolder] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvc, setCardCvc] = useState('');
    const [walletNumber, setWalletNumber] = useState('');
    const [walletProvider, setWalletProvider] = useState('bkash');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successPayment, setSuccessPayment] = useState(null);
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        if (!isOpen) {
            setSuccessPayment(null);
            setError('');
            setLoading(false);
            setCountdown(3);
        }
    }, [isOpen]);

    // Live countdown when payment succeeds
    useEffect(() => {
        let timer;
        if (successPayment && countdown > 0) {
            timer = setTimeout(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else if (successPayment && countdown === 0) {
            handleCompleteRedirect();
        }
        return () => clearTimeout(timer);
    }, [successPayment, countdown]);

    if (!isOpen || !course) return null;

    const coursePrice = Number(course.price || 49.00).toFixed(2);
    const currency = course.currency || 'USD';

    const handleFillDemoCard = () => {
        setCardNumber('4242 •••• •••• 4242');
        setCardHolder('Cyber Security Student');
        setCardExpiry('12/28');
        setCardCvc('888');
        setError('');
    };

    const handleFillDemoWallet = () => {
        setWalletNumber('01700123456');
        setError('');
    };

    const handleCompleteRedirect = () => {
        const payload = successPayment?.res || { course_id: course.id };
        setSuccessPayment(null);
        onSuccess && onSuccess(payload);
    };

    const handleSubmitPayment = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const payload = {
                payment_method: paymentMethod === 'card' ? 'credit_card' : walletProvider,
                card_last_four: paymentMethod === 'card' ? (cardNumber.replace(/\D/g, '').slice(-4) || '4242') : '9999',
                payer_name: paymentMethod === 'card' ? (cardHolder || 'CyberLoy Student') : `Wallet (${walletNumber || '017...'})`,
            };

            const res = await api.payCourse(course.id, payload);
            setCountdown(3);
            setSuccessPayment({
                ...(res.payment || { transaction_id: 'TXN-SUCCESS-' + Date.now(), amount: coursePrice }),
                res: res,
            });
        } catch (err) {
            setError(err.message || 'Payment processing failed. Please check payment details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
                {/* Header background glow */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    disabled={loading}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                {successPayment ? (
                    <div className="p-8 text-center space-y-5">
                        <div className="w-16 h-16 bg-cyan-950 border border-cyan-500/50 rounded-full flex items-center justify-center mx-auto text-cyan-400 animate-bounce">
                            <CheckCircle className="w-9 h-9" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-extrabold text-white tracking-tight">Payment Confirmed!</h3>
                            <p className="text-sm text-slate-300 mt-1">
                                You have successfully unlocked <span className="text-cyan-400 font-semibold">{course.title}</span>.
                            </p>
                        </div>

                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-left space-y-1.5 text-xs font-mono">
                            <div className="flex justify-between text-slate-400">
                                <span>Transaction ID:</span>
                                <span className="text-cyan-400 font-bold">{successPayment.transaction_id}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>Amount Paid:</span>
                                <span className="text-emerald-400 font-bold">${coursePrice} {currency}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>Status:</span>
                                <span className="text-emerald-400 font-bold">COMPLETED & UNLOCKED</span>
                            </div>
                        </div>

                        {/* Instant Access Button & Countdown Bar */}
                        <div className="pt-2 space-y-3">
                            <button
                                type="button"
                                onClick={handleCompleteRedirect}
                                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm transition shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 group"
                            >
                                <span>Go to Course Curriculum Now</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 font-mono">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                                <span>Auto-redirecting in <span className="text-cyan-300 font-bold">{countdown}s</span>...</span>
                            </p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmitPayment} className="p-6 sm:p-8 space-y-6">
                        {/* Course & Pricing Header */}
                        <div>
                            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
                                <Lock className="w-3.5 h-3.5" />
                                <span>SECURE CHECKOUT & COURSE UNLOCK</span>
                            </div>
                            <h2 className="text-xl font-bold text-white tracking-tight line-clamp-1">{course.title}</h2>
                            <div className="mt-3 flex items-baseline justify-between bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                                <div>
                                    <span className="text-xs text-slate-400 block">Total One-Time Fee</span>
                                    <span className="text-2xl font-black text-cyan-400 font-mono">${coursePrice}</span>
                                    <span className="text-xs text-slate-500 ml-1 font-mono">{currency}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> Full Lifetime Access
                                    </span>
                                    <span className="text-[10px] text-slate-400 block font-mono">Verified Certificate Included</span>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Payment Method Selector */}
                        <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-2">Select Payment Method</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('card')}
                                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition text-left ${
                                        paymentMethod === 'card'
                                            ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950'
                                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                    }`}
                                >
                                    <CreditCard className="w-4 h-4 text-cyan-400" />
                                    <div>
                                        <div className="text-xs font-bold">Debit / Credit Card</div>
                                        <div className="text-[10px] text-slate-500">Visa, MC, Amex</div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('wallet')}
                                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition text-left ${
                                        paymentMethod === 'wallet'
                                            ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950'
                                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                    }`}
                                >
                                    <Smartphone className="w-4 h-4 text-pink-400" />
                                    <div>
                                        <div className="text-xs font-bold">Mobile Wallet</div>
                                        <div className="text-[10px] text-slate-500">bKash, Nagad, Stripe</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Card Form */}
                        {paymentMethod === 'card' && (
                            <div className="space-y-3.5 bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-300">Card Information</span>
                                    <button
                                        type="button"
                                        onClick={handleFillDemoCard}
                                        className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
                                    >
                                        <Sparkles className="w-3 h-3" /> Auto-Fill Demo Card
                                    </button>
                                </div>

                                <div>
                                    <input
                                        type="text"
                                        placeholder="Card Number (e.g. 4242 4242 4242 4242)"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(e.target.value)}
                                        required
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition font-mono"
                                    />
                                </div>

                                <div>
                                    <input
                                        type="text"
                                        placeholder="Cardholder Name"
                                        value={cardHolder}
                                        onChange={(e) => setCardHolder(e.target.value)}
                                        required
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        placeholder="MM/YY"
                                        value={cardExpiry}
                                        onChange={(e) => setCardExpiry(e.target.value)}
                                        required
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition font-mono"
                                    />
                                    <input
                                        type="password"
                                        maxLength="4"
                                        placeholder="CVC / CVV"
                                        value={cardCvc}
                                        onChange={(e) => setCardCvc(e.target.value)}
                                        required
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition font-mono"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Mobile Wallet Form */}
                        {paymentMethod === 'wallet' && (
                            <div className="space-y-3.5 bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-300">Wallet Details</span>
                                    <button
                                        type="button"
                                        onClick={handleFillDemoWallet}
                                        className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
                                    >
                                        <Sparkles className="w-3 h-3" /> Auto-Fill Demo
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    {['bkash', 'nagad', 'stripe'].map((provider) => (
                                        <button
                                            key={provider}
                                            type="button"
                                            onClick={() => setWalletProvider(provider)}
                                            className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider transition ${
                                                walletProvider === provider
                                                    ? 'bg-pink-950 border-pink-500 text-pink-300'
                                                    : 'bg-slate-900 border-slate-800 text-slate-400'
                                            }`}
                                        >
                                            {provider}
                                        </button>
                                    ))}
                                </div>

                                <div>
                                    <input
                                        type="text"
                                        placeholder="Account / Mobile Number"
                                        value={walletNumber}
                                        onChange={(e) => setWalletNumber(e.target.value)}
                                        required
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition font-mono"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm transition shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 group disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                                        <span>Processing Secure Payment...</span>
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4" />
                                        <span>Pay ${coursePrice} {currency} & Unlock Course</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Security Footer */}
                        <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-slate-500 font-mono">
                            <span className="flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 256-Bit SSL Encrypted
                            </span>
                            <span>•</span>
                            <span>Instant Course Access</span>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
