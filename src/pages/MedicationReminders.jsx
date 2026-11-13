import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    FaPills, FaBell, FaBellSlash, FaCheck, FaClock, FaPlus, FaTrash, FaEdit,
    FaCalendarAlt, FaExclamationCircle, FaInfoCircle, FaCheckCircle, FaVial,
    FaTimes, FaPaperPlane, FaRedo, FaShieldAlt, FaCalendarCheck, FaUtensils,
    FaMoon, FaSun, FaCloudSun, FaLock
} from 'react-icons/fa';
import api from '../utils/api';
import {
    isPushSupported, getNotificationPermission, subscribeToPush,
    unsubscribeFromPush, getExistingSubscription
} from '../utils/pushManager';


/* ------------------------------------------------------------------
 * Ethiopian 12-Hour Time Conversion Helpers
 * Ethiopian day cycle:
 *  06:00 - 11:59 (Grego 24h) = 12:00 - 05:59 ጠዋት (ከጠዋቱ)
 *  12:00 - 17:59 (Grego 24h) = 06:00 - 11:59 ከሰዓት (ከሰዓት)
 *  18:00 - 23:59 (Grego 24h) = 12:00 - 05:59 ምሽት (ከምሽቱ)
 *  00:00 - 05:59 (Grego 24h) = 06:00 - 11:59 ሌሊት (ከሌሊቱ)
 * ------------------------------------------------------------------ */

export function toEthiopianTime(time24) {
    if (!time24 || typeof time24 !== 'string') return '';
    const parts = time24.split(':');
    if (parts.length < 2) return time24;
    const h = parseInt(parts[0], 10);
    const m = parts[1].padStart(2, '0');
    if (isNaN(h)) return time24;

    // Ethiopian hour = (Gregorian hour + 6) % 12, with 0 becoming 12
    const ethH = ((h + 6) % 12) || 12;

    let period = '';
    if (h >= 6 && h < 12) {
        period = 'ከጠዋቱ';
    } else if (h >= 12 && h < 18) {
        period = 'ከሰዓት';
    } else if (h >= 18 && h < 24) {
        period = 'ከምሽቱ';
    } else {
        period = 'ከሌሊቱ';
    }

    return `${period} ${ethH}:${m} (${time24})`;
}

export function fromEthiopianTimeTo24(ethHour, minuteStr, period) {
    let h = parseInt(ethHour, 10);
    if (isNaN(h) || h < 1 || h > 12) h = 12;
    const m = String(minuteStr || '00').padStart(2, '0');

    // Convert Ethiopian hour back to Gregorian 24-hour:
    // Period:
    // 'morning' (ከጠዋቱ 12 to 5) -> Greg 06 to 11
    // 'afternoon' (ከሰዓት 6 to 11) -> Greg 12 to 17
    // 'evening' (ከምሽቱ 12 to 5) -> Greg 18 to 23
    // 'night' (ከሌሊቱ 6 to 11) -> Greg 00 to 05
    let gregHour = 0;
    if (period === 'morning') {
        gregHour = (h % 12) + 6; // eth 12 -> 6, eth 1 -> 7, eth 5 -> 11
    } else if (period === 'afternoon') {
        gregHour = (h % 12) + 6; // eth 6 -> 12, eth 7 -> 13, eth 11 -> 17, eth 12 -> 18? Wait:
        // In afternoon, Eth hours are 6, 7, 8, 9, 10, 11 (and 12 is evening)
        // eth 6 = 12:00, eth 7 = 13:00, etc.
        gregHour = (h === 12 ? 6 : h) + 6;
    } else if (period === 'evening') {
        gregHour = (h % 12) + 18; // eth 12 -> 18, eth 1 -> 19, eth 5 -> 23
    } else { // night
        gregHour = (h === 12 ? 6 : h) - 6; // eth 6 -> 0, eth 7 -> 1, eth 11 -> 5
        if (gregHour < 0) gregHour += 24;
    }

    return `${String(gregHour).padStart(2, '0')}:${m}`;
}

export function parse24ToEthiopianParts(time24) {
    if (!time24 || typeof time24 !== 'string') {
        return { ethHour: 2, minute: '00', period: 'morning' };
    }
    const [hStr, mStr] = time24.split(':');
    const h = parseInt(hStr, 10) || 0;
    const minute = (mStr || '00').padStart(2, '0');

    const ethHour = ((h + 6) % 12) || 12;
    let period = 'morning';
    if (h >= 6 && h < 12) period = 'morning';
    else if (h >= 12 && h < 18) period = 'afternoon';
    else if (h >= 18 && h < 24) period = 'evening';
    else period = 'night';

    return { ethHour, minute, period };
}

/* ------------------------------------------------------------------
 * DEVICE-ONLY storage — nothing here is ever sent to the server.
 * Each label maps to { name, dosage, instructions }.
 * ------------------------------------------------------------------ */
const MED_MAP_KEY = 'med_meta_map_v2';
const LEGACY_MED_MAP_KEY = 'med_name_map_v1';

const getMedMap = () => {
    try { return JSON.parse(localStorage.getItem(MED_MAP_KEY) || '{}'); }
    catch { return {}; }
};
const setMedMap = (map) => {
    try { localStorage.setItem(MED_MAP_KEY, JSON.stringify(map)); } catch { /* quota */ }
};

const migrateLegacyMapOnce = () => {
    try {
        const raw = localStorage.getItem(LEGACY_MED_MAP_KEY);
        if (!raw) return;
        const oldMap = JSON.parse(raw);
        const newMap = getMedMap();
        Object.entries(oldMap || {}).forEach(([label, name]) => {
            if (!newMap[label]) newMap[label] = { name, dosage: '', instructions: '' };
        });
        setMedMap(newMap);
        localStorage.removeItem(LEGACY_MED_MAP_KEY);
    } catch { /* ignore */ }
};

const getMedMeta = (label) => {
    if (!label) return null;
    return getMedMap()[label] || null;
};
const setMedMeta = (label, meta) => {
    if (!label) return;
    const map = getMedMap();
    map[label] = {
        name: (meta.name || '').trim(),
        dosage: (meta.dosage || '').trim(),
        instructions: (meta.instructions || '').trim()
    };
    setMedMap(map);
};
const removeMedMeta = (label) => {
    if (!label) return;
    const map = getMedMap();
    delete map[label];
    setMedMap(map);
};

/* Label helpers: A..Z, AA..AZ, ... */
const isLabel = (v) => /^[A-Z]{1,3}$/.test(String(v || '').toUpperCase());

const labelToIndex = (label) => {
    let idx = 0;
    for (const ch of String(label).toUpperCase()) idx = idx * 26 + (ch.charCodeAt(0) - 64);
    return idx - 1;
};
const indexToLabel = (idx) => {
    idx += 1;
    let s = '';
    while (idx > 0) {
        const rem = (idx - 1) % 26;
        s = String.fromCharCode(65 + rem) + s;
        idx = Math.floor((idx - 1) / 26);
    }
    return s;
};
const computeNextLabel = (existingLabels) => {
    let maxIdx = -1;
    for (const l of existingLabels || []) {
        if (!isLabel(l)) continue;
        const i = labelToIndex(l);
        if (i > maxIdx) maxIdx = i;
    }
    return indexToLabel(maxIdx + 1);
};

const playReminderSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const now = ctx.currentTime;

        // Friendly 2-tone medication chime: E5 -> A5
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, now);
        gain1.gain.setValueAtTime(0.25, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.18);
        gain2.gain.setValueAtTime(0.3, now + 0.18);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.18);
        osc2.stop(now + 0.7);
    } catch (e) {
        console.warn('AudioContext sound failed:', e);
    }
};

const resolveDoseData = (schedule) => {
    if (!schedule) return { name: 'Medication', dosage: '', instructions: '', isLocalOnly: false, missingLocal: false };

    const rawName = schedule.medication_name || schedule.name || schedule.label;

    // If it's a full medication name, use it directly
    if (rawName && !isLabel(rawName)) {
        return {
            name: rawName,
            dosage: schedule.dosage || '',
            instructions: schedule.instructions || '',
            isLocalOnly: false,
            missingLocal: false
        };
    }

    // Check device local metadata for single-letter labels
    if (isLabel(rawName)) {
        const meta = getMedMeta(rawName);
        if (meta?.name) {
            return {
                name: meta.name,
                dosage: meta.dosage || schedule.dosage || '',
                instructions: meta.instructions || schedule.instructions || '',
                isLocalOnly: true,
                missingLocal: false
            };
        }
    }

    return {
        name: rawName || 'Medication',
        dosage: schedule.dosage || '',
        instructions: schedule.instructions || '',
        isLocalOnly: false,
        missingLocal: false
    };
};

export default function MedicationReminders() {
    const [schedules, setSchedules] = useState([]);
    const [todayLogs, setTodayLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [permissionStatus, setPermissionStatus] = useState(getNotificationPermission());
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscribing, setSubscribing] = useState(false);
    const [testingPush, setTestingPush] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState(null);
    const [dueReminderAlert, setDueReminderAlert] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    /* form data */
    const [formData, setFormData] = useState({
        label: '',
        medication_name: '',
        dosage: '',
        instructions: '',
        frequency_type: 'twice_daily',
        reminder_times: ['08:00', '20:00'],
        days_of_week: [0, 1, 2, 3, 4, 5, 6],
        start_date: new Date().toISOString().split('T')[0],
        end_date: ''
    });

    useEffect(() => { migrateLegacyMapOnce(); }, []);

    const checkSubscriptionState = useCallback(async () => {
        setPermissionStatus(getNotificationPermission());
        const sub = await getExistingSubscription();
        setIsSubscribed(!!sub);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/reminders');
            if (res.success) {
                setSchedules(res.schedules || []);
                setTodayLogs(res.todayLogs || []);
            }
        } catch (err) {
            console.error('Failed to load reminders:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // 1. Initial data fetch and Service Worker sync
    useEffect(() => {
        fetchData();
        checkSubscriptionState();
        const onSwMessage = (e) => { if (e.data?.type === 'MEDICATION_TAKEN') fetchData(); };
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', onSwMessage);
            return () => navigator.serviceWorker.removeEventListener('message', onSwMessage);
        }
    }, [fetchData, checkSubscriptionState]);

    // 2. Active In-Browser Reminder Checker (runs every 15s)
    useEffect(() => {
        const alertedThisSession = new Set();

        const checkActiveReminders = () => {
            if (!schedules || schedules.length === 0) return;
            const now = new Date();
            const h = String(now.getHours()).padStart(2, '0');
            const m = String(now.getMinutes()).padStart(2, '0');
            const currentTime = `${h}:${m}`;
            const currentDay = now.getDay();
            const todayStr = now.toISOString().split('T')[0];

            for (const schedule of schedules) {
                if (!schedule.is_active) continue;
                if (schedule.start_date && schedule.start_date > todayStr) continue;
                if (schedule.end_date && schedule.end_date < todayStr) continue;

                const days = Array.isArray(schedule.days_of_week) ? schedule.days_of_week : [0, 1, 2, 3, 4, 5, 6];
                if (!days.includes(currentDay)) continue;

                const times = Array.isArray(schedule.reminder_times) ? schedule.reminder_times : [];
                for (const t of times) {
                    if (t === currentTime) {
                        const alertKey = `${schedule.id}-${todayStr}-${t}`;
                        if (alertedThisSession.has(alertKey)) continue;

                        const isAlreadyTaken = todayLogs.some(
                            l => l.schedule_id === schedule.id && l.scheduled_time === t && l.status === 'taken'
                        );
                        if (isAlreadyTaken) continue;

                        alertedThisSession.add(alertKey);
                        const medData = resolveDoseData(schedule);

                        // Play sound
                        playReminderSound();

                        // Open in-app dialog
                        setDueReminderAlert({
                            schedule,
                            time: t,
                            medData
                        });

                        // Fire native Notification if permission granted
                        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                            try {
                                const title = `💊 Time for ${medData.name}`;
                                const body = `${medData.dosage ? 'Dose: ' + medData.dosage : ''}${medData.instructions ? ' • ' + medData.instructions : ''}`.trim() || 'It is time for your scheduled medication.';
                                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                                    navigator.serviceWorker.ready.then(reg => {
                                        reg.showNotification(title, {
                                            body,
                                            icon: '/logo.png',
                                            badge: '/favicon-48x48.png',
                                            tag: `reminder-${schedule.id}-${t}`,
                                            renotify: true,
                                            requireInteraction: true,
                                            data: { scheduleId: schedule.id, scheduledTime: t, url: '/reminders' }
                                        });
                                    });
                                } else {
                                    new Notification(title, {
                                        body,
                                        icon: '/logo.png',
                                        tag: `reminder-${schedule.id}-${t}`
                                    });
                                }
                            } catch (notifErr) {
                                console.warn('Native notification failed:', notifErr);
                            }
                        }
                    }
                }
            }
        };

        const intervalId = setInterval(checkActiveReminders, 15000);
        checkActiveReminders();

        return () => clearInterval(intervalId);
    }, [schedules, todayLogs]);

    // 3. Background Cron Ticker (pings backend every 60s to dispatch Web Push across all user devices)
    useEffect(() => {
        const pingCron = async () => {
            try {
                await api.get('/reminders/cron');
            } catch (e) {
                // Ignore cron ping errors
            }
        };
        pingCron();
        const cronInterval = setInterval(pingCron, 60000);
        return () => clearInterval(cronInterval);
    }, []);

    const handleTogglePush = async () => {
        try {
            setSubscribing(true);
            setNotificationMessage(null);
            if (isSubscribed) {
                await unsubscribeFromPush(api);
                setIsSubscribed(false);
                setNotificationMessage({ type: 'info', text: 'Device notifications turned off.' });
            } else {
                await subscribeToPush(api);
                setIsSubscribed(true);
                setPermissionStatus('granted');
                setNotificationMessage({ type: 'success', text: '🔔 Notifications activated! You will receive scheduled dose alerts on this device.' });
            }
        } catch (err) {
            const errorText = err.response?.data?.error || err.response?.data?.message || err.error || err.message || 'Failed to update notification settings.';
            setNotificationMessage({ type: 'error', text: errorText });
            setPermissionStatus(getNotificationPermission());
        } finally {
            setSubscribing(false);
        }
    };

    const handleSendTestPush = async () => {
        try {
            setTestingPush(true);
            setNotificationMessage(null);
            const res = await api.post('/reminders/test-push');
            if (res.success) {
                setNotificationMessage({ type: 'success', text: '✅ Device verified! A generic confirmation alert was sent.' });
            }
        } catch (err) {
            setNotificationMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Could not send test alert.' });
        } finally {
            setTestingPush(false);
        }
    };

    const handleFrequencyChange = (type) => {
        let times = ['08:00'];
        // Default schedules in Ethiopian context:
        // once_daily: 08:00 (ጠዋት 2:00)
        // twice_daily: 08:00 (ጠዋት 2:00) & 20:00 (ማታ 2:00)
        // three_daily: 08:00 (ጠዋት 2:00), 14:00 (ከሰዓት 8:00), 20:00 (ማታ 2:00)
        // four_daily: 06:00 (ጠዋት 12:00), 12:00 (ከሰዓት 6:00), 18:00 (ማታ 12:00), 00:00 (ሌሊት 6:00)
        if (type === 'once_daily') times = ['08:00'];
        else if (type === 'twice_daily') times = ['08:00', '20:00'];
        else if (type === 'three_daily') times = ['08:00', '14:00', '20:00'];
        else if (type === 'four_daily') times = ['06:00', '12:00', '18:00', '00:00'];
        else if (type === 'custom') times = formData.reminder_times.length > 0 ? formData.reminder_times : ['08:00'];
        setFormData(prev => ({ ...prev, frequency_type: type, reminder_times: times }));
    };

    const updateReminderTimeFromEthiopian = (index, ethHour, minute, period) => {
        const time24 = fromEthiopianTimeTo24(ethHour, minute, period);
        const updated = [...formData.reminder_times];
        updated[index] = time24;
        setFormData(prev => ({ ...prev, reminder_times: updated }));
    };

    const openModal = (schedule = null) => {
        if (schedule) {
            setEditingSchedule(schedule);
            const times = Array.isArray(schedule.reminder_times) ? schedule.reminder_times : ['08:00'];
            let freq = 'custom';
            if (times.length === 1) freq = 'once_daily';
            else if (times.length === 2) freq = 'twice_daily';
            else if (times.length === 3) freq = 'three_daily';
            else if (times.length === 4) freq = 'four_daily';

            const labelRow = isLabel(schedule.label);
            const meta = labelRow ? getMedMeta(schedule.label) : null;
            const medName = schedule.medication_name || schedule.name || meta?.name || (labelRow ? '' : schedule.label) || '';
            const medDosage = schedule.dosage || meta?.dosage || '';
            const medInstructions = schedule.instructions || meta?.instructions || '';

            setFormData({
                label: labelRow ? schedule.label : '',
                medication_name: medName,
                dosage: medDosage,
                instructions: medInstructions,
                frequency_type: freq,
                reminder_times: times,
                days_of_week: Array.isArray(schedule.days_of_week) ? schedule.days_of_week : [0, 1, 2, 3, 4, 5, 6],
                start_date: schedule.start_date || new Date().toISOString().split('T')[0],
                end_date: schedule.end_date || ''
            });
        } else {
            setEditingSchedule(null);
            setFormData({
                label: '',
                medication_name: '',
                dosage: '',
                instructions: '',
                frequency_type: 'twice_daily',
                reminder_times: ['08:00', '20:00'],
                days_of_week: [0, 1, 2, 3, 4, 5, 6],
                start_date: new Date().toISOString().split('T')[0],
                end_date: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSaveSchedule = async (e) => {
        e.preventDefault();
        if (!formData.medication_name.trim()) {
            alert('Please enter a medication name.');
            return;
        }
        if (!formData.dosage.trim()) {
            alert('Please enter a dosage.');
            return;
        }

        try {
            setSubmitting(true);

            let finalLabel = formData.label;
            if (!finalLabel) {
                const existingLabels = schedules.map(s => s.label);
                finalLabel = computeNextLabel(existingLabels);
            }

            setMedMeta(finalLabel, {
                name: formData.medication_name,
                dosage: formData.dosage,
                instructions: formData.instructions
            });

            const payload = {
                medication_name: formData.medication_name.trim(),
                name: formData.medication_name.trim(),
                dosage: formData.dosage.trim(),
                instructions: formData.instructions.trim(),
                label: finalLabel,
                reminder_times: formData.reminder_times,
                days_of_week: formData.days_of_week,
                start_date: formData.start_date,
                end_date: formData.end_date || null
            };

            if (editingSchedule) {
                await api.put(`/reminders/${editingSchedule.id}`, payload);
            } else {
                await api.post('/reminders', payload);
            }

            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            alert(err.message || 'Failed to save medication reminder');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteSchedule = async (id, label) => {
        const data = resolveDoseData({ label, dosage: '', instructions: '' });
        if (!window.confirm(`Delete reminder for "${data.name}"?`)) return;
        try {
            await api.delete(`/reminders/${id}`);
            removeMedMeta(label);
            fetchData();
        } catch (err) {
            alert(err.message || 'Failed to delete reminder');
        }
    };

    const handleToggleActive = async (schedule) => {
        try {
            await api.put(`/reminders/${schedule.id}`, { is_active: !schedule.is_active });
            fetchData();
        } catch {
            alert('Failed to toggle status');
        }
    };

    const handleMarkTaken = async (scheduleId, scheduledTime) => {
        try {
            await api.post(`/reminders/${scheduleId}/action`, { action: 'taken', scheduled_time: scheduledTime });
            fetchData();
        } catch (err) {
            alert(err.message || 'Failed to mark as taken');
        }
    };

    const todayDoses = useMemo(() => {
        const currentDayOfWeek = new Date().getDay();
        const list = [];
        schedules.filter(s => s.is_active).forEach(schedule => {
            const days = Array.isArray(schedule.days_of_week) ? schedule.days_of_week : [0, 1, 2, 3, 4, 5, 6];
            if (days.includes(currentDayOfWeek)) {
                const times = Array.isArray(schedule.reminder_times) ? schedule.reminder_times : [];
                times.forEach(time => {
                    const log = todayLogs.find(l => l.schedule_id === schedule.id && l.scheduled_time === time);
                    list.push({ schedule, time, isTaken: log?.status === 'taken', log });
                });
            }
        });
        return list.sort((a, b) => a.time.localeCompare(b.time));
    }, [schedules, todayLogs]);

    const completedDosesCount = todayDoses.filter(d => d.isTaken).length;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-100">
                        <FaPills className="text-2xl" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Medication Reminders</h1>
                        <p className="text-sm font-semibold text-gray-500 flex items-center gap-1">
                            <FaShieldAlt className="text-emerald-500" />
                            DB stores only labels — name, dosage & instructions stay on this device
                        </p>
                    </div>
                </div>
                <button onClick={() => openModal()} className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-all text-sm">
                    <FaPlus className="text-xs" /><span>Add Reminder (አዲስ ማስታወሻ)</span>
                </button>
            </div>

            {/* Push Status */}
            <div className="mb-8 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className={`p-3.5 rounded-2xl shrink-0 ${isSubscribed ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                            {isSubscribed ? <FaBell className="text-2xl animate-bounce" /> : <FaBellSlash className="text-2xl" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-900 text-base">{isSubscribed ? 'Web Push Reminders Active ✅' : 'Device Reminders Off'}</h3>
                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${isSubscribed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                    {isSubscribed ? 'Connected' : 'No Phone # Needed'}
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xl">
                                {isSubscribed
                                    ? 'Alerts show the label only (e.g. "Medication A"). Your medication name, dosage, and instructions never leave this device.'
                                    : 'Allow browser notifications so you never miss a dose.'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {isSubscribed && (
                            <button onClick={handleSendTestPush} disabled={testingPush} className="px-3.5 py-2.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50">
                                <FaCheckCircle className={`text-emerald-500 text-xs ${testingPush ? 'animate-spin' : ''}`} />
                                <span>{testingPush ? 'Verifying...' : 'Verify Device'}</span>
                            </button>
                        )}
                        <button onClick={handleTogglePush} disabled={subscribing} className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-sm ${isSubscribed ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                            {subscribing ? 'Updating...' : isSubscribed ? 'Turn Off Alerts' : '🔔 Enable Reminders'}
                        </button>
                    </div>
                </div>
                {notificationMessage && (
                    <div className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${notificationMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : notificationMessage.type === 'error' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-blue-50 text-blue-800 border border-blue-200'}`}>
                        <FaInfoCircle className="text-sm shrink-0" /><span>{notificationMessage.text}</span>
                    </div>
                )}
            </div>

            {/* Today's Doses */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                            <FaCalendarCheck className="text-blue-600" /><span>Today's Doses (የዛሬው መድሃኒት)</span>
                        </h2>
                        <p className="text-xs font-medium text-gray-500">
                            {todayDoses.length === 0 ? 'No doses scheduled for today' : `${completedDosesCount} of ${todayDoses.length} doses taken`}
                        </p>
                    </div>
                    {todayDoses.length > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full transition-all duration-500 rounded-full" style={{ width: `${(completedDosesCount / todayDoses.length) * 100}%` }} />
                            </div>
                            <span className="text-xs font-bold text-gray-600">{Math.round((completedDosesCount / todayDoses.length) * 100)}%</span>
                        </div>
                    )}
                </div>

                {todayDoses.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center">
                        <FaPills className="text-4xl text-gray-300 mx-auto mb-3" />
                        <h4 className="font-bold text-gray-700 text-sm">No scheduled doses for today</h4>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">Add your daily prescriptions using the button above.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {todayDoses.map((doseItem, idx) => {
                            const data = resolveDoseData(doseItem.schedule);
                            return (
                                <div key={`${doseItem.schedule.id}-${doseItem.time}-${idx}`} className={`rounded-2xl p-5 border transition-all ${doseItem.isTaken ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}`}>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="p-2 rounded-xl bg-blue-50 text-blue-700 font-extrabold text-xs flex items-center gap-1.5 shadow-xs border border-blue-100">
                                            <FaClock className="text-xs text-blue-600" />
                                            <span>{toEthiopianTime(doseItem.time)}</span>
                                        </div>
                                        {doseItem.isTaken ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                                <FaCheck className="text-[10px]" /> Taken
                                            </span>
                                        ) : (
                                            <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">Upcoming</span>
                                        )}
                                    </div>

                                    <h3 className="font-bold text-gray-900 text-base leading-tight">{data.name}</h3>
                                    {data.dosage && <p className="text-xs font-semibold text-blue-600 mt-0.5">Dose: {data.dosage}</p>}
                                    {isLabel(doseItem.schedule.label) && (
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <span className="text-[10px] font-mono text-gray-400">Label: {doseItem.schedule.label}</span>
                                            {data.isLocalOnly && (
                                                <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-semibold"><FaLock className="text-[8px]" /> local</span>
                                            )}
                                        </div>
                                    )}
                                    {data.missingLocal && (
                                        <div className="mt-1.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded flex items-center gap-1">
                                            <FaExclamationCircle className="shrink-0" />
                                            Name not available on this device — tap Edit to re-enter.
                                        </div>
                                    )}

                                    {data.instructions && (
                                        <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg flex items-center gap-1.5">
                                            <FaUtensils className="text-gray-400 text-[10px] shrink-0" />
                                            <span className="truncate">{data.instructions}</span>
                                        </div>
                                    )}

                                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-[11px] text-gray-400 font-medium">Daily schedule</span>
                                        {!doseItem.isTaken ? (
                                            <button onClick={() => handleMarkTaken(doseItem.schedule.id, doseItem.time)} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
                                                <FaCheck className="text-[10px]" /> Mark Taken
                                            </button>
                                        ) : (
                                            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                                                <FaCheckCircle className="text-emerald-500" /> Completed
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* All Schedules */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                            <FaPills className="text-indigo-600" /><span>My Medication Schedules (የመድሃኒት ዝርዝር)</span>
                        </h2>
                        <p className="text-xs font-medium text-gray-500">
                            <FaShieldAlt className="inline text-emerald-500 mr-1" />
                            Only labels are stored on the server. Names, dosages & instructions live in this browser.
                        </p>
                    </div>
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{schedules.length} Medications</span>
                </div>

                {loading ? (
                    <div className="py-12 flex justify-center">
                        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : schedules.length === 0 ? (
                    <div className="py-12 text-center">
                        <FaPills className="text-5xl text-gray-200 mx-auto mb-3" />
                        <h4 className="font-bold text-gray-700 text-sm">No medication reminders yet</h4>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">Click "Add Reminder" to set up your first schedule.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {schedules.map(schedule => {
                            const data = resolveDoseData(schedule);
                            return (
                                <div key={schedule.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-3.5">
                                        <div className={`p-3 rounded-2xl shrink-0 ${schedule.is_active ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <FaPills className="text-xl" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-bold text-gray-900 text-base">{data.name}</h4>
                                                {isLabel(schedule.label) && (
                                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">{schedule.label}</span>
                                                )}
                                                {data.dosage && (
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">{data.dosage}</span>
                                                )}
                                                {isLabel(schedule.label) && data.isLocalOnly && (
                                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 inline-flex items-center gap-0.5">
                                                        <FaLock className="text-[8px]" /> local
                                                    </span>
                                                )}
                                                {!schedule.is_active && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">Paused</span>
                                                )}
                                                {data.missingLocal && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">Name not on device</span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-500">
                                                <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded flex items-center gap-1">
                                                    <FaClock className="text-[10px]" />
                                                    {(schedule.reminder_times || []).map(t => toEthiopianTime(t)).join('፣ ')}
                                                </span>
                                                {data.instructions && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{data.instructions}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-end sm:self-center">
                                        <button onClick={() => handleToggleActive(schedule)} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${schedule.is_active ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                                            {schedule.is_active ? 'Pause' : 'Resume'}
                                        </button>
                                        <button onClick={() => openModal(schedule)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit reminder"><FaEdit /></button>
                                        <button onClick={() => handleDeleteSchedule(schedule.id, schedule.label)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Delete reminder"><FaTrash /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-all"><FaTimes /></button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><FaPills className="text-2xl" /></div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{editingSchedule ? 'Edit Medication Reminder' : 'Add Medication Reminder'}</h3>
                                <p className="text-xs text-gray-500">የመድሃኒት ማስታወሻ መመዝገቢያ</p>
                            </div>
                        </div>

                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2">
                            <FaShieldAlt className="text-blue-600 mt-0.5 shrink-0" />
                            <p className="text-[11px] text-blue-900 font-medium leading-relaxed">
                                <strong>Smart Sync & Privacy:</strong> Medication name, dosage, and instructions are securely synchronized with your account so you receive timely push alerts and reminders across all your devices.
                            </p>
                        </div>

                        <form onSubmit={handleSaveSchedule} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Medication Name (የመድሃኒት ስም) *
                                </label>
                                <input type="text" required
                                    value={formData.medication_name}
                                    onChange={e => setFormData(prev => ({ ...prev, medication_name: e.target.value }))}
                                    placeholder="e.g. Amoxicillin, Metformin, Omeprazole"
                                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Dosage (መጠን) *
                                </label>
                                <input type="text" required
                                    value={formData.dosage}
                                    onChange={e => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                                    placeholder="e.g. 500mg, 1 tablet, 2 puffs"
                                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Frequency (በቀን ስንት ጊዜ)</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { id: 'once_daily', label: '1x Daily' },
                                        { id: 'twice_daily', label: '2x Daily' },
                                        { id: 'three_daily', label: '3x Daily' },
                                        { id: 'custom', label: 'Custom' }
                                    ].map(f => (
                                        <button key={f.id} type="button" onClick={() => handleFrequencyChange(f.id)}
                                            className={`py-2 text-xs font-bold rounded-xl border transition-all ${formData.frequency_type === f.id ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}>
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Reminder Times (የማስታወሻ ሰዓት በኢትዮጵያ አቆጣጠር)
                                    </label>
                                    <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                        የኢትዮጵያ ሰዓት አቆጣጠር (12-Hour)
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {formData.reminder_times.map((t, idx) => {
                                        const { ethHour, minute, period } = parse24ToEthiopianParts(t);
                                        return (
                                            <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {/* Period Selector */}
                                                    <select
                                                        value={period}
                                                        onChange={e => updateReminderTimeFromEthiopian(idx, ethHour, minute, e.target.value)}
                                                        className="px-2.5 py-1.5 text-xs font-bold bg-white border border-gray-300 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                                                    >
                                                        <option value="morning">ከጠዋቱ (ጠዋት)</option>
                                                        <option value="afternoon">ከሰዓት (ከሰዓት በኋላ)</option>
                                                        <option value="evening">ከምሽቱ (ማታ)</option>
                                                        <option value="night">ከሌሊቱ (ሌሊት)</option>
                                                    </select>

                                                    {/* Ethiopian Hour Selector */}
                                                    <div className="flex items-center gap-1">
                                                        <select
                                                            value={ethHour}
                                                            onChange={e => updateReminderTimeFromEthiopian(idx, e.target.value, minute, period)}
                                                            className="px-2.5 py-1.5 text-xs font-bold bg-white border border-gray-300 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                                                        >
                                                            {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h => (
                                                                <option key={h} value={h}>{h} ሰዓት</option>
                                                            ))}
                                                        </select>
                                                        <span className="font-bold text-gray-400">:</span>
                                                        {/* Minute Selector */}
                                                        <select
                                                            value={minute}
                                                            onChange={e => updateReminderTimeFromEthiopian(idx, ethHour, e.target.value, period)}
                                                            className="px-2.5 py-1.5 text-xs font-bold bg-white border border-gray-300 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                                                        >
                                                            {['00', '15', '30', '45'].map(m => (
                                                                <option key={m} value={m}>{m === '00' ? 'ተኩል ያልሞላ (:00)' : m === '30' ? 'ተኩል (:30)' : `:${m}`}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Direct 24h Native Input for precision */}
                                                    <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-2 py-1 rounded-xl">
                                                        <span className="text-[10px] text-gray-400 font-mono">24h:</span>
                                                        <input
                                                            type="time"
                                                            value={t}
                                                            onChange={e => {
                                                                const updated = [...formData.reminder_times];
                                                                updated[idx] = e.target.value;
                                                                setFormData(prev => ({ ...prev, reminder_times: updated }));
                                                            }}
                                                            className="text-xs font-semibold text-gray-700 bg-transparent focus:outline-hidden"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between sm:justify-end gap-2">
                                                    <span className="text-xs font-extrabold text-blue-700 bg-blue-100/60 px-2.5 py-1 rounded-lg">
                                                        {toEthiopianTime(t)}
                                                    </span>
                                                    {formData.reminder_times.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const updated = formData.reminder_times.filter((_, i) => i !== idx);
                                                                setFormData(prev => ({ ...prev, reminder_times: updated }));
                                                            }}
                                                            className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                            title="ሰርዝ (Remove)"
                                                        >
                                                            <FaTimes className="text-xs" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, reminder_times: [...prev.reminder_times, '12:00'] }))}
                                        className="px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl flex items-center gap-1.5 transition-all"
                                    >
                                        <FaPlus className="text-[10px]" /> ተጨማሪ ሰዓት ጨምር (Add Another Time)
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Special Instructions (አወሳሰድ መመሪያ)
                                </label>
                                <input type="text"
                                    value={formData.instructions}
                                    onChange={e => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                                    placeholder="e.g. Take with food, after meals, with a full glass of water"
                                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden" />
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                                <button type="submit" disabled={submitting}
                                    className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-md shadow-blue-200">
                                    {submitting ? 'Saving...' : editingSchedule ? 'Save Changes' : 'Create Reminder'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Active Real-Time In-Browser Reminder Modal */}
            {dueReminderAlert && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-blue-500 text-center animate-bounce-short">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                            <FaBell className="text-3xl animate-wiggle" />
                        </div>
                        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs uppercase tracking-wider rounded-full mb-2">
                            ⏰ ጊዜው ደርሷል (Medication Due)
                        </span>
                        <h3 className="text-2xl font-black text-gray-900 mb-1">
                            {dueReminderAlert.medicationName}
                        </h3>
                        <p className="text-base font-semibold text-blue-600 mb-2">
                            {dueReminderAlert.dosage}
                        </p>
                        {dueReminderAlert.instructions && (
                            <p className="text-xs bg-gray-50 border border-gray-200 text-gray-600 rounded-xl p-3 mb-5 italic">
                                "{dueReminderAlert.instructions}"
                            </p>
                        )}
                        <p className="text-xs text-gray-500 font-bold mb-6 bg-blue-50 py-1.5 px-3 rounded-lg inline-block">
                            የታዘዘበት ሰዓት፦ {toEthiopianTime(dueReminderAlert.time)}
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setDueReminderAlert(null)}
                                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-all"
                            >
                                Dismiss (ዝጋ)
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    handleLogDose(dueReminderAlert.scheduleId, 'taken', dueReminderAlert.time);
                                    setDueReminderAlert(null);
                                }}
                                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                            >
                                <FaCheck /> ወስጃለሁ (Taken)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
