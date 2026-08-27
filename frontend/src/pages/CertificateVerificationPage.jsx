import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Award, ShieldCheck, CheckCircle2, AlertTriangle, Printer, Search, ArrowRight, Building, Calendar, UserCheck } from 'lucide-react';

export default function CertificateVerificationPage() {
    const { code } = useParams();
    const [searchCode, setSearchCode] = useState(code || '');
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (code) {
            verifyCode(code);
        }
    }, [code]);

    const verifyCode = async (codeToVerify) => {
        if (!codeToVerify) return;
        setLoading(true);
        setError('');
        setSearched(true);

        try {
            const data = await api.verifyCertificate(codeToVerify.trim());
            setCertificate(data);
        } catch (err) {
            setCertificate(null);
            setError(err.message || 'No valid certificate found for this verification code.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        verifyCode(searchCode);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-400 text-xs font-mono mb-4">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Public Credential Verification Portal</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Verify Certificate of Completion</h1>
                <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
                    Verify the authenticity of credentials issued by CyberLoy Enterprise Cybersecurity Academy.
                </p>

                {/* Verification Code Search Bar */}
                <form onSubmit={handleSearch} className="mt-8 max-w-lg mx-auto flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Enter Certificate ID (e.g. CERT-2026-XXXX) or Verification Code"
                            value={searchCode}
                            onChange={(e) => setSearchCode(e.target.value)}
                            required
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-cyan-950"
                    >
                        <Search className="w-4 h-4" />
                        <span>{loading ? 'Checking...' : 'Verify'}</span>
                    </button>
                </form>
            </div>

            {/* Results Section */}
            {searched && (
                <div className="mt-8">
                    {certificate ? (
                        <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden print:border print:bg-white print:text-black">
                            {/* Verification Badge */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 print:border-gray-300">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                                        <CheckCircle2 className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                                            {certificate.status}
                                        </div>
                                        <h3 className="text-xl font-extrabold text-white print:text-black">Official Certificate Verified</h3>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePrint}
                                    className="print:hidden px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
                                >
                                    <Printer className="w-4 h-4" />
                                    <span>Print Verified Record</span>
                                </button>
                            </div>

                            {/* Certificate Details Grid */}
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-1 print:bg-gray-50 print:border-gray-200">
                                    <span className="text-[11px] font-mono text-slate-500 uppercase block">Certificate Recipient</span>
                                    <h4 className="text-lg font-bold text-white flex items-center gap-2 print:text-black">
                                        <UserCheck className="w-4 h-4 text-cyan-400" />
                                        <span>{certificate.student_name}</span>
                                    </h4>
                                </div>

                                <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-1 print:bg-gray-50 print:border-gray-200">
                                    <span className="text-[11px] font-mono text-slate-500 uppercase block">Course Program</span>
                                    <h4 className="text-lg font-bold text-white flex items-center gap-2 print:text-black">
                                        <Award className="w-4 h-4 text-amber-400" />
                                        <span>{certificate.course_title}</span>
                                    </h4>
                                </div>

                                <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-1 print:bg-gray-50 print:border-gray-200">
                                    <span className="text-[11px] font-mono text-slate-500 uppercase block">Certificate ID & Verification Code</span>
                                    <div className="text-sm font-mono font-bold text-cyan-400 print:text-black">
                                        {certificate.certificate_id}
                                    </div>
                                    <div className="text-xs font-mono text-slate-400">
                                        Code: {certificate.verification_code}
                                    </div>
                                </div>

                                <div className="p-5 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-1 print:bg-gray-50 print:border-gray-200">
                                    <span className="text-[11px] font-mono text-slate-500 uppercase block">Issue Date & Authority</span>
                                    <div className="text-sm font-semibold text-white flex items-center gap-1.5 print:text-black">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <span>{certificate.issue_date}</span>
                                    </div>
                                    <div className="text-xs text-slate-400 font-mono">
                                        Issued by: {certificate.issued_by}
                                    </div>
                                </div>
                            </div>

                            {/* Trust Seal Footer */}
                            <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-mono print:border-gray-300">
                                <span className="flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Issued by {certificate.organization}
                                </span>
                                <span>100% Tamper-Evident Cryptographic Record</span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-900 border border-red-800/40 rounded-3xl p-8 text-center space-y-3">
                            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
                            <h3 className="text-xl font-bold text-white">Invalid or Unverified Credential</h3>
                            <p className="text-xs text-slate-400 max-w-md mx-auto">{error}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
