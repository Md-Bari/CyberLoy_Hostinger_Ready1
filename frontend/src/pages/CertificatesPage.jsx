import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Award, CheckCircle, Download, Printer, Shield, Calendar, X, ExternalLink, ShieldCheck } from 'lucide-react';

export default function CertificatesPage() {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCert, setSelectedCert] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        try {
            const data = await api.getMyCertificates();
            setCertificates(data || []);
        } catch (e) {
            console.error('Failed to load certificates:', e);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-10 text-center sm:text-left bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-950/60 border border-amber-800/80 text-amber-400 text-xs font-mono mb-3">
                        <Award className="w-3.5 h-3.5" />
                        <span>Verified Digital Credentials</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">My Certificates</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        View and download your official course completion credentials issued by CyberLoy Administrators.
                    </p>
                </div>

                <Link
                    to="/certificate/verify"
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-mono font-semibold flex items-center gap-1.5 transition border border-slate-700"
                >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Public Verification Tool</span>
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500 font-mono text-sm">
                    Loading certificates...
                </div>
            ) : certificates.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-3">
                    <Award className="w-12 h-12 text-slate-600 mx-auto" />
                    <h3 className="text-lg font-bold text-white">No Certificates Issued Yet</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Complete 100% of the video lessons and coursework in your enrolled courses. Once completed, your administrator will review your watch history and issue your verified certificate.
                    </p>
                    <div className="pt-2">
                        <Link
                            to="/courses"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                        >
                            Browse Course Catalog
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {certificates.map((cert) => (
                        <div
                            key={cert.id}
                            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-amber-500/50 transition shadow-xl group"
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <span className="text-[11px] font-mono text-amber-400 bg-amber-950/50 border border-amber-800/80 px-2.5 py-1 rounded-md">
                                        {cert.certificate_code}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                        {new Date(cert.issued_at).toLocaleDateString()}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition">
                                    {cert.course?.title}
                                </h3>

                                <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                                    <span>Issued by: <strong className="text-slate-200">{cert.issuer?.name || 'CyberLoy Academy'}</strong></span>
                                    <button
                                        onClick={() => setSelectedCert(cert)}
                                        className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 font-bold border border-amber-500/30 transition text-xs flex items-center gap-1.5"
                                    >
                                        <Award className="w-3.5 h-3.5" /> View Certificate
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Official Certificate View Modal */}
            {selectedCert && (
                <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                    <div className="relative w-full max-w-3xl bg-slate-900 border-4 border-amber-500/40 rounded-3xl p-8 shadow-2xl overflow-hidden print:border-2 print:shadow-none my-8">
                        <button
                            onClick={() => setSelectedCert(null)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition print:hidden"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center py-6 border-b-2 border-amber-500/30 pb-6 mb-6">
                            <div className="w-16 h-16 bg-amber-950/60 border-2 border-amber-500 rounded-full text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-950/50">
                                <Award className="w-8 h-8" />
                            </div>
                            <span className="text-xs font-mono tracking-widest text-amber-400 uppercase">CyberLoy LMS Verified Credential</span>
                            <h2 className="text-3xl font-black text-white mt-1 tracking-tight">CERTIFICATE OF COMPLETION</h2>
                        </div>

                        <div className="text-center space-y-4 my-6">
                            <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">This is to certify that</p>
                            <h3 className="text-2xl sm:text-3xl font-extrabold text-cyan-300 underline decoration-cyan-500 underline-offset-8">
                                {selectedCert.user?.name || user?.name}
                            </h3>
                            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                                has successfully completed all required video lessons, assessments, and curriculum coursework for
                            </p>
                            <h4 className="text-xl font-bold text-amber-400">{selectedCert.course?.title}</h4>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono text-slate-400">
                            <div>
                                <div className="text-slate-200 font-semibold">{selectedCert.certificate_code}</div>
                                <div className="text-[10px] text-slate-500">Certificate ID</div>
                            </div>

                            <div>
                                <div className="text-cyan-400 font-semibold">{selectedCert.verification_code || 'VER-CYBERLOY'}</div>
                                <div className="text-[10px] text-slate-500">Verification Code</div>
                            </div>

                            <div className="sm:text-right">
                                <div className="text-slate-200 font-semibold">{new Date(selectedCert.issued_at).toLocaleDateString()}</div>
                                <div className="text-[10px] text-slate-500">Issue Date</div>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/80 print:hidden">
                            <Link
                                to={`/certificate/verify/${selectedCert.certificate_code}`}
                                target="_blank"
                                className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1.5"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Verify on Public Portal</span>
                            </Link>

                            <button
                                onClick={handlePrint}
                                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-amber-950/50"
                            >
                                <Printer className="w-4 h-4" />
                                <span>Print / Save as PDF</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
