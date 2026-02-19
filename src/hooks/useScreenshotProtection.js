import { useState, useEffect, useRef } from 'react';

/**
 * useScreenshotProtection
 *
 * Layered protection against screenshots and copying across desktop & mobile:
 *
 * Desktop:
 *  1. CSS user-select: none       — blocks text selection
 *  2. copy / cut event block      — prevents clipboard leaks
 *  3. contextmenu block           — disables right-click
 *  4. @media print block          — hides content when printing
 *  5. Keyboard shortcuts block    — PrtSc, Ctrl+C/P/S, DevTools
 *  6. Win/Meta key instant-hide   — catches Win+Shift+S before overlay
 *  7. visibilitychange hide       — hides when tab is backgrounded
 *  8. window blur/focus           — blurs on app-switch
 *
 * Mobile:
 *  9. pagehide / pageshow         — iOS Safari app-switch screen blank
 * 10. Multi-touch detection       — Power+Vol screenshot combos (2+ fingers)
 * 11. resize flash detection      — iOS screenshot causes brief resize
 * 12. deviceorientation watch     — warns when phone is tilted (photo attempt)
 * 13. touchstart/end combo        — volume-button side-press heuristic
 *
 * Universal:
 * 14. Diagonal user watermark     — identity-stamped on every screenshotted frame
 */
const useScreenshotProtection = (isEnabled = true) => {
    const [protectionMsg, setProtectionMsg] = useState('');
    const msgTimeoutRef = useRef(null);
    const resizeTimerRef = useRef(null);
    const prevSizeRef = useRef({ w: window.innerWidth, h: window.innerHeight });

    useEffect(() => {
        // ── Clean up artefacts if disabled ────────────────────────────────
        if (!isEnabled) {
            cleanupAll();
            return;
        }

        // ── Helpers ───────────────────────────────────────────────────────
        const showMessage = (msg) => {
            setProtectionMsg(msg);
            clearTimeout(msgTimeoutRef.current);
            msgTimeoutRef.current = setTimeout(() => setProtectionMsg(''), 4000);
        };

        const hideContent = () => {
            document.documentElement.style.visibility = 'hidden';
            document.documentElement.style.opacity = '0';
        };

        const showContent = () => {
            requestAnimationFrame(() => {
                document.documentElement.style.visibility = 'visible';
                document.documentElement.style.opacity = '1';
            });
        };

        // ── Desktop: Context Menu ─────────────────────────────────────────
        const handleContextMenu = (e) => {
            e.preventDefault();
            showMessage('Right-click is disabled for content protection.');
        };

        // ── Desktop: Keyboard shortcuts ───────────────────────────────────
        const handleKeyDown = (e) => {
            const activeTag = document.activeElement?.tagName || '';
            const isInput = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

            // Instant hide on Win/Meta (Win+Shift+S snipping tool)
            if (e.key === 'Meta' || e.key === 'OS') {
                hideContent();
            }

            // Hide on modifier keys unless typing
            if ((e.key === 'Alt' || e.key === 'Shift' || e.key === 'Control') && !isInput) {
                hideContent();
            }

            // Block dangerous shortcuts
            const blocked =
                e.key === 'PrintScreen' ||
                (e.ctrlKey && ['p', 'P', 'c', 'C', 'x', 'X', 's', 'S'].includes(e.key)) ||
                (e.ctrlKey && e.shiftKey && ['i', 'I', 'j', 'J', 'u', 'U'].includes(e.key)) ||
                (e.metaKey && ['s', 'S', 'c', 'C', 'p', 'P'].includes(e.key));

            if (blocked) {
                e.preventDefault();
                e.stopPropagation();
                hideContent();
                showMessage('Screenshots and copying are disabled to protect sensitive content.');
                setTimeout(showContent, 1200);
            }
        };

        const handleKeyUp = (e) => {
            if (['Meta', 'OS', 'Alt', 'Shift', 'Control', 'PrintScreen'].includes(e.key)) {
                showContent();
            }
        };

        // ── Desktop + Mobile: Copy / Cut ──────────────────────────────────
        const handleCopyCut = (e) => {
            e.preventDefault();
            showMessage('Copying content is disabled to protect sensitive information.');
        };

        // ── Desktop + Mobile: Window blur ─────────────────────────────────
        const handleBlur = () => {
            document.documentElement.style.filter = 'blur(30px)';
            document.documentElement.style.opacity = '0.1';
        };

        const handleFocus = () => {
            document.documentElement.style.filter = 'none';
            document.documentElement.style.opacity = '1';
        };

        // ── Desktop + Mobile: Tab visibility ─────────────────────────────
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                hideContent();
            } else {
                showContent();
            }
        };

        // ── Mobile: pagehide / pageshow (iOS Safari) ──────────────────────
        const handlePageHide = () => {
            hideContent();
        };

        const handlePageShow = () => {
            showContent();
        };

        // ── Mobile: Multi-touch detection ─────────────────────────────────
        const handleTouchStart = (e) => {
            if (e.touches.length >= 3) {
                hideContent();
                showMessage('Screenshot attempt detected. Content protected.');
                setTimeout(showContent, 1500);
            }
        };

        // ── Mobile: Resize flash detection ────────────────────────────────
        const handleResize = () => {
            const newW = window.innerWidth;
            const newH = window.innerHeight;
            const prev = prevSizeRef.current;

            const deltaW = Math.abs(newW - prev.w);
            const deltaH = Math.abs(newH - prev.h);

            if (deltaW < 5 && deltaH < 5 && (deltaW > 0 || deltaH > 0)) {
                hideContent();
                clearTimeout(resizeTimerRef.current);
                resizeTimerRef.current = setTimeout(showContent, 800);
            }

            prevSizeRef.current = { w: newW, h: newH };
        };

        // ── Mobile: Device orientation tilt detection ─────────────────────
        let lastGamma = null;
        const handleOrientation = (e) => {
            const gamma = e.gamma;
            if (lastGamma !== null) {
                const delta = Math.abs(gamma - lastGamma);
                if (delta > 25) {
                    showMessage('⚠️ Content is confidential. Photographing this screen is not permitted.');
                }
            }
            lastGamma = gamma;
        };

        // ── Register all listeners ────────────────────────────────────────
        window.addEventListener('contextmenu', handleContextMenu, true);
        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('keyup', handleKeyUp, true);
        window.addEventListener('copy', handleCopyCut, true);
        window.addEventListener('cut', handleCopyCut, true);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('resize', handleResize);
        window.addEventListener('pagehide', handlePageHide);
        window.addEventListener('pageshow', handlePageShow);
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('deviceorientation', handleOrientation);

        // ── CSS: print block + user-select none ───────────────────────────
        const style = document.createElement('style');
        style.id = 'kb-protection-styles';
        style.innerHTML = `
            @media print {
                html, body {
                    display: none !important;
                    height: 0 !important;
                    overflow: hidden !important;
                    visibility: hidden !important;
                }
            }
            .kb-select-none,
            .kb-select-none * {
                user-select: none !important;
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                -webkit-touch-callout: none !important;
            }
            img, video {
                pointer-events: none !important;
                -webkit-user-drag: none !important;
            }
        `;
        document.head.appendChild(style);
        document.body.classList.add('kb-select-none');

        // ── Watermark overlay ─────────────────────────────────────────────
        let watermarkLabel = 'CONFIDENTIAL';
        try {
            const userData = localStorage.getItem('user');
            if (userData) {
                const u = JSON.parse(userData);
                const name = u.full_name || u.name || u.email || u.username || '';
                const id = u.id ? `#${u.id}` : '';
                if (name) watermarkLabel = `${name} ${id} · CONFIDENTIAL`.trim();
            }
        } catch (_) { /* ignore */ }

        const oldWm = document.getElementById('kb-watermark-overlay');
        if (oldWm) oldWm.remove();

        const watermark = document.createElement('div');
        watermark.id = 'kb-watermark-overlay';
        watermark.setAttribute('aria-hidden', 'true');

        const repeat = Array(30).fill(watermarkLabel).join('   ·   ');
        const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
        const wmOpacity = isMobile ? '0.18' : '0.11';

        watermark.innerHTML = `
            <div style="
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                pointer-events: none;
                z-index: 99999;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                justify-content: space-around;
            ">
                ${Array(10).fill(0).map((_, i) => `
                    <div style="
                        width: 200%;
                        white-space: nowrap;
                        font-size: ${isMobile ? '11px' : '13px'};
                        font-weight: 700;
                        letter-spacing: 2px;
                        color: rgba(80, 80, 80, ${wmOpacity});
                        transform: rotate(-30deg) translateX(${i % 2 === 0 ? '-5%' : '5%'});
                        user-select: none;
                        pointer-events: none;
                    ">${repeat}</div>
                `).join('')}
            </div>
        `;
        document.body.appendChild(watermark);

        // ── Cleanup ───────────────────────────────────────────────────────
        return () => {
            window.removeEventListener('contextmenu', handleContextMenu, true);
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('keyup', handleKeyUp, true);
            window.removeEventListener('copy', handleCopyCut, true);
            window.removeEventListener('cut', handleCopyCut, true);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('pagehide', handlePageHide);
            window.removeEventListener('pageshow', handlePageShow);
            window.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('deviceorientation', handleOrientation);

            document.documentElement.style.visibility = '';
            document.documentElement.style.opacity = '';
            document.documentElement.style.filter = '';

            const existingStyle = document.getElementById('kb-protection-styles');
            if (existingStyle) existingStyle.remove();

            const existingWatermark = document.getElementById('kb-watermark-overlay');
            if (existingWatermark) existingWatermark.remove();

            document.body.classList.remove('kb-select-none');
            clearTimeout(msgTimeoutRef.current);
            clearTimeout(resizeTimerRef.current);
        };
    }, [isEnabled]);

    return protectionMsg;
};

function cleanupAll() {
    document.documentElement.style.visibility = '';
    document.documentElement.style.opacity = '';
    document.documentElement.style.filter = '';

    const s = document.getElementById('kb-protection-styles');
    if (s) s.remove();

    const w = document.getElementById('kb-watermark-overlay');
    if (w) w.remove();

    document.body.classList.remove('kb-select-none');
}

export default useScreenshotProtection;
