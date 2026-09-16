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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-[#f4f7fb] text-slate-800 min-h-screen">
            {/* Header */}
            <div className="text-center bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Public Credential Verification Portal</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">Verify Certificate of Completion</h1>
                <p className="text-slate-500 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
                    Verify the authenticity of credentials issued by CyberLoy Enterprise Cybersecurity Academy.
                </p>

                {/* Verification Code Search Bar */}
                <form onSubmit={handleSearch} className="mt-6 max-w-lg mx-auto flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Enter Certificate ID (e.g. CERT-2026-XXXX) or Verification Code"
                            value={searchCode}
                            onChange={(e) => setSearchCode(e.target.value)}
                            required
                            className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-5 py-2.5 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                    >
                        <Search className="w-4 h-4 text-cyan-400" />
                        <span>{loading ? 'Checking...' : 'Verify'}</span>
                    </button>
                </form>
            </div>

            {/* Results Section */}
            {searched && (
                <div className="mt-6">
                    {certificate ? (
                        <div className="bg-white border-2 border-emerald-300 rounded-2xl p-8 shadow-sm relative overflow-hidden print:border print:bg-white print:text-black">
                            {/* Verification Badge */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 print:border-gray-300">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                                        <CheckCircle2 className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                                            {certificate.status}
                                        </div>
                                        <h3 className="text-xl font-extrabold text-[#0f172a] print:text-black">Official Certificate Verified</h3>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePrint}
                                    className="print:hidden px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 shadow-sm"
                                >
                                    <Printer className="w-4 h-4 text-blue-600" />
                                    <span>Print Verified Record</span>
                                </button>
                            </div>

                            {/* Certificate Details Grid (Clean White Small Cards) */}
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-[#f8fafc] rounded-xl border border-slate-200/80 space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Certificate Recipient</span>
                                    <h4 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
                                        <UserCheck className="w-4 h-4 text-blue-600" />
                                        <span>{certificate.student_name}</span>
                                    </h4>
                                </div>

                                <div className="p-4 bg-[#f8fafc] rounded-xl border border-slate-200/80 space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Course Program</span>
                                    <h4 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
                                        <Award className="w-4 h-4 text-amber-600" />
                                        <span>{certificate.course_title}</span>
                                    </h4>
                                </div>

                                <div className="p-4 bg-[#f8fafc] rounded-xl border border-slate-200/80 space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Certificate ID & Verification Code</span>
                                    <div className="text-xs font-bold text-blue-600">
                                        {certificate.certificate_id}
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                        Code: {certificate.verification_code}
                                    </div>
                                </div>

                                <div className="p-4 bg-[#f8fafc] rounded-xl border border-slate-200/80 space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Issue Date & Authority</span>
                                    <div className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{certificate.issue_date}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                        Issued by: {certificate.issued_by}
                                    </div>
                                </div>
                            </div>

                            {/* Trust Seal Footer */}
                            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 print:border-gray-300">
                                <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Issued by {certificate.organization}
                                </span>
                                <span>100% Tamper-Evident Cryptographic Record</span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white border border-red-200 rounded-2xl p-8 text-center space-y-3 shadow-sm">
                            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
                            <h3 className="text-lg font-bold text-[#0f172a]">Invalid or Unverified Credential</h3>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">{error}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
