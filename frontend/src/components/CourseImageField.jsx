import React, { useId, useRef, useState } from 'react';
import { ImagePlus, Link2, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { api, resolveMediaUrl } from '../lib/api';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Course poster picker: drag & drop or click to upload (stored by the API), or
 * paste an external image URL. `value` is the stored thumbnail_url.
 */
export default function CourseImageField({ value, onChange, disabled = false }) {
    const inputId = useId();
    const fileRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [showUrl, setShowUrl] = useState(false);
    const [urlDraft, setUrlDraft] = useState('');
    const [broken, setBroken] = useState(false);

    const upload = async (file) => {
        if (!file) return;
        setError('');
        if (!ACCEPTED.includes(file.type)) {
            setError('Use a JPG, PNG or WebP image.');
            return;
        }
        if (file.size > MAX_BYTES) {
            setError('The image must be 5 MB or smaller.');
            return;
        }
        setUploading(true);
        try {
            const res = await api.uploadCourseImage(file);
            setBroken(false);
            onChange(res.url);
        } catch (e) {
            setError(e.message || 'Upload failed.');
        } finally {
            setUploading(false);
        }
    };

    const applyUrl = () => {
        const url = urlDraft.trim();
        if (!/^https?:\/\/\S+$/i.test(url)) {
            setError('Enter a full image link starting with http:// or https://');
            return;
        }
        setError('');
        setBroken(false);
        onChange(url);
        setUrlDraft('');
        setShowUrl(false);
    };

    const preview = resolveMediaUrl(value);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label htmlFor={inputId} className="text-xs font-semibold text-slate-700">
                    Course poster image <span className="font-normal text-slate-400">(optional, 16:9 recommended)</span>
                </label>
            </div>

            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    if (!disabled) setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (!disabled) upload(e.dataTransfer.files?.[0]);
                }}
                className={`relative aspect-video overflow-hidden rounded-xl border-2 border-dashed transition ${
                    dragOver ? 'border-blue-500 bg-blue-50' : value ? 'border-transparent' : 'border-slate-300 bg-slate-50'
                }`}
            >
                {value && !broken ? (
                    <>
                        <img src={preview} alt="Course poster preview" onError={() => setBroken(true)} className="h-full w-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/60 to-transparent p-2.5">
                            <button
                                type="button"
                                disabled={disabled || uploading}
                                onClick={() => fileRef.current?.click()}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 shadow hover:bg-white"
                            >
                                <RefreshCw className="h-3.5 w-3.5" /> Replace
                            </button>
                            <button
                                type="button"
                                disabled={disabled || uploading}
                                onClick={() => onChange('')}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 shadow hover:bg-white"
                            >
                                <Trash2 className="h-3.5 w-3.5" /> Remove
                            </button>
                        </div>
                    </>
                ) : (
                    <button
                        type="button"
                        disabled={disabled || uploading}
                        onClick={() => fileRef.current?.click()}
                        className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-slate-500 hover:text-blue-600"
                    >
                        <ImagePlus className="h-8 w-8" />
                        <span className="text-xs font-semibold">
                            {broken ? 'This image could not be loaded - upload another' : 'Click to upload or drag an image here'}
                        </span>
                        <span className="text-[10px] text-slate-400">JPG, PNG or WebP · up to 5 MB · at least 400 × 225 px</span>
                    </button>
                )}

                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-white/80 text-xs font-semibold text-blue-700">
                        <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                    </div>
                )}
            </div>

            <input
                id={inputId}
                ref={fileRef}
                type="file"
                accept={ACCEPTED.join(',')}
                className="hidden"
                onChange={(e) => {
                    upload(e.target.files?.[0]);
                    e.target.value = '';
                }}
            />

            {showUrl ? (
                <div className="flex gap-2">
                    <input
                        type="url"
                        value={urlDraft}
                        onChange={(e) => setUrlDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                applyUrl();
                            }
                        }}
                        placeholder="https://example.com/poster.jpg"
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                    <button type="button" onClick={applyUrl} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                        Use link
                    </button>
                </div>
            ) : (
                <button type="button" onClick={() => setShowUrl(true)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline">
                    <Link2 className="h-3.5 w-3.5" /> Or use an image link instead
                </button>
            )}

            {error && <p role="alert" className="text-[11px] font-medium text-red-600">{error}</p>}
        </div>
    );
}
