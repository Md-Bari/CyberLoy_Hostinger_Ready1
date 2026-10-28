import React from 'react';

// Every template is drawn on a fixed A4 sheet (see CertificateSheet), so the
// frames below use absolute pixel offsets that print exactly as previewed.

const FONT = {
    serif: '"Playfair Display", Georgia, "Times New Roman", serif',
    sans: '"Plus Jakarta Sans", Inter, system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
    script: '"Great Vibes", "Playfair Display", cursive',
};

const SEALS = {
    gold: { fill: '#f7e7a8', ring: '#b8860b', icon: '#8a6212', ribbon: '#b8860b', ribbonDark: '#8a6212' },
    cyber: { fill: '#082f49', ring: '#22d3ee', icon: '#67e8f9', ribbon: '#0891b2', ribbonDark: '#155e75' },
    emerald: { fill: '#ecfdf5', ring: '#059669', icon: '#047857', ribbon: '#10b981', ribbonDark: '#047857' },
    slate: { fill: '#f8fafc', ring: '#334155', icon: '#1e293b', ribbon: '#475569', ribbonDark: '#1e293b' },
    crimson: { fill: '#fdf2f2', ring: '#9f1239', icon: '#881337', ribbon: '#be123c', ribbonDark: '#881337' },
    violet: { fill: '#f5f3ff', ring: '#7c3aed', icon: '#6d28d9', ribbon: '#8b5cf6', ribbonDark: '#6d28d9' },
    blueprint: { fill: '#0b3a75', ring: '#e0f2fe', icon: '#e0f2fe', ribbon: '#38bdf8', ribbonDark: '#0284c7' },
    royal: { fill: '#0b1a3a', ring: '#e6c66a', icon: '#f5e6b8', ribbon: '#c9a227', ribbonDark: '#8a6a12' },
    modern: { fill: '#ffffff', ring: '#ffffff', icon: '#0052FE', ribbon: '#bfdbfe', ribbonDark: '#93c5fd' },
};

// Seal styles an admin can pick explicitly; 'template' follows the template.
export const SEAL_PALETTES = {
    gold_seal: SEALS.gold,
    cyber_badge: SEALS.cyber,
    iso_crest: SEALS.emerald,
};

const Corner = ({ color, size = 46, thickness = 3, inset, rotate }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 46 46"
        style={{ position: 'absolute', ...inset, transform: `rotate(${rotate}deg)` }}
        aria-hidden="true"
    >
        <path d="M2 44V12C2 6.5 6.5 2 12 2h32" fill="none" stroke={color} strokeWidth={thickness} />
        <path d="M10 44V18c0-4.4 3.6-8 8-8h26" fill="none" stroke={color} strokeWidth={thickness / 2} />
        <circle cx="12" cy="12" r="3" fill={color} />
    </svg>
);

const corners = (color, offset, props = {}) => [
    { inset: { top: offset, left: offset }, rotate: 0 },
    { inset: { top: offset, right: offset }, rotate: 90 },
    { inset: { bottom: offset, right: offset }, rotate: 180 },
    { inset: { bottom: offset, left: offset }, rotate: 270 },
].map((c, i) => <Corner key={i} color={color} {...c} {...props} />);

const Bracket = ({ color, inset, rotate }) => (
    <svg width="54" height="54" viewBox="0 0 54 54" style={{ position: 'absolute', ...inset, transform: `rotate(${rotate}deg)` }} aria-hidden="true">
        <path d="M2 30V2h28" fill="none" stroke={color} strokeWidth="4" />
        <path d="M10 18V10h8" fill="none" stroke={color} strokeWidth="2" opacity="0.7" />
    </svg>
);

const brackets = (color, offset) => [
    { inset: { top: offset, left: offset }, rotate: 0 },
    { inset: { top: offset, right: offset }, rotate: 90 },
    { inset: { bottom: offset, right: offset }, rotate: 180 },
    { inset: { bottom: offset, left: offset }, rotate: 270 },
].map((c, i) => <Bracket key={i} color={color} {...c} />);

const Layer = ({ style, children }) => (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...style }}>{children}</div>
);

export const CERTIFICATE_TEMPLATES = [
    {
        id: 'gold',
        label: 'Gold Executive',
        desc: 'Parchment with gold foil frame',
        dark: false,
        fonts: { title: FONT.serif, name: FONT.script, body: FONT.serif },
        seal: SEALS.gold,
        background: 'radial-gradient(ellipse at center, #fffdf8 0%, #fbf5e6 60%, #f3e8cc 100%)',
        colors: { academy: '#6b5a2e', title: '#8a6212', presentation: '#7c7464', recipient: '#3f2d0c', achievement: '#57534e', course: '#8a6212', honors: '#a16207', footer: '#6b5a2e' },
        appearance: { outerBorder: '#c9a227', innerBorder: '#e6c66a', watermark: '#c9a227', watermarkOpacity: 6, headerIcon: '#b8860b', signature: '#292524', signatureLine: '#a8956a', sealLabel: '#6b5a2e' },
        Frame: ({ a }) => (
            <Layer>
                <div style={{ position: 'absolute', inset: 14, border: `10px solid ${a.outerBorder}` }} />
                <div style={{ position: 'absolute', inset: 32, border: `1.5px solid ${a.innerBorder}` }} />
                <div style={{ position: 'absolute', inset: 38, border: `0.75px solid ${a.innerBorder}` }} />
                {corners(a.outerBorder, 44)}
            </Layer>
        ),
    },
    {
        id: 'cyber',
        label: 'CyberLoy Tech',
        desc: 'Deep navy with neon cyan grid',
        dark: true,
        fonts: { title: FONT.sans, name: FONT.sans, body: FONT.sans },
        seal: SEALS.cyber,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.18), transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(0,82,254,0.25), transparent 50%), linear-gradient(160deg, #050b18 0%, #071428 55%, #030712 100%)',
        colors: { academy: '#94a3b8', title: '#67e8f9', presentation: '#94a3b8', recipient: '#ffffff', achievement: '#cbd5e1', course: '#22d3ee', honors: '#38bdf8', footer: '#64748b' },
        appearance: { outerBorder: '#06b6d4', innerBorder: '#0e7490', watermark: '#22d3ee', watermarkOpacity: 6, headerIcon: '#22d3ee', signature: '#e2e8f0', signatureLine: '#334155', sealLabel: '#67e8f9' },
        Frame: ({ a }) => (
            <Layer>
                <Layer style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.07) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                <div style={{ position: 'absolute', inset: 22, border: `1.5px solid ${a.innerBorder}`, borderRadius: 6 }} />
                {brackets(a.outerBorder, 14)}
                <div style={{ position: 'absolute', top: 22, left: '50%', width: 220, height: 3, transform: 'translateX(-50%)', background: `linear-gradient(90deg, transparent, ${a.outerBorder}, transparent)` }} />
                <div style={{ position: 'absolute', bottom: 22, left: '50%', width: 220, height: 3, transform: 'translateX(-50%)', background: `linear-gradient(90deg, transparent, ${a.outerBorder}, transparent)` }} />
            </Layer>
        ),
    },
    {
        id: 'iso',
        label: 'ISO 27001 Auditor',
        desc: 'Emerald accreditation guilloche',
        dark: false,
        fonts: { title: FONT.serif, name: FONT.serif, body: FONT.sans },
        seal: SEALS.emerald,
        background: 'linear-gradient(160deg, #ffffff 0%, #f3faf6 100%)',
        colors: { academy: '#065f46', title: '#064e3b', presentation: '#64748b', recipient: '#022c22', achievement: '#475569', course: '#047857', honors: '#059669', footer: '#065f46' },
        appearance: { outerBorder: '#047857', innerBorder: '#34d399', watermark: '#059669', watermarkOpacity: 5, headerIcon: '#059669', signature: '#0f172a', signatureLine: '#94a3b8', sealLabel: '#065f46' },
        Frame: ({ a }) => (
            <Layer>
                <div style={{ position: 'absolute', inset: 16, border: `14px solid ${a.outerBorder}`, backgroundClip: 'padding-box' }} />
                <div
                    style={{
                        position: 'absolute',
                        inset: 16,
                        border: '14px solid transparent',
                        borderImage: `repeating-linear-gradient(45deg, ${a.outerBorder} 0 6px, ${a.innerBorder} 6px 8px) 14`,
                        opacity: 0.55,
                    }}
                />
                <div style={{ position: 'absolute', inset: 40, border: `1px solid ${a.innerBorder}` }} />
            </Layer>
        ),
    },
    {
        id: 'minimal',
        label: 'Minimal Slate',
        desc: 'Clean corporate monochrome',
        dark: false,
        fonts: { title: FONT.sans, name: FONT.sans, body: FONT.sans },
        seal: SEALS.slate,
        background: '#ffffff',
        colors: { academy: '#475569', title: '#0f172a', presentation: '#64748b', recipient: '#0f172a', achievement: '#475569', course: '#1e293b', honors: '#475569', footer: '#64748b' },
        appearance: { outerBorder: '#0f172a', innerBorder: '#cbd5e1', watermark: '#0f172a', watermarkOpacity: 3, headerIcon: '#0f172a', signature: '#0f172a', signatureLine: '#94a3b8', sealLabel: '#334155' },
        Frame: ({ a }) => (
            <Layer>
                <div style={{ position: 'absolute', inset: 28, border: `1px solid ${a.innerBorder}` }} />
                <div style={{ position: 'absolute', top: 28, left: 28, width: 120, height: 6, background: a.outerBorder }} />
                <div style={{ position: 'absolute', bottom: 28, right: 28, width: 120, height: 6, background: a.outerBorder }} />
            </Layer>
        ),
    },
    {
        id: 'royal',
        label: 'Royal Navy & Gold',
        desc: 'Midnight navy with gilded filigree',
        isNew: true,
        dark: true,
        fonts: { title: FONT.serif, name: FONT.script, body: FONT.serif },
        seal: SEALS.royal,
        background: 'radial-gradient(ellipse at center, #13285a 0%, #0b1a3a 55%, #060f24 100%)',
        colors: { academy: '#e6c66a', title: '#f5e6b8', presentation: '#cbd5e1', recipient: '#f5e6b8', achievement: '#cbd5e1', course: '#e6c66a', honors: '#e6c66a', footer: '#a3a3a3' },
        appearance: { outerBorder: '#c9a227', innerBorder: '#e6c66a', watermark: '#e6c66a', watermarkOpacity: 5, headerIcon: '#e6c66a', signature: '#f8fafc', signatureLine: '#8a6a12', sealLabel: '#e6c66a' },
        Frame: ({ a }) => (
            <Layer>
                <div style={{ position: 'absolute', inset: 18, border: `3px solid ${a.outerBorder}` }} />
                <div style={{ position: 'absolute', inset: 26, border: `1px solid ${a.innerBorder}`, opacity: 0.7 }} />
                {corners(a.innerBorder, 34, { size: 60 })}
                <div style={{ position: 'absolute', top: 18, left: '50%', transform: 'translate(-50%, -50%) rotate(45deg)', width: 16, height: 16, background: a.outerBorder }} />
                <div style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translate(-50%, 50%) rotate(45deg)', width: 16, height: 16, background: a.outerBorder }} />
            </Layer>
        ),
    },
    {
        id: 'modern',
        label: 'Modern Split',
        desc: 'Bold brand sidebar, clean layout',
        isNew: true,
        dark: false,
        fonts: { title: FONT.sans, name: FONT.sans, body: FONT.sans },
        seal: SEALS.modern,
        contentInset: { left: 0.31, right: 0.05 },
        positions: { headerLogo: { x: 15, y: 18 }, watermarkLogo: { x: 66, y: 52 }, logoSeal: { x: 15, y: 70 }, sig1: { x: 48, y: 78 }, sig2: { x: 84, y: 78 } },
        background: '#ffffff',
        colors: { academy: '#0052FE', title: '#0f172a', presentation: '#64748b', recipient: '#0f172a', achievement: '#475569', course: '#0052FE', honors: '#0891b2', footer: '#64748b' },
        appearance: { outerBorder: '#0052FE', innerBorder: '#06b6d4', watermark: '#0052FE', watermarkOpacity: 4, headerIcon: '#ffffff', signature: '#0f172a', signatureLine: '#cbd5e1', sealLabel: '#ffffff' },
        Frame: ({ a }) => (
            <Layer>
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '29%', overflow: 'hidden', background: `linear-gradient(165deg, ${a.outerBorder} 0%, #1e3a8a 55%, ${a.innerBorder} 140%)` }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.07) 0 2px, transparent 2px 18px)' }} />
                    <div style={{ position: 'absolute', right: -40, top: '38%', width: 140, height: 140, borderRadius: '50%', background: a.innerBorder, opacity: 0.3, filter: 'blur(36px)' }} />
                </div>
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: '29%', width: 6, background: a.innerBorder }} />
                <div style={{ position: 'absolute', top: 30, right: 30, bottom: 30, left: 'calc(29% + 30px)', border: '1px solid #e2e8f0' }} />
            </Layer>
        ),
    },
    {
        id: 'crimson',
        label: 'Crimson Heritage',
        desc: 'Ivory with burgundy guilloche',
        isNew: true,
        dark: false,
        fonts: { title: FONT.serif, name: FONT.script, body: FONT.serif },
        seal: SEALS.crimson,
        background: 'radial-gradient(ellipse at center, #fffdf9 0%, #fbf4ec 70%, #f3e6d6 100%)',
        colors: { academy: '#881337', title: '#7f1d1d', presentation: '#78716c', recipient: '#4c0519', achievement: '#57534e', course: '#9f1239', honors: '#b45309', footer: '#7f1d1d' },
        appearance: { outerBorder: '#881337', innerBorder: '#c9a227', watermark: '#9f1239', watermarkOpacity: 5, headerIcon: '#9f1239', signature: '#1c1917', signatureLine: '#a8a29e', sealLabel: '#7f1d1d' },
        Frame: ({ a }) => (
            <Layer>
                <div
                    style={{
                        position: 'absolute',
                        inset: 14,
                        border: '18px solid transparent',
                        borderImage: `repeating-linear-gradient(-45deg, ${a.outerBorder} 0 5px, #b4234a 5px 7px, ${a.outerBorder} 7px 12px) 18`,
                    }}
                />
                <div style={{ position: 'absolute', inset: 40, border: `2px solid ${a.innerBorder}` }} />
                <div style={{ position: 'absolute', inset: 46, border: `0.75px solid ${a.innerBorder}` }} />
            </Layer>
        ),
    },
    {
        id: 'aurora',
        label: 'Aurora Gradient',
        desc: 'Soft violet glow, modern glass',
        isNew: true,
        dark: false,
        fonts: { title: FONT.sans, name: FONT.serif, body: FONT.sans },
        seal: SEALS.violet,
        background: 'radial-gradient(circle at 8% 12%, rgba(139,92,246,0.35), transparent 38%), radial-gradient(circle at 95% 18%, rgba(236,72,153,0.22), transparent 35%), radial-gradient(circle at 85% 95%, rgba(59,130,246,0.3), transparent 40%), radial-gradient(circle at 10% 95%, rgba(34,211,238,0.22), transparent 35%), #faf9ff',
        colors: { academy: '#7c3aed', title: '#4c1d95', presentation: '#6b7280', recipient: '#1e1b4b', achievement: '#4b5563', course: '#6d28d9', honors: '#db2777', footer: '#6b7280' },
        appearance: { outerBorder: '#8b5cf6', innerBorder: '#ffffff', watermark: '#7c3aed', watermarkOpacity: 4, headerIcon: '#7c3aed', signature: '#1e1b4b', signatureLine: '#c4b5fd', sealLabel: '#5b21b6' },
        Frame: ({ a }) => (
            <Layer>
                <div style={{ position: 'absolute', inset: 26, borderRadius: 28, border: `1.5px solid ${a.innerBorder}`, background: 'rgba(255,255,255,0.55)', boxShadow: '0 20px 60px rgba(76,29,149,0.12)' }} />
                <div style={{ position: 'absolute', inset: 26, borderRadius: 28, padding: 2, background: `linear-gradient(135deg, ${a.outerBorder}, #ec4899, #3b82f6)`, WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />
            </Layer>
        ),
    },
    {
        id: 'blueprint',
        label: 'Blueprint Tech',
        desc: 'Engineering grid on cobalt',
        isNew: true,
        dark: true,
        fonts: { title: FONT.mono, name: FONT.sans, body: FONT.sans },
        seal: SEALS.blueprint,
        background: 'linear-gradient(160deg, #0c4a8a 0%, #0b3a75 60%, #082c5a 100%)',
        colors: { academy: '#bae6fd', title: '#ffffff', presentation: '#bae6fd', recipient: '#ffffff', achievement: '#e0f2fe', course: '#7dd3fc', honors: '#bae6fd', footer: '#93c5fd' },
        appearance: { outerBorder: '#e0f2fe', innerBorder: '#7dd3fc', watermark: '#e0f2fe', watermarkOpacity: 5, headerIcon: '#e0f2fe', signature: '#ffffff', signatureLine: '#7dd3fc', sealLabel: '#e0f2fe' },
        Frame: ({ a }) => (
            <Layer>
                <Layer style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '20px 20px, 20px 20px, 100px 100px, 100px 100px' }} />
                <div style={{ position: 'absolute', inset: 24, border: `2px solid ${a.outerBorder}` }} />
                <div style={{ position: 'absolute', inset: 32, border: `1px dashed ${a.innerBorder}`, opacity: 0.8 }} />
                {[{ top: 24, left: 24 }, { top: 24, right: 24 }, { bottom: 24, right: 24 }, { bottom: 24, left: 24 }].map((pos, i) => (
                    <svg key={i} width="40" height="40" viewBox="0 0 40 40" style={{ position: 'absolute', ...pos, transform: `translate(${pos.left !== undefined ? '-50%' : '50%'}, ${pos.top !== undefined ? '-50%' : '50%'})` }}>
                        <circle cx="20" cy="20" r="9" fill="none" stroke={a.outerBorder} strokeWidth="1.5" />
                        <path d="M20 4v32M4 20h32" stroke={a.outerBorder} strokeWidth="1.5" />
                    </svg>
                ))}
            </Layer>
        ),
    },
    {
        id: 'custom_bg',
        label: 'Custom Upload',
        desc: 'Your own certificate artwork',
        dark: false,
        fonts: { title: FONT.serif, name: FONT.serif, body: FONT.sans },
        seal: SEALS.slate,
        background: '#ffffff',
        colors: { academy: '#334155', title: '#0f172a', presentation: '#64748b', recipient: '#0f172a', achievement: '#475569', course: '#1e293b', honors: '#475569', footer: '#334155' },
        appearance: { outerBorder: '#0f172a', innerBorder: '#cbd5e1', watermark: '#0f172a', watermarkOpacity: 0, headerIcon: '#0f172a', signature: '#0f172a', signatureLine: '#64748b', sealLabel: '#334155' },
        Frame: () => null,
    },
];

export const DEFAULT_POSITIONS = {
    headerLogo: { x: 50, y: 11 },
    watermarkLogo: { x: 50, y: 52 },
    logoSeal: { x: 50, y: 78 },
    sig1: { x: 22, y: 78 },
    sig2: { x: 78, y: 78 },
};

export const getTemplate = (id) =>
    CERTIFICATE_TEMPLATES.find((t) => t.id === id) || CERTIFICATE_TEMPLATES[0];
