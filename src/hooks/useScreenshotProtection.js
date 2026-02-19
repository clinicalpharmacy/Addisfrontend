import { useState, useEffect, useRef } from 'react';

/**
 * useScreenshotProtection — Maximum browser-level protection
 *
 * Techniques used:
 *  1. CSS-class instant hide (<html> class toggle — fastest possible DOM change)
 *  2. Opaque white shield overlay (content appears blank in screenshot frame)
 *  3. 50ms focus-polling interval (catches focus loss that events miss)
 *  4. Win/Meta/Shift/Alt keydown instant hide (intercepts before OS acts)
 *  5. visibilitychange + pagehide (tab/app switch)
 *  6. window blur (app-switch blurs + hides)
 *  7. mouseleave on document (mouse leaving window = suspicious)
 *  8. copy/cut/contextmenu block
 *  9. @media print block
 * 10. user-select: none + touch-callout: none
 * 11. Mobile: multi-touch (3+ fingers) instant hide
 * 12. Mobile: resize-flash detection (iOS screenshot flash)
 * 13. Mobile: deviceorientation tilt warning
 */
const useScreenshotProtection = (isEnabled = true) => {
    const [protectionMsg, setProtectionMsg] = useState('');
    const msgTimeoutRef = useRef(null);
    const intervalRef = useRef(null);
    const resizeTimerRef = useRef(null);
    const prevSizeRef = useRef({ w: window.innerWidth, h: window.innerHeight });

    useEffect(() => {
        if (!isEnabled) {
            cleanupAll();
            return;
        }

        // ── Inject CSS for instant class-based hiding ─────────────────────
        const style = document.createElement('style');
        style.id = 'kb-protection-styles';
        style.innerHTML = `
            html.kb-screen-blocked *,
            html.kb-screen-blocked *::before,
            html.kb-screen-blocked *::after {
                visibility: hidden !important;
                opacity: 0 !important;
            }
            .kb-select-none,
            .kb-select-none * {
                user-select: none !important;
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                -webkit-touch-callout: none !important;
                -webkit-user-drag: none !important;
            }
            img, video {
                pointer-events: none !important;
                -webkit-user-drag: none !important;
            }
            @media print {
                html, body {
                    display: none !important;
                    visibility: hidden !important;
                }
            }
            #kb-shield-overlay {
                position: fixed;
                inset: 0;
                z-index: 2147483647;
                background: #ffffff;
                display: none;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                gap: 12px;
            }
            html.kb-screen-blocked #kb-shield-overlay {
                display: flex !important;
            }
        `;
        document.head.appendChild(style);
        document.body.classList.add('kb-select-none');

        // ── Inject opaque shield overlay ──────────────────────────────────
        const existingShield = document.getElementById('kb-shield-overlay');
        if (existingShield) existingShield.remove();

        const shield = document.createElement('div');
        shield.id = 'kb-shield-overlay';
        shield.setAttribute('aria-hidden', 'true');
        shield.innerHTML = `
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <p style="margin:0;color:#94a3b8;font-size:14px;font-family:sans-serif;font-weight:600;letter-spacing:1px;">CONTENT PROTECTED</p>
        `;
        document.body.appendChild(shield);

        // ── Helpers ───────────────────────────────────────────────────────
        const showMessage = (msg) => {
            setProtectionMsg(msg);
            clearTimeout(msgTimeoutRef.current);
            msgTimeoutRef.current = setTimeout(() => setProtectionMsg(''), 4000);
        };

        const hideContent = () => {
            document.documentElement.classList.add('kb-screen-blocked');
        };

        const showContent = () => {
            requestAnimationFrame(() => {
                document.documentElement.classList.remove('kb-screen-blocked');
            });
        };

        // ── 1. Continuous focus polling every 50ms ────────────────────────
        intervalRef.current = setInterval(() => {
            if (!document.hasFocus() || document.hidden) {
                hideContent();
            } else {
                showContent();
            }
        }, 50);

        // ── 2. Keyboard: instant hide on modifier / screenshot keys ───────
        const handleKeyDown = (e) => {
            const activeTag = document.activeElement?.tagName || '';
            const isInput = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

            if (e.key === 'Meta' || e.key === 'OS' || e.key === 'Super') {
                hideContent();
                return;
            }

            if (!isInput && (e.key === 'Shift' || e.key === 'Alt' || e.key === 'Control')) {
                hideContent();
                return;
            }

            const blocked =
                e.key === 'PrintScreen' ||
                (e.ctrlKey && ['p', 'P', 'c', 'C', 'x', 'X', 's', 'S'].includes(e.key)) ||
                (e.ctrlKey && e.shiftKey && ['i', 'I', 'j', 'J', 'u', 'U', 's', 'S'].includes(e.key)) ||
                (e.metaKey && ['s', 'S', 'c', 'C', 'p', 'P', '4', '5', '6'].includes(e.key));

            if (blocked) {
                e.preventDefault();
                e.stopPropagation();
                hideContent();
                showMessage('Screenshots and copying are disabled to protect sensitive content.');
                setTimeout(showContent, 1500);
            }
        };

        const handleKeyUp = (e) => {
            if (['Meta', 'OS', 'Super', 'Alt', 'Shift', 'Control', 'PrintScreen'].includes(e.key)) {
                setTimeout(showContent, 200);
            }
        };

        // ── 3. Context menu ───────────────────────────────────────────────
        const handleContextMenu = (e) => {
            e.preventDefault();
            showMessage('Right-click is disabled for content protection.');
        };

        // ── 4. Copy / Cut ─────────────────────────────────────────────────
        const handleCopyCut = (e) => {
            e.preventDefault();
            showMessage('Copying is disabled to protect sensitive content.');
        };

        // ── 5. Window blur / focus ────────────────────────────────────────
        const handleBlur = () => hideContent();
        const handleFocus = () => showContent();

        // ── 6. Visibility change ──────────────────────────────────────────
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                hideContent();
            } else {
                showContent();
            }
        };

        // ── 7. iOS Safari pagehide ────────────────────────────────────────
        const handlePageHide = () => hideContent();
        const handlePageShow = () => showContent();

        // ── 8. Mouse leaving browser window ──────────────────────────────
        const handleMouseLeave = (e) => {
            if (!e.relatedTarget) hideContent();
        };
        const handleMouseEnter = () => showContent();

        // ── 9. Mobile: multi-touch ────────────────────────────────────────
        const handleTouchStart = (e) => {
            if (e.touches.length >= 3) {
                hideContent();
                showMessage('Screenshot attempt detected. Content protected.');
                setTimeout(showContent, 1500);
            }
        };

        // ── 10. Mobile: iOS resize flash ──────────────────────────────────
        const handleResize = () => {
            const newW = window.innerWidth;
            const newH = window.innerHeight;
            const prev = prevSizeRef.current;
            const deltaW = Math.abs(newW - prev.w);
            const deltaH = Math.abs(newH - prev.h);
            if (deltaW < 5 && deltaH < 5 && (deltaW > 0 || deltaH > 0)) {
                hideContent();
                clearTimeout(resizeTimerRef.current);
                resizeTimerRef.current = setTimeout(showContent, 1000);
            }
            prevSizeRef.current = { w: newW, h: newH };
        };

        // ── 11. Mobile: orientation tilt warning ──────────────────────────
        let lastGamma = null;
        const handleOrientation = (e) => {
            const gamma = e.gamma;
            if (lastGamma !== null && Math.abs(gamma - lastGamma) > 25) {
                showMessage('⚠️ Photographing this screen is not permitted.');
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
        document.documentElement.addEventListener('mouseleave', handleMouseLeave);
        document.documentElement.addEventListener('mouseenter', handleMouseEnter);
        window.addEventListener('deviceorientation', handleOrientation);

        // ── Cleanup ───────────────────────────────────────────────────────
        return () => {
            clearInterval(intervalRef.current);
            clearTimeout(msgTimeoutRef.current);
            clearTimeout(resizeTimerRef.current);

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
            document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
            document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
            window.removeEventListener('deviceorientation', handleOrientation);

            cleanupAll();
        };
    }, [isEnabled]);

    return protectionMsg;
};

function cleanupAll() {
    document.documentElement.classList.remove('kb-screen-blocked');
    document.body.classList.remove('kb-select-none');
    const s = document.getElementById('kb-protection-styles');
    if (s) s.remove();
    const shield = document.getElementById('kb-shield-overlay');
    if (shield) shield.remove();
}

export default useScreenshotProtection;
