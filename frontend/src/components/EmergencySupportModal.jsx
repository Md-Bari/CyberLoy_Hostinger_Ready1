import React, { useState } from 'react';
import { ShieldAlert, X, Send, CheckCircle2, AlertTriangle, PhoneCall } from 'lucide-react';
import { api } from '../lib/api';

export default function EmergencySupportModal({ isOpen, onClose }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [contact, setContact] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const res = await api.submitEmergencySupport({
                name,
                email,
                contact,
                description,
            });

            setSuccessMessage(res.message || 'Emergency incident report submitted! Our response team is on standby.');
            setName('');
            setEmail('');
            setContact('');
            setDescription('');

            setTimeout(() => {
                setSuccessMessage('');
                onClose();
            }, 3000);
        } catch (err) {
            setErrorMessage(err.message || 'Failed to submit emergency request. Please try again or call our 24/7 hotline.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
            <div className="relative w-full max-w-xl bg-[#080E21] border border-red-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-red-950/50 space-y-6 my-8">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white transition border border-slate-800"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header Banner */}
                <div className="flex items-start gap-4 pb-4 border-b border-slate-800">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-500/20">
                        <ShieldAlert className="w-7 h-7" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-extrabold uppercase bg-rose-950 text-rose-400 border border-rose-800 px-2 py-0.5 rounded">
                                24/7 Rapid Escalation
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                On Standby
                            </span>
                        </div>
                        <h3 className="text-xl font-extrabold text-white mt-1">Emergency Security Incident Escalation</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Submit immediate incident details for containment & forensic recovery.</p>
                    </div>
                </div>

                {/* Success Message Alert */}
                {successMessage && (
                    <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-3 shadow-lg">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>{successMessage}</span>
                    </div>
                )}

                {/* Error Message Alert */}
                {errorMessage && (
                    <div className="p-4 rounded-2xl bg-rose-950/90 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-3 shadow-lg">
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* Form Inputs */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name / Organization</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. John Doe (CyberLoy Incident Response)"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1">Contact Number (Hotline)</label>
                            <input
                                type="text"
                                required
                                placeholder="+880 1744 201201"
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Incident Description & Controls Affected</label>
                        <textarea
                            rows="4"
                            required
                            placeholder="Describe suspected breach, malware behavior, ransomware symptoms, or affected servers..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
                        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                            <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Direct Line: +8801744201201</span>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-semibold transition border border-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-bold text-xs transition shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <span>Escalating Request...</span>
                                ) : (
                                    <>
                                        <Send className="w-3.5 h-3.5" />
                                        <span>Submit Emergency Request</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
