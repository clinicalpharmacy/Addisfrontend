import { useState, useEffect } from 'react';

const useScreenshotProtection = (isEnabled = true) => {
    const [protectionMsg, setProtectionMsg] = useState('');

    useEffect(() => {
        if (!isEnabled) {
            // Remove styles if disabled
            const existingStyle = document.getElementById('kb-protection-styles');
            if (existingStyle) {
                existingStyle.remove();
            }
            return;
        }

        let msgTimeout;

        const showMessage = (msg) => {
            setProtectionMsg(msg);
            clearTimeout(msgTimeout);
            msgTimeout = setTimeout(() => {
                setProtectionMsg('');
            }, 3000);
        };

        // Prevent Context Menu
        const handleContextMenu = (e) => {
            e.preventDefault();
            showMessage('Right-click is disabled for content protection.');
        };

        // Prevent Keyboard Shortcuts - AGGRESSIVE APPROACH
        const handleKeyDown = (e) => {
            // IMMEDIATELY hide on ANY modifier key to catch screenshot shortcuts BEFORE they complete
            if (e.key === 'Meta' || e.key === 'OS' || e.key === 'Alt' || e.key === 'Shift' || e.key === 'Control') {
                // Check if user is typing in input field
                const activeTag = document.activeElement?.tagName || '';
                const isInput = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

                // Only allow Shift/Control/Alt if typing
                if (isInput && (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt')) {
                    // Allow normal typing
                } else {
                    // HIDE EVERYTHING INSTANTLY
                    document.documentElement.style.visibility = 'hidden';
                    document.documentElement.style.opacity = '0';
                }
            }

            // Block specific shortcuts
            if (
                e.key === 'PrintScreen' ||
                (e.ctrlKey && e.key === 'p') ||
                (e.ctrlKey && e.key === 'P') ||
                (e.ctrlKey && e.key === 'c') ||
                (e.ctrlKey && e.key === 'C') ||
                (e.ctrlKey && e.key === 'x') ||
                (e.ctrlKey && e.key === 'X') ||
                (e.ctrlKey && e.key === 's') ||
                (e.ctrlKey && e.key === 'S') ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i'))
            ) {
                e.preventDefault();
                e.stopPropagation();
                document.documentElement.style.visibility = 'hidden';
                document.documentElement.style.opacity = '0';
                showMessage('Screenshots and copying are disabled to protect sensitive content.');

                setTimeout(() => {
                    document.documentElement.style.visibility = 'visible';
                    document.documentElement.style.opacity = '1';
                }, 1000);
            }
        };

        // Restore on key release
        const handleKeyUp = (e) => {
            if (['Meta', 'OS', 'Alt', 'Shift', 'Control', 'PrintScreen'].includes(e.key)) {
                // Use requestAnimationFrame to ensure this happens after the screenshot attempt
                requestAnimationFrame(() => {
                    document.documentElement.style.visibility = 'visible';
                    document.documentElement.style.opacity = '1';
                });
            }
        };

        // Prevent Copy/Cut
        const handleCopyCut = (e) => {
            e.preventDefault();
            showMessage('Copying content is disabled.');
        };

        // Hide on window blur (switching apps)
        const handleBlur = () => {
            document.documentElement.style.filter = 'blur(20px)';
            document.documentElement.style.opacity = '0.3';
        };

        const handleFocus = () => {
            document.documentElement.style.filter = 'none';
            document.documentElement.style.opacity = '1';
        };

        // Use WINDOW with CAPTURE phase to intercept events EARLY
        window.addEventListener('contextmenu', handleContextMenu, true);
        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('keyup', handleKeyUp, true);
        window.addEventListener('copy', handleCopyCut, true);
        window.addEventListener('cut', handleCopyCut, true);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);

        // Add protection styles
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
            .select-none {
                user-select: none !important;
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
            }
        `;
        document.head.appendChild(style);
        document.body.classList.add('select-none');

        // Cleanup
        return () => {
            window.removeEventListener('contextmenu', handleContextMenu, true);
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('keyup', handleKeyUp, true);
            window.removeEventListener('copy', handleCopyCut, true);
            window.removeEventListener('cut', handleCopyCut, true);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);

            // Restore all styles
            document.documentElement.style.visibility = '';
            document.documentElement.style.opacity = '';
            document.documentElement.style.filter = '';

            const existingStyle = document.getElementById('kb-protection-styles');
            if (existingStyle) {
                existingStyle.remove();
            }
            document.body.classList.remove('select-none');
            clearTimeout(msgTimeout);
        };
    }, [isEnabled]);

    return protectionMsg;
};

export default useScreenshotProtection;
