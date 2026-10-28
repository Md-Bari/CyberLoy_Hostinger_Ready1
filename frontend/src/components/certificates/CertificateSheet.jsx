import React, { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Award, ShieldCheck, Stamp } from 'lucide-react';
import { getTemplate, SEAL_PALETTES } from './certificateTemplates';

// A4 at the CSS reference resolution (96 px per inch). Drawing the sheet at
// this fixed size is what makes the preview, the modal and the printout match.
const PX_PER_MM = 96 / 25.4;
export const A4 = {
    landscape: { w: 297 * PX_PER_MM, h: 210 * PX_PER_MM, css: { width: '297mm', height: '210mm' } },
    portrait: { w: 210 * PX_PER_MM, h: 297 * PX_PER_MM, css: { width: '210mm', height: '297mm' } },
};

const scallopPoints = (cx, cy, outer, inner, points) =>
    Array.from({ length: points * 2 }, (_, i) => {
        const r = i % 2 === 0 ? outer : inner;
        const angle = (Math.PI * i) / points - Math.PI / 2;
        return `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`;
    }).join(' ');

export function Seal({ size, palette, Icon = Award }) {
    return (
        <div style={{ position: 'relative', width: size, height: size * 1.22 }}>
            <svg width={size} height={size * 1.22} viewBox="0 0 120 146" aria-hidden="true">
                <polygon points="40,78 26,142 44,130 56,146 60,86" fill={palette.ribbon} />
                <polygon points="80,78 94,142 76,130 64,146 60,86" fill={palette.ribbonDark} />
                <polygon points={scallopPoints(60, 60, 58, 51, 24)} fill={palette.ring} />
                <circle cx="60" cy="60" r="47" fill={palette.fill} />
                <circle cx="60" cy="60" r="41" fill="none" stroke={palette.ring} strokeWidth="1.5" strokeDasharray="3 3" />
            </svg>
            <Icon
                aria-hidden="true"
                style={{ position: 'absolute', left: '50%', top: size * 0.5, transform: 'translate(-50%, -50%)', width: size * 0.36, height: size * 0.36, color: palette.icon }}
            />
        </div>
    );
}

function Editable({ interactive, as: Tag = 'div', field, onTextChange, style, className, children }) {
    if (!interactive) {
        return <Tag style={style} className={className}>{children}</Tag>;
    }
    return (
        <Tag
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            onBlur={(e) => onTextChange?.(field, e.currentTarget.textContent || '')}
            style={{ ...style, cursor: 'text', outline: 'none' }}
            className={`${className || ''} rounded-sm hover:ring-1 hover:ring-blue-400/50 focus:ring-2 focus:ring-blue-500/60`}
        >
            {children}
        </Tag>
    );
}

function Draggable({ id, x, y, interactive, onDragStart, active, zIndex = 20, style, children, title }) {
    return (
        <div
            onMouseDown={interactive ? (e) => onDragStart?.(id, e) : undefined}
            onTouchStart={interactive ? (e) => onDragStart?.(id, e) : undefined}
            title={interactive ? title : undefined}
            style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: active ? 50 : zIndex,
                cursor: interactive ? 'move' : 'default',
                outline: interactive && active ? '1.5px dashed rgba(59,130,246,0.8)' : 'none',
                outlineOffset: 4,
                borderRadius: 8,
                ...style,
            }}
        >
            {children}
        </div>
    );
}

function Signature({ sig, appearance, blendMode, fallback, fonts }) {
    return (
        <div style={{ width: sig.width, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', pointerEvents: 'none' }}>
            {sig.sigUrl ? (
                <img
                    src={sig.sigUrl}
                    alt=""
                    style={{ height: 56, width: 'auto', maxWidth: '100%', objectFit: 'contain', marginBottom: 2, mixBlendMode: blendMode, filter: sig.invert ? 'invert(1)' : 'none' }}
                />
            ) : (
                <div style={{ color: appearance.signature, fontFamily: '"Great Vibes", "Playfair Display", cursive', fontSize: 30, lineHeight: '56px', height: 56 }}>
                    {sig.sigText || fallback}
                </div>
            )}
            <div style={{ width: '100%', borderTop: `1px solid ${appearance.signatureLine}`, margin: '2px 0 6px' }} />
            <div style={{ color: appearance.signature, fontFamily: fonts.body, fontSize: 13, fontWeight: 700 }}>{sig.name}</div>
            <div style={{ color: appearance.signature, fontFamily: fonts.body, fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.7, marginTop: 2 }}>
                {sig.title}
            </div>
        </div>
    );
}

function CustomItem({ item, blendMode }) {
    if (item.type === 'text') {
        return (
            <span style={{ color: item.color || '#0f172a', fontSize: item.fontSize || 18, fontWeight: item.fontWeight || '700', lineHeight: 1.2, wordBreak: 'break-word' }}>
                {item.text || 'New certificate text'}
            </span>
        );
    }
    if (item.type === 'image' && item.url) {
        return <img src={item.url} alt="" style={{ width: item.width, height: 'auto', maxWidth: '100%', objectFit: 'contain', mixBlendMode: blendMode, filter: item.invert ? 'invert(1)' : 'none' }} />;
    }
    const preset = {
        preset_shield: { Icon: ShieldCheck, palette: SEAL_PALETTES.cyber_badge },
        preset_verified: { Icon: Stamp, palette: SEAL_PALETTES.gold_seal },
        preset_iso: { Icon: Award, palette: SEAL_PALETTES.iso_crest },
    }[item.type] || { Icon: Award, palette: SEAL_PALETTES.iso_crest };
    return <Seal size={item.width} palette={preset.palette} Icon={preset.Icon} />;
}

/**
 * The certificate itself, drawn at a fixed A4 size. All element positions are
 * percentages of the sheet and all sizes are px of the sheet, so scaling the
 * sheet (preview) or printing it at 297x210mm gives the same layout.
 */
export const CertificateSheet = forwardRef(function CertificateSheet(
    {
        templateId = 'gold',
        orientation = 'landscape',
        content,
        colors,
        appearance,
        headerLogo,
        watermarkLogo,
        sig1,
        sig2,
        logoSeal,
        customItems = [],
        customBgImage,
        interactive = false,
        draggingElement,
        selectedItemId,
        onDragStart,
        onTextChange,
    },
    ref,
) {
    const template = getTemplate(templateId);
    const size = A4[orientation] || A4.landscape;
    const isPortrait = orientation === 'portrait';
    const c = { ...template.colors, ...colors };
    const a = { ...template.appearance, ...appearance };
    const { fonts } = template;
    const Frame = template.Frame;
    const inset = template.contentInset || { left: 0.08, right: 0.08 };
    const contentWidth = size.w * (1 - inset.left - inset.right);
    const blend = (mode) => (!mode || mode === 'multiply' ? (template.dark ? 'screen' : 'multiply') : mode);

    const sealPalette = logoSeal?.type && SEAL_PALETTES[logoSeal.type] ? SEAL_PALETTES[logoSeal.type] : template.seal;
    const name = content.recipient || 'Recipient Name';
    const nameSize = (isPortrait ? 52 : 58) * (fonts.name.includes('Great Vibes') ? 1.15 : 0.82) * (name.length > 26 ? 0.78 : 1);
    const courseSize = content.course && content.course.length > 60 ? 20 : 24;

    const background = template.id === 'custom_bg' && customBgImage
        ? { backgroundImage: `url(${customBgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: template.background };

    return (
        <div
            ref={ref}
            className="certificate-sheet"
            style={{
                position: 'relative',
                width: size.w,
                height: size.h,
                overflow: 'hidden',
                userSelect: interactive ? 'none' : 'auto',
                ...background,
            }}
        >
            <Frame a={a} />

            {watermarkLogo?.show && (
                <Draggable id="watermark-logo" x={watermarkLogo.x} y={watermarkLogo.y} zIndex={1} interactive={interactive} onDragStart={onDragStart} active={draggingElement === 'watermark-logo'} title="Drag to move watermark" style={{ opacity: a.watermarkOpacity / 100 }}>
                    {watermarkLogo.type === 'custom' && watermarkLogo.customUrl ? (
                        <img src={watermarkLogo.customUrl} alt="" style={{ width: watermarkLogo.size, height: watermarkLogo.size, objectFit: 'contain', pointerEvents: 'none' }} />
                    ) : watermarkLogo.type === 'award' ? (
                        <Award style={{ color: a.watermark, width: watermarkLogo.size, height: watermarkLogo.size }} strokeWidth={1} />
                    ) : (
                        <ShieldCheck style={{ color: a.watermark, width: watermarkLogo.size, height: watermarkLogo.size }} strokeWidth={1} />
                    )}
                </Draggable>
            )}

            {/* Main text block */}
            <div
                style={{
                    position: 'absolute',
                    left: size.w * inset.left,
                    width: contentWidth,
                    top: size.h * (isPortrait ? 0.22 : 0.17),
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                }}
            >
                <Editable interactive={interactive} field="academy" onTextChange={onTextChange} style={{ color: c.academy, fontFamily: fonts.body, fontSize: 13, fontWeight: 700, letterSpacing: '0.32em', textTransform: 'uppercase' }}>
                    {content.academy}
                </Editable>
                <Editable interactive={interactive} as="h2" field="title" onTextChange={onTextChange} style={{ margin: '14px 0 0', color: c.title, fontFamily: fonts.title, fontSize: fonts.title.includes('Playfair') ? (isPortrait ? 40 : 46) : (isPortrait ? 36 : 42), fontWeight: 800, lineHeight: 1.1, letterSpacing: fonts.title === fonts.serif ? '0.02em' : '-0.01em', textTransform: fonts.title.includes('Playfair') ? 'none' : 'uppercase', maxWidth: contentWidth - 40 }}>
                    {content.title}
                </Editable>
                <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 12px' }}>
                    <span style={{ width: 60, height: 1, background: a.outerBorder, opacity: 0.55 }} />
                    <span style={{ width: 7, height: 7, transform: 'rotate(45deg)', background: a.outerBorder }} />
                    <span style={{ width: 60, height: 1, background: a.outerBorder, opacity: 0.55 }} />
                </div>
                <Editable interactive={interactive} as="p" field="presentation" onTextChange={onTextChange} style={{ margin: 0, color: c.presentation, fontFamily: fonts.body, fontSize: 12, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                    {content.presentation}
                </Editable>

                <Editable interactive={interactive} field="recipient" onTextChange={onTextChange} style={{ marginTop: isPortrait ? 44 : 18, color: c.recipient, fontFamily: fonts.name, fontSize: nameSize, fontWeight: fonts.name.includes('Great Vibes') ? 400 : 800, lineHeight: 1.15, maxWidth: contentWidth - 20, letterSpacing: fonts.name.includes('Great Vibes') ? 0 : '-0.02em' }}>
                    {name}
                </Editable>
                <div aria-hidden="true" style={{ width: Math.min(420, contentWidth * 0.6), height: 2, marginTop: 6, background: `linear-gradient(90deg, transparent, ${a.outerBorder}, transparent)` }} />

                <Editable interactive={interactive} as="p" field="achievement" onTextChange={onTextChange} style={{ margin: `${isPortrait ? 36 : 16}px 0 0`, maxWidth: Math.min(560, contentWidth - 40), color: c.achievement, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 1.55 }}>
                    {content.achievement}
                </Editable>
                <Editable interactive={interactive} field="course" onTextChange={onTextChange} style={{ marginTop: isPortrait ? 14 : 8, maxWidth: contentWidth - 60, color: c.course, fontFamily: fonts.title, fontSize: courseSize, fontWeight: 700, lineHeight: 1.25 }}>
                    {content.course}
                </Editable>
                {content.honors ? (
                    <Editable interactive={interactive} field="honors" onTextChange={onTextChange} style={{ marginTop: 6, color: c.honors, fontFamily: fonts.body, fontSize: 12.5, fontStyle: 'italic', fontWeight: 500 }}>
                        {content.honors}
                    </Editable>
                ) : null}
            </div>

            {headerLogo?.show && (
                <Draggable id="header-logo" x={headerLogo.x} y={headerLogo.y} interactive={interactive} onDragStart={onDragStart} active={draggingElement === 'header-logo'} title="Drag to move header logo">
                    {headerLogo.type === 'award' ? (
                        <Award style={{ color: a.headerIcon, width: headerLogo.size, height: headerLogo.size }} />
                    ) : (
                        <ShieldCheck style={{ color: a.headerIcon, width: headerLogo.size, height: headerLogo.size }} />
                    )}
                </Draggable>
            )}

            {customItems.filter((item) => item.show).map((item) => (
                <Draggable
                    key={item.id}
                    id={item.id}
                    x={item.x}
                    y={item.y}
                    zIndex={30}
                    interactive={interactive}
                    onDragStart={onDragStart}
                    active={draggingElement === item.id || selectedItemId === item.id}
                    style={{ width: item.width, opacity: (item.opacity ?? 100) / 100 }}
                >
                    <div style={{ pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined }}>
                        <CustomItem item={item} blendMode={blend(item.blendMode)} />
                    </div>
                </Draggable>
            ))}

            {sig1?.show && (
                <Draggable id="sig1" x={sig1.x} y={sig1.y} interactive={interactive} onDragStart={onDragStart} active={draggingElement === 'sig1'} title="Drag to move signature">
                    <Signature sig={sig1} appearance={a} blendMode={blend(sig1.blendMode)} fallback="M. Vance" fonts={fonts} />
                </Draggable>
            )}

            {logoSeal?.show && (
                <Draggable id="logo" x={logoSeal.x} y={logoSeal.y} interactive={interactive} onDragStart={onDragStart} active={draggingElement === 'logo'} title="Drag to move seal">
                    <div style={{ width: Math.max(logoSeal.size, 120), display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', pointerEvents: 'none' }}>
                        {logoSeal.type === 'custom' && logoSeal.customUrl ? (
                            <img src={logoSeal.customUrl} alt="" style={{ width: logoSeal.size, height: logoSeal.size, objectFit: 'contain', mixBlendMode: blend(logoSeal.blendMode) }} />
                        ) : (
                            <Seal size={logoSeal.size} palette={sealPalette} Icon={logoSeal.type === 'cyber_badge' ? ShieldCheck : Award} />
                        )}
                        {logoSeal.label ? (
                            <div style={{ marginTop: 4, color: a.sealLabel, fontFamily: fonts.body, fontSize: 8, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                                {logoSeal.label}
                            </div>
                        ) : null}
                    </div>
                </Draggable>
            )}

            {sig2?.show && (
                <Draggable id="sig2" x={sig2.x} y={sig2.y} interactive={interactive} onDragStart={onDragStart} active={draggingElement === 'sig2'} title="Drag to move signature">
                    <Signature sig={sig2} appearance={a} blendMode={blend(sig2.blendMode)} fallback="S. Jenkins" fonts={fonts} />
                </Draggable>
            )}

            {/* Footer metadata */}
            <div
                style={{
                    position: 'absolute',
                    left: size.w * inset.left + 20,
                    right: size.w * Math.max(inset.right, 0.05) + 20,
                    bottom: 62,
                    zIndex: 10,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    color: c.footer,
                    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                    fontSize: 9.5,
                    lineHeight: 1.6,
                }}
            >
                <div>
                    <div style={{ fontWeight: 700 }}>Certificate ID: {content.certCode}</div>
                    <div>Verification: {content.verCode}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700 }}>Issued: {content.issueDate}</div>
                    <Editable interactive={interactive} field="verificationSeal" onTextChange={onTextChange}>{content.verificationSeal}</Editable>
                </div>
            </div>
        </div>
    );
});

/** Scales a fixed-size sheet down to the available width without reflowing it. */
export function ScaledSheet({ orientation = 'landscape', maxHeight, className = '', children }) {
    const wrapRef = useRef(null);
    const [scale, setScale] = useState(0);
    const size = A4[orientation] || A4.landscape;

    useLayoutEffect(() => {
        const node = wrapRef.current;
        if (!node) return undefined;
        const update = () => {
            const byWidth = node.clientWidth / size.w;
            const byHeight = maxHeight ? maxHeight / size.h : Infinity;
            setScale(Math.min(byWidth, byHeight, 1));
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(node);
        return () => observer.disconnect();
    }, [size.w, size.h, maxHeight]);

    return (
        <div ref={wrapRef} className={`w-full ${className}`}>
            <div style={{ width: size.w * scale, height: size.h * scale, margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
                <div style={{ width: size.w, height: size.h, transform: `scale(${scale})`, transformOrigin: 'top left', visibility: scale ? 'visible' : 'hidden' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}

/**
 * Prints a certificate on its own: renders an unscaled copy into <body>, sets
 * the A4 page size for that orientation and hides everything else, so the app
 * layout and the on-screen preview size can never affect the printout.
 */
export function useCertificatePrint() {
    const [job, setJob] = useState(null);

    const print = useCallback((sheetProps) => setJob(sheetProps), []);

    const portal = job
        ? createPortal(<PrintRoot sheetProps={job} onDone={() => setJob(null)} />, document.body)
        : null;

    return { print, printing: Boolean(job), portal };
}

function PrintRoot({ sheetProps, onDone }) {
    const rootRef = useRef(null);
    const onDoneRef = useRef(onDone);
    onDoneRef.current = onDone;
    const orientation = sheetProps.orientation === 'portrait' ? 'portrait' : 'landscape';
    const page = A4[orientation].css;

    // Runs once per print job: wait for fonts and images, print, then unmount.
    useEffect(() => {
        let cancelled = false;
        document.body.classList.add('cert-printing');
        const finish = () => {
            if (!cancelled) onDoneRef.current();
        };
        window.addEventListener('afterprint', finish, { once: true });

        const images = Array.from(rootRef.current?.querySelectorAll('img') || []);
        Promise.all([
            document.fonts?.ready ?? Promise.resolve(),
            ...images.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve())),
        ]).then(() => {
            requestAnimationFrame(() => requestAnimationFrame(() => {
                if (!cancelled) window.print();
            }));
        });

        return () => {
            cancelled = true;
            document.body.classList.remove('cert-printing');
            window.removeEventListener('afterprint', finish);
        };
    }, []);

    return (
        <div id="cert-print-root" ref={rootRef} style={page}>
            <style>{`@page { size: ${page.width} ${page.height}; margin: 0; }`}</style>
            <CertificateSheet {...sheetProps} interactive={false} />
        </div>
    );
}
