import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight, Award, BarChart2, BookOpen, Brain, Clock, Cloud, Code2,
    Network, PlayCircle, ShieldCheck,
} from 'lucide-react';
import { resolveMediaUrl } from '../lib/api';

// Cover art is derived from the course topic so every card gets a distinct but
// on-brand look without needing uploaded thumbnails.
const THEMES = [
    { match: /\b(ai|machine learning|ml|llm|genai)\b/i, Icon: Brain, gradient: 'from-violet-600 via-indigo-600 to-blue-600' },
    { match: /cloud|aws|azure|gcp/i, Icon: Cloud, gradient: 'from-sky-500 via-blue-600 to-indigo-700' },
    { match: /web|app|code|devsecops|software|api/i, Icon: Code2, gradient: 'from-emerald-500 via-teal-600 to-cyan-700' },
    { match: /network|soc|siem|threat|incident/i, Icon: Network, gradient: 'from-cyan-500 via-sky-600 to-blue-800' },
    { match: /iso|grc|compliance|governance|audit|risk/i, Icon: ShieldCheck, gradient: 'from-amber-500 via-orange-600 to-rose-600' },
];
const DEFAULT_THEME = { Icon: ShieldCheck, gradient: 'from-[#0052FE] via-blue-700 to-[#0b1f44]' };

const LEVEL_STYLES = {
    Beginner: 'bg-emerald-500/90',
    Intermediate: 'bg-sky-500/90',
    Advanced: 'bg-violet-500/90',
    Expert: 'bg-rose-500/90',
};

function themeFor(course) {
    const haystack = `${course.category || ''} ${course.title || ''}`;
    return THEMES.find((t) => t.match.test(haystack)) || DEFAULT_THEME;
}

export function formatPrice(amount, currency = 'USD') {
    try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
    } catch {
        return `$${Number(amount).toFixed(2)}`;
    }
}

export default function CourseCard({ course, headingLevel = 'h3' }) {
    const { Icon, gradient } = themeFor(course);
    const Heading = headingLevel;
    const [imageFailed, setImageFailed] = useState(false);
    const poster = course.thumbnail_url && !imageFailed ? resolveMediaUrl(course.thumbnail_url) : '';
    const enrolled = Boolean(course.is_unlocked);
    const progress = Math.min(100, Math.max(0, Number(course.progress_percentage) || 0));
    const isFree = !course.requires_payment || Number(course.price) === 0;
    const hasDiscount = !isFree && course.discount_price != null && Number(course.discount_price) < Number(course.price);
    const currency = course.currency || 'USD';
    const lessons = Number(course.lessons_count) || 0;

    const meta = [
        lessons > 0 && { Icon: BookOpen, label: `${lessons} ${lessons === 1 ? 'lesson' : 'lessons'}` },
        course.duration && { Icon: Clock, label: course.duration },
        course.level && { Icon: BarChart2, label: course.level },
    ].filter(Boolean);

    return (
        <Link
            to={`/courses/${course.id}`}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052FE] focus-visible:ring-offset-2"
        >
            {/* Cover: uploaded course poster, or topic artwork as a fallback */}
            <div className={`relative aspect-[16/9] overflow-hidden ${poster ? 'bg-slate-200' : `bg-gradient-to-br ${gradient}`}`}>
                {poster ? (
                    <>
                        <img
                            src={poster}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            onError={() => setImageFailed(true)}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/25" />
                    </>
                ) : (
                    <>
                        <div
                            aria-hidden="true"
                            className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:28px_28px]"
                        />
                        <div aria-hidden="true" className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
                        <Icon
                            aria-hidden="true"
                            className="absolute -bottom-6 -right-4 h-36 w-36 text-white/15 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
                            strokeWidth={1.25}
                        />
                    </>
                )}
                <div className="relative flex h-full flex-col justify-between p-4">
                    <div className="flex items-start justify-between gap-2">
                        {course.level && (
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-sm backdrop-blur ${LEVEL_STYLES[course.level] || 'bg-slate-900/60'}`}>
                                {course.level}
                            </span>
                        )}
                        {course.certificate_auto_issue ? (
                            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-800 shadow-sm">
                                <Award className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" /> Certificate
                            </span>
                        ) : null}
                    </div>
                    {!poster && (
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/30 backdrop-blur-sm">
                            <Icon className="h-6 w-6" aria-hidden="true" />
                        </span>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col p-5">
                {course.category && (
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0052FE]">{course.category}</p>
                )}
                <Heading className="mt-1.5 line-clamp-2 font-display text-lg font-bold leading-snug text-slate-900 transition-colors group-hover:text-[#0052FE]">
                    {course.title}
                </Heading>
                {course.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">{course.description}</p>
                )}

                {course.instructor_name && (
                    <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                            {course.instructor_name.charAt(0).toUpperCase()}
                        </span>
                        <span className="truncate">{course.instructor_name}</span>
                    </p>
                )}

                {meta.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
                        {meta.map(({ Icon: MetaIcon, label }) => (
                            <li key={label} className="flex items-center gap-1.5">
                                <MetaIcon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                                {label}
                            </li>
                        ))}
                    </ul>
                )}

                {/* Footer */}
                <div className="mt-auto pt-5">
                    {enrolled ? (
                        <div className="border-t border-slate-100 pt-4">
                            <div className="mb-1.5 flex items-center justify-between text-xs">
                                <span className="font-medium text-slate-600">{progress >= 100 ? 'Completed' : 'Your progress'}</span>
                                <span className="font-bold text-[#0052FE]">{progress}%</span>
                            </div>
                            <div
                                className="h-2 overflow-hidden rounded-full bg-slate-100"
                                role="progressbar"
                                aria-valuenow={progress}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${course.title} progress`}
                            >
                                <div className="h-full rounded-full bg-gradient-to-r from-[#0052FE] to-cyan-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0052FE]">
                                <PlayCircle className="h-4 w-4" aria-hidden="true" />
                                {progress >= 100 ? 'Review course' : 'Continue learning'}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
                            <div>
                                {isFree ? (
                                    <span className="font-display text-xl font-extrabold text-emerald-600">Free</span>
                                ) : (
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-display text-xl font-extrabold text-slate-900">
                                            {formatPrice(hasDiscount ? course.discount_price : course.price, currency)}
                                        </span>
                                        {hasDiscount && (
                                            <span className="text-sm text-slate-400 line-through">{formatPrice(course.price, currency)}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors group-hover:bg-[#0052FE]">
                                View course
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}

export function CourseCardSkeleton() {
    return (
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-hidden="true">
            <div className="aspect-[16/9] animate-pulse bg-slate-200" />
            <div className="space-y-3 p-5">
                <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                <div className="h-5 w-4/5 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                <div className="flex justify-between border-t border-slate-100 pt-4">
                    <div className="h-6 w-16 animate-pulse rounded bg-slate-200" />
                    <div className="h-8 w-28 animate-pulse rounded-full bg-slate-200" />
                </div>
            </div>
        </div>
    );
}
