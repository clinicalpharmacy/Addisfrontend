import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    FaPills,
    FaBell,
    FaBellSlash,
    FaCheck,
    FaClock,
    FaPlus,
    FaTrash,
    FaEdit,
    FaCalendarAlt,
    FaExclamationCircle,
    FaInfoCircle,
    FaCheckCircle,
    FaVial,
    FaTimes,
    FaPaperPlane,
    FaRedo,
    FaShieldAlt,
    FaCalendarCheck,
    FaUtensils,
    FaMoon,
    FaSun,
    FaCloudSun
} from 'react-icons/fa';
import api from '../utils/api';
import {
    isPushSupported,
    getNotificationPermission,
    subscribeToPush,
    unsubscribeFromPush,
    getExistingSubscription
} from '../utils/pushManager';

const QUICK_MEDS = [
    { name: 'Metformin', dose: '500 mg' },
    { name: 'Amlodipine', dose: '5 mg' },
    { name: 'Omeprazole', dose: '20 mg' },
    { name: 'Atorvastatin', dose: '20 mg' },
    { name: 'Losartan', dose: '50 mg' },
    { name: 'Amoxicillin', dose: '500 mg' },
    { name: 'Paracetamol', dose: '1 g' },
    { name: 'Insulin', dose: '10 units' }
];

const INSTRUCTION_PRESETS = [
    'Take after meal with water',
    'Take before meal on empty stomach',
    'Take with food',
    'Take at bedtime',
    'Take with a full glass of water'
];

const DAYS_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MedicationReminders() {
    const [schedules, setSchedules] = useState([]);
    const [todayLogs, setTodayLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [permissionStatus, setPermissionStatus] = useState(getNotificationPermission());
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscribing, setSubscribing] = useState(false);
    const [testingPush, setTestingPush] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        medication_name: '',
        dosage: '',
        instructions: '',
        frequency_type: 'twice_daily', // once_daily, twice_daily, three_daily, custom
        reminder_times: ['08:00', '20:00'],
        days_of_week: [0, 1, 2, 3, 4, 5, 6],
        start_date: new Date().toISOString().split('T')[0],
        end_date: ''
    });

    // Check notification & subscription state
    const checkSubscriptionState = useCallback(async () => {
        setPermissionStatus(getNotificationPermission());
        const sub = await getExistingSubscription();
        setIsSubscribed(!!sub);
    }, []);

    // Fetch schedules and today's logs from backend
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

    useEffect(() => {
        fetchData();
        checkSubscriptionState();

        // Listen for messages from Service Worker (e.g. taken action)
        const handleSwMessage = (event) => {
            if (event.data?.type === 'MEDICATION_TAKEN') {
                fetchData();
            }
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', handleSwMessage);
            return () => navigator.serviceWorker.removeEventListener('message', handleSwMessage);
        }
    }, [fetchData, checkSubscriptionState]);

    // Handle Enable Push Notifications
    const handleTogglePush = async () => {
        try {
            setSubscribing(true);
            setNotificationMessage(null);

            if (isSubscribed) {
                await unsubscribeFromPush(api);
                setIsSubscribed(false);
                setNotificationMessage({
                    type: 'info',
                    text: 'Device notifications turned off.'
                });
            } else {
                const res = await subscribeToPush(api);
                setIsSubscribed(true);
                setPermissionStatus('granted');
                setNotificationMessage({
                    type: 'success',
                    text: '🔔 Device notifications activated! You will receive timely reminders.'
                });
            }
        } catch (err) {
            console.error('Push toggle error:', err);
            setNotificationMessage({
                type: 'error',
                text: err.message || 'Failed to update notification settings.'
            });
            setPermissionStatus(getNotificationPermission());
        } finally {
            setSubscribing(false);
        }
    };

    // Send Test Push
    const handleSendTestPush = async () => {
        try {
            setTestingPush(true);
            setNotificationMessage(null);
            const res = await api.post('/reminders/test-push');
            if (res.success) {
                setNotificationMessage({
                    type: 'success',
                    text: '🚀 Test alert sent! Check your notification tray / phone screen.'
                });
            }
        } catch (err) {
            setNotificationMessage({
                type: 'error',
                text: err.response?.data?.message || err.message || 'Could not send test alert.'
            });
        } finally {
            setTestingPush(false);
        }
    };

    // Frequency type change handler
    const handleFrequencyChange = (type) => {
        let times = ['08:00'];
        if (type === 'once_daily') times = ['08:00'];
        else if (type === 'twice_daily') times = ['08:00', '20:00'];
        else if (type === 'three_daily') times = ['08:00', '14:00', '20:00'];
        else if (type === 'four_daily') times = ['08:00', '12:00', '16:00', '20:00'];
        else if (type === 'custom') times = formData.reminder_times.length > 0 ? formData.reminder_times : ['08:00'];

        setFormData(prev => ({
            ...prev,
            frequency_type: type,
            reminder_times: times
        }));
    };

    // Open Modal for Create or Edit
    const openModal = (schedule = null) => {
        if (schedule) {
            setEditingSchedule(schedule);
            const times = Array.isArray(schedule.reminder_times) ? schedule.reminder_times : ['08:00'];
            let freq = 'custom';
            if (times.length === 1) freq = 'once_daily';
            else if (times.length === 2) freq = 'twice_daily';
            else if (times.length === 3) freq = 'three_daily';
            else if (times.length === 4) freq = 'four_daily';

            setFormData({
                medication_name: schedule.medication_name,
                dosage: schedule.dosage,
                instructions: schedule.instructions || '',
                frequency_type: freq,
                reminder_times: times,
                days_of_week: Array.isArray(schedule.days_of_week) ? schedule.days_of_week : [0, 1, 2, 3, 4, 5, 6],
                start_date: schedule.start_date || new Date().toISOString().split('T')[0],
                end_date: schedule.end_date || ''
            });
        } else {
            setEditingSchedule(null);
            setFormData({
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

    // Save Reminder Form
    const handleSaveSchedule = async (e) => {
        e.preventDefault();
        if (!formData.medication_name.trim() || !formData.dosage.trim()) {
            alert('Please enter medication name and dosage.');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                medication_name: formData.medication_name,
                dosage: formData.dosage,
                instructions: formData.instructions,
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

    // Delete Schedule
    const handleDeleteSchedule = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete reminder for "${name}"?`)) return;
        try {
            await api.delete(`/reminders/${id}`);
            fetchData();
        } catch (err) {
            alert(err.message || 'Failed to delete reminder');
        }
    };

    // Toggle Active/Inactive
    const handleToggleActive = async (schedule) => {
        try {
            await api.put(`/reminders/${schedule.id}`, { is_active: !schedule.is_active });
            fetchData();
        } catch (err) {
            alert('Failed to toggle status');
        }
    };

    // Mark medication as taken for today & time
    const handleMarkTaken = async (scheduleId, scheduledTime) => {
        try {
            await api.post(`/reminders/${scheduleId}/action`, {
                action: 'taken',
                scheduled_time: scheduledTime
            });
            fetchData();
        } catch (err) {
            alert(err.message || 'Failed to mark as taken');
        }
    };

    // Generate list of today's scheduled doses
    const todayDoses = useMemo(() => {
        const currentDayOfWeek = new Date().getDay();
        const list = [];

        schedules.filter(s => s.is_active).forEach(schedule => {
            const days = Array.isArray(schedule.days_of_week) ? schedule.days_of_week : [0, 1, 2, 3, 4, 5, 6];
            if (days.includes(currentDayOfWeek)) {
                const times = Array.isArray(schedule.reminder_times) ? schedule.reminder_times : [];
                times.forEach(time => {
                    // Check if taken in todayLogs
                    const log = todayLogs.find(l => l.schedule_id === schedule.id && l.scheduled_time === time);
                    list.push({
                        schedule,
                        time,
                        isTaken: log?.status === 'taken',
                        log
                    });
                });
            }
        });

        // Sort chronologically by time
        return list.sort((a, b) => a.time.localeCompare(b.time));
    }, [schedules, todayLogs]);

    const completedDosesCount = todayDoses.filter(d => d.isTaken).length;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-100">
                            <FaPills className="text-2xl" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                                Medication Reminders
                            </h1>
                            <p className="text-sm font-semibold text-gray-500">
                                የመድሃኒት ማስታወሻ • Alerts directly to your phone or computer
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => openModal()}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-all text-sm"
                >
                    <FaPlus className="text-xs" />
                    <span>Add Reminder (አዲስ ማስታወሻ)</span>
                </button>
            </div>

            {/* Notification Status Banner */}
            <div className="mb-8 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className={`p-3.5 rounded-2xl shrink-0 ${isSubscribed ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                            {isSubscribed ? <FaBell className="text-2xl animate-bounce" /> : <FaBellSlash className="text-2xl" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-900 text-base">
                                    {isSubscribed ? 'Web Push Reminders Active ✅' : 'Device Reminders Off'}
                                </h3>
                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${isSubscribed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                    {isSubscribed ? 'Connected' : 'No Phone # Needed'}
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xl">
                                {isSubscribed
                                    ? 'This device will receive popup sound/vibration alerts even when you close the website.'
                                    : 'Allow browser notifications so you never miss a dose, even when your browser or phone screen is off.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {isSubscribed && (
                            <button
                                onClick={handleSendTestPush}
                                disabled={testingPush}
                                className="px-4 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all flex items-center gap-1.5"
                                title="Send a test notification to verify"
                            >
                                <FaPaperPlane className={`text-[10px] ${testingPush ? 'animate-spin' : ''}`} />
                                {testingPush ? 'Sending...' : 'Test Alert'}
                            </button>
                        )}

                        <button
                            onClick={handleTogglePush}
                            disabled={subscribing}
                            className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all shadow-sm ${
                                isSubscribed
                                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
                            }`}
                        >
                            {subscribing ? 'Updating...' : isSubscribed ? 'Turn Off Alerts' : '🔔 Enable Reminders'}
                        </button>
                    </div>
                </div>

                {notificationMessage && (
                    <div className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                        notificationMessage.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : notificationMessage.type === 'error'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}>
                        <FaInfoCircle className="text-sm shrink-0" />
                        <span>{notificationMessage.text}</span>
                    </div>
                )}
            </div>

            {/* Today's Medication Tracker */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                            <FaCalendarCheck className="text-blue-600" />
                            <span>Today's Doses (የዛሬው መድሃኒት)</span>
                        </h2>
                        <p className="text-xs font-medium text-gray-500">
                            {todayDoses.length === 0
                                ? 'No doses scheduled for today'
                                : `${completedDosesCount} of ${todayDoses.length} doses taken`}
                        </p>
                    </div>

                    {todayDoses.length > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 h-2.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                                    style={{ width: `${(completedDosesCount / todayDoses.length) * 100}%` }}
                                />
                            </div>
                            <span className="text-xs font-bold text-gray-600">
                                {Math.round((completedDosesCount / todayDoses.length) * 100)}%
                            </span>
                        </div>
                    )}
                </div>

                {todayDoses.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center">
                        <FaPills className="text-4xl text-gray-300 mx-auto mb-3" />
                        <h4 className="font-bold text-gray-700 text-sm">No scheduled doses for today</h4>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                            Add your daily prescriptions using the button above to receive timely alerts.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {todayDoses.map((doseItem, idx) => (
                            <div
                                key={`${doseItem.schedule.id}-${doseItem.time}-${idx}`}
                                className={`rounded-2xl p-5 border transition-all ${
                                    doseItem.isTaken
                                        ? 'bg-emerald-50/50 border-emerald-200 shadow-sm'
                                        : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600 font-black text-xs flex items-center gap-1">
                                            <FaClock className="text-xs" />
                                            <span>{doseItem.time}</span>
                                        </div>
                                    </div>
                                    {doseItem.isTaken ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                            <FaCheck className="text-[10px]" /> Taken
                                        </span>
                                    ) : (
                                        <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                                            Upcoming
                                        </span>
                                    )}
                                </div>

                                <h3 className="font-bold text-gray-900 text-base leading-tight">
                                    {doseItem.schedule.medication_name}
                                </h3>
                                <p className="text-xs font-semibold text-blue-600 mt-0.5">
                                    Dose: {doseItem.schedule.dosage}
                                </p>

                                {doseItem.schedule.instructions && (
                                    <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg flex items-center gap-1.5">
                                        <FaUtensils className="text-gray-400 text-[10px] shrink-0" />
                                        <span className="truncate">{doseItem.schedule.instructions}</span>
                                    </div>
                                )}

                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                    <span className="text-[11px] text-gray-400 font-medium">Daily schedule</span>
                                    {!doseItem.isTaken ? (
                                        <button
                                            onClick={() => handleMarkTaken(doseItem.schedule.id, doseItem.time)}
                                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm shadow-emerald-200"
                                        >
                                            <FaCheck className="text-[10px]" /> Mark Taken
                                        </button>
                                    ) : (
                                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                                            <FaCheckCircle className="text-emerald-500" /> Completed
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* All Medication Schedules */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                            <FaPills className="text-indigo-600" />
                            <span>My Medication Schedules (የመድሃኒት ዝርዝር)</span>
                        </h2>
                        <p className="text-xs font-medium text-gray-500">
                            Configure reminder times, dosage, and active alerts
                        </p>
                    </div>

                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {schedules.length} Medications
                    </span>
                </div>

                {loading ? (
                    <div className="py-12 flex justify-center">
                        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : schedules.length === 0 ? (
                    <div className="py-12 text-center">
                        <FaPills className="text-5xl text-gray-200 mx-auto mb-3" />
                        <h4 className="font-bold text-gray-700 text-sm">No medication reminders yet</h4>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                            Click "Add Reminder" above to set up your first medication schedule.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {schedules.map(schedule => (
                            <div key={schedule.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-3.5">
                                    <div className={`p-3 rounded-2xl shrink-0 ${schedule.is_active ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <FaPills className="text-xl" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-gray-900 text-base">
                                                {schedule.medication_name}
                                            </h4>
                                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                                                {schedule.dosage}
                                            </span>
                                            {!schedule.is_active && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                                                    Paused
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-500">
                                            <span className="font-semibold text-indigo-600 flex items-center gap-1">
                                                <FaClock className="text-[10px]" />
                                                {(schedule.reminder_times || []).join(', ')}
                                            </span>
                                            <span>•</span>
                                            <span>{schedule.instructions || 'No special instructions'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-center">
                                    <button
                                        onClick={() => handleToggleActive(schedule)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                            schedule.is_active
                                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                        }`}
                                    >
                                        {schedule.is_active ? 'Pause' : 'Resume'}
                                    </button>

                                    <button
                                        onClick={() => openModal(schedule)}
                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                        title="Edit reminder"
                                    >
                                        <FaEdit />
                                    </button>

                                    <button
                                        onClick={() => handleDeleteSchedule(schedule.id, schedule.medication_name)}
                                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                        title="Delete reminder"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal for Add / Edit Medication Reminder */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-all"
                        >
                            <FaTimes />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                <FaPills className="text-2xl" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    {editingSchedule ? 'Edit Medication Reminder' : 'Add Medication Reminder'}
                                </h3>
                                <p className="text-xs text-gray-500">የመድሃኒት ማስታወሻ መመዝገቢያ</p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveSchedule} className="space-y-4">
                            {/* Quick Presets for New Med */}
                            {!editingSchedule && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Quick Select (ፈጣን ምርጫ)
                                    </label>
                                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                                        {QUICK_MEDS.map(m => (
                                            <button
                                                key={m.name}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, medication_name: m.name, dosage: m.dose }))}
                                                className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-600 font-medium rounded-lg transition-all"
                                            >
                                                {m.name} ({m.dose})
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Medication Name */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Medication Name (የመድሃኒት ስም) *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Metformin, Amlodipine"
                                    value={formData.medication_name}
                                    onChange={e => setFormData(prev => ({ ...prev, medication_name: e.target.value }))}
                                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                                />
                            </div>

                            {/* Dosage */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Dosage (መጠን) *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 500 mg, 1 tablet"
                                    value={formData.dosage}
                                    onChange={e => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                                />
                            </div>

                            {/* Frequency Selector */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Frequency (በቀን ስንት ጊዜ)
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { id: 'once_daily', label: '1x Daily' },
                                        { id: 'twice_daily', label: '2x Daily' },
                                        { id: 'three_daily', label: '3x Daily' },
                                        { id: 'custom', label: 'Custom' }
                                    ].map(f => (
                                        <button
                                            key={f.id}
                                            type="button"
                                            onClick={() => handleFrequencyChange(f.id)}
                                            className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                                                formData.frequency_type === f.id
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                            }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Reminder Times */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Reminder Times (የማስታወሻ ሰዓቶች)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {formData.reminder_times.map((t, idx) => (
                                        <div key={idx} className="flex items-center gap-1 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
                                            <input
                                                type="time"
                                                value={t}
                                                onChange={e => {
                                                    const updated = [...formData.reminder_times];
                                                    updated[idx] = e.target.value;
                                                    setFormData(prev => ({ ...prev, reminder_times: updated }));
                                                }}
                                                className="bg-transparent text-sm font-semibold focus:outline-hidden"
                                            />
                                            {formData.reminder_times.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = formData.reminder_times.filter((_, i) => i !== idx);
                                                        setFormData(prev => ({ ...prev, reminder_times: updated }));
                                                    }}
                                                    className="text-gray-400 hover:text-rose-500"
                                                >
                                                    <FaTimes className="text-xs" />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, reminder_times: [...prev.reminder_times, '12:00'] }))}
                                        className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all"
                                    >
                                        + Add Time
                                    </button>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Special Instructions (አወሳሰድ መመሪያ)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Take after meal with water"
                                    value={formData.instructions}
                                    onChange={e => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden mb-2"
                                />
                                <div className="flex flex-wrap gap-1">
                                    {INSTRUCTION_PRESETS.map((p, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, instructions: p }))}
                                            className="text-[11px] px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded"
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-md shadow-blue-200 transition-all"
                                >
                                    {submitting ? 'Saving...' : editingSchedule ? 'Save Changes' : 'Create Reminder'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
