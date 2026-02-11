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

        // Prevent Keyboard Shortcuts
        const handleKeyDown = (e) => {
            if (
                e.key === 'PrintScreen' ||
                (e.ctrlKey && (e.key === 'p' || e.key === 'P')) ||
                (e.ctrlKey && (e.key === 'c' || e.key === 'C')) ||
                (e.ctrlKey && (e.key === 'x' || e.key === 'X')) ||
                (e.ctrlKey && (e.key === 's' || e.key === 'S')) ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) // DevTools
            ) {
                e.preventDefault();
                e.stopPropagation();
                showMessage('Screenshots and copying are disabled to protect sensitive content.');
            }
        };

        // Prevent Copy/Cut events
        const handleCopyCut = (e) => {
            e.preventDefault();
            showMessage('Copying content is disabled.');
        };

        // Add listeners
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('copy', handleCopyCut);
        document.addEventListener('cut', handleCopyCut);

        // Add Print Protection Styles
        const style = document.createElement('style');
        style.id = 'kb-protection-styles';
        style.innerHTML = `
            @media print {
                body { display: none !important; }
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
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('copy', handleCopyCut);
            document.removeEventListener('cut', handleCopyCut);

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
