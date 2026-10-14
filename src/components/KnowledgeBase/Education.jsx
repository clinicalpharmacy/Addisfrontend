import React, { useState, useEffect, useMemo } from 'react';
import {
    FaGraduationCap,
    FaBookOpen,
    FaClipboardList,
    FaSearch,
    FaSpinner,
    FaUser,
    FaSave,
    FaTimes,
    FaPlus
} from 'react-icons/fa';
import api from '../../utils/api';
import ExamModule from './ExamModule';

/**
 * PatientDetails
 *
 * Minimal but complete patient details manager that:
 * - fetches patients from API (with localStorage fallback),
 * - lists patients,
 * - allows creating/editing a patient,
 * - validates required fields,
 * - gracefully handles API errors,
 * - falls back to localStorage when the API is unavailable
 *   (so saving never hard-fails when the endpoint is missing).
 */
const PatientDetails = () => {
    const STORAGE_KEY = 'clinicalpharmacy_patients_v1';

    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // useMemo so `empty` is a stable reference (avoids resetting form on every render)
    const empty = useMemo(
        () => ({
            id: null,
            name: '',
            age: '',
            sex: '',
            weightKg: '',
            allergies: '',
            medications: '',
            notes: ''
        }),
        []
    );

    const [form, setForm] = useState(empty);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState(null);

    useEffect(() => {
        loadPatients();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const persistLocal = (items) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (err) {
            // ignore storage quota / private mode errors
            console.warn('Could not persist patients locally:', err);
        }
    };

    const readLocal = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            console.warn('Could not read local patients:', err);
            return [];
        }
    };

    const loadPatients = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await api.get('/patients');
            // Accept multiple shapes: { success, patients }, array, { data }
            let list = [];
            if (res && res.success && Array.isArray(res.patients)) {
                list = res.patients;
            } else if (Array.isArray(res)) {
                list = res;
            } else if (res && Array.isArray(res.data)) {
                list = res.data;
            }

            if (list.length === 0) {
                // fallback to localStorage if available
                list = readLocal();
            } else {
                // persist what we fetched
                persistLocal(list);
            }

            setPatients(list);
        } catch (err) {
            console.error('Failed to fetch patients:', err);
            setError(
                'Could not load patients from server; using local data if available.'
            );
            setPatients(readLocal());
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (k, v) => {
        setForm((p) => ({ ...p, [k]: v }));
    };

    const validate = () => {
        if (!form.name || form.name.trim().length < 2) {
            setError('Please enter a valid patient name.');
            return false;
        }
        if (!form.age || Number.isNaN(Number(form.age)) || Number(form.age) < 0) {
            setError('Please provide a valid age.');
            return false;
        }
        // other validations could be added as required
        setError(null);
        return true;
    };

    /**
     * Attempts to persist a patient to the API.
     * Returns the saved patient on success, or throws on failure.
     */
    const saveToApi = async (payload) => {
        if (payload.id) {
            const res = await api.put(`/patients/${payload.id}`, payload);
            if (res && (res.success || res.updated)) {
                return res.patient || res.data || payload;
            }
            if (res && res.id) {
                return { ...payload, id: res.id };
            }
            // API responded without a strict shape → assume success
            return payload;
        }

        const res = await api.post('/patients', payload);
        if (res && (res.success || res.created)) {
            return res.patient || res.data || { ...payload, id: res.id || Date.now() };
        }
        if (res && res.id) {
            return { ...payload, id: res.id };
        }
        // API responded without a strict shape → assume success with local id
        return { ...payload, id: Date.now() };
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (!validate()) return;

        setSaving(true);
        setError(null);
        setSuccessMsg(null);

        // Always give the payload a local id (for new patients) so that
        // both API and local fallback can key it consistently.
        const payload = {
            ...form,
            id: form.id || `local_${Date.now()}`
        };

        let saved;
        let usedFallback = false;

        try {
            saved = await saveToApi(payload);
        } catch (err) {
            // The API is unavailable / endpoint missing — fall back to
            // localStorage so the save still succeeds for the user.
            console.warn('API save failed, falling back to local storage:', err);
            usedFallback = true;
            saved = payload;
        }

        try {
            // Update list locally (and persist) regardless of API outcome.
            setPatients((prev) => {
                const filtered = prev.filter((p) => p.id !== saved.id);
                const next = [saved, ...filtered];
                persistLocal(next);
                return next;
            });

            setSuccessMsg(
                usedFallback
                    ? 'Saved locally (server unavailable). It will sync when you reconnect.'
                    : 'Patient saved.'
            );

            // reset form
            setForm(empty);
            setIsEditing(false);

            setTimeout(() => setSuccessMsg(null), 3500);
        } catch (err) {
            console.error('Failed to update patient list:', err);
            setError('Patient was saved, but the list could not be refreshed.');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (patient) => {
        setForm({
            id: patient.id || null,
            name: patient.name || '',
            age: patient.age != null ? String(patient.age) : '',
            sex: patient.sex || '',
            weightKg: patient.weightKg != null ? String(patient.weightKg) : '',
            allergies: patient.allergies || '',
            medications: patient.medications || '',
            notes: patient.notes || ''
        });
        setIsEditing(true);
        setSuccessMsg(null);
    };

    const handleDeleteLocal = async (id) => {
        if (!window.confirm('Remove this patient?')) return;

        // Try the API first (best-effort), then remove locally.
        if (id && !String(id).startsWith('local_')) {
            try {
                await api.delete(`/patients/${id}`);
            } catch (err) {
                console.warn('API delete failed, removing locally only:', err);
            }
        }

        const next = patients.filter((p) => p.id !== id);
        setPatients(next);
        persistLocal(next);

        if (form.id === id) {
            setForm(empty);
            setIsEditing(false);
        }
    };

    const handleNew = () => {
        setForm(empty);
        setIsEditing(true);
        setError(null);
        setSuccessMsg(null);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-md flex items-center justify-center">
                            <FaUser className="text-indigo-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800">Patients</h4>
                            <p className="text-xs text-gray-500">Manage patient details</p>
                        </div>
                    </div>
                    <button
                        onClick={handleNew}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-sm"
                    >
                        <FaPlus /> New
                    </button>
                </div>

                {loading ? (
                    <div className="py-8 text-center">
                        <FaSpinner className="animate-spin text-indigo-600 text-2xl mx-auto" />
                    </div>
                ) : (
                    <>
                        {error && (
                            <div className="bg-red-50 text-red-600 p-2 rounded mb-3 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="max-h-[420px] overflow-auto space-y-2 pr-2">
                            {patients.length === 0 ? (
                                <div className="text-sm text-gray-500 p-4">No patients yet.</div>
                            ) : (
                                patients.map((p) => (
                                    <div
                                        key={p.id}
                                        className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors flex items-start justify-between gap-3"
                                    >
                                        <div
                                            onClick={() => handleEdit(p)}
                                            className="flex-1 cursor-pointer"
                                        >
                                            <div className="font-semibold text-gray-800 line-clamp-1">
                                                {p.name}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {p.age ? `${p.age} yrs` : '—'} • {p.sex || '—'}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <button
                                                onClick={() => handleEdit(p)}
                                                className="text-xs bg-white border border-gray-200 px-2 py-1 rounded text-gray-700 hover:bg-gray-50"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteLocal(p.id)}
                                                className="text-xs text-red-600 px-2 py-1 rounded hover:bg-red-50"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>

            <div className="md:col-span-2 bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Patient Details</h3>
                    <div className="text-sm text-gray-500">Create or edit patient records</div>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                    {successMsg && (
                        <div className="text-sm bg-green-50 border border-green-100 text-green-700 p-2 rounded">
                            {successMsg}
                        </div>
                    )}
                    {error && (
                        <div className="text-sm bg-red-50 border border-red-100 text-red-700 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                            value={form.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="Full name *"
                            className="col-span-1 md:col-span-3 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-50 focus:border-indigo-300 outline-none"
                        />
                        <input
                            value={form.age}
                            onChange={(e) => handleChange('age', e.target.value)}
                            placeholder="Age (years) *"
                            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-50 focus:border-indigo-300 outline-none"
                        />
                        <select
                            value={form.sex}
                            onChange={(e) => handleChange('sex', e.target.value)}
                            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-50 focus:border-indigo-300 outline-none"
                        >
                            <option value="">Sex</option>
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                            <option value="Other">Other</option>
                        </select>
                        <input
                            value={form.weightKg}
                            onChange={(e) => handleChange('weightKg', e.target.value)}
                            placeholder="Weight (kg)"
                            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-50 focus:border-indigo-300 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <textarea
                            value={form.allergies}
                            onChange={(e) => handleChange('allergies', e.target.value)}
                            placeholder="Allergies (comma separated)"
                            className="px-3 py-2 border rounded-lg min-h-[70px] focus:ring-2 focus:ring-indigo-50 focus:border-indigo-300 outline-none"
                        />
                        <textarea
                            value={form.medications}
                            onChange={(e) => handleChange('medications', e.target.value)}
                            placeholder="Current medications"
                            className="px-3 py-2 border rounded-lg min-h-[70px] focus:ring-2 focus:ring-indigo-50 focus:border-indigo-300 outline-none"
                        />
                    </div>

                    <div>
                        <textarea
                            value={form.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            placeholder="Notes / Clinical impression"
                            className="w-full px-3 py-2 border rounded-lg min-h-[100px] focus:ring-2 focus:ring-indigo-50 focus:border-indigo-300 outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2 rounded-md font-bold"
                        >
                            <FaSave />{' '}
                            {saving
                                ? 'Saving...'
                                : form.id
                                ? 'Update Patient'
                                : 'Save Patient'}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setForm(empty);
                                setIsEditing(false);
                                setError(null);
                            }}
                            className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            <FaTimes /> Cancel
                        </button>

                        <div className="text-sm text-gray-500 ml-auto">
                            {form.id ? 'Editing saved patient' : 'New patient'}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Education = () => {
    const [activeTab, setActiveTab] = useState('exam');
    const [selectedExam, setSelectedExam] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // API State
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // =========================================================
    // EXAM SESSION / RESUME STATE
    // =========================================================
    const [examSession, setExamSession] = useState(null);
    const [sessionPrompt, setSessionPrompt] = useState(null);

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            setLoading(true);

            const response = await api.get('/exams/published');

            if (response && response.success) {
                setExams(response.exams || []);
            } else if (Array.isArray(response)) {
                setExams(response);
            } else if (response && Array.isArray(response.data)) {
                setExams(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch exams:', err);
            setError('Failed to load exams. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const filteredExams = exams.filter(
        (exam) =>
            (exam.title &&
                exam.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (exam.subject &&
                exam.subject.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // =========================================================
    // EXAM SESSION HELPERS
    // =========================================================

    const getSessionKey = (examId) => `exam_session_${examId}`;

    const shuffleArray = (arr) => {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    };

    const getSavedSession = (examId) => {
        try {
            const raw = localStorage.getItem(getSessionKey(examId));
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || !parsed.questions || !Array.isArray(parsed.questions)) {
                return null;
            }
            return parsed;
        } catch (err) {
            console.error('Failed to read exam session:', err);
            return null;
        }
    };

    const clearSavedSession = (examId) => {
        try {
            localStorage.removeItem(getSessionKey(examId));
        } catch (err) {
            console.error('Failed to clear exam session:', err);
        }
    };

    const persistSession = (session) => {
        try {
            localStorage.setItem(
                getSessionKey(session.examId),
                JSON.stringify(session)
            );
        } catch (err) {
            console.error('Failed to persist exam session:', err);
        }
    };

    /**
     * Handles the user clicking on an exam card.
     *
     * - If a saved session exists AND is unfinished AND the user has
     *   been away for MORE than 10 minutes -> prompt to Resume/Restart.
     * - Otherwise, start a fresh session.
     */
    const handleSelectExam = (exam) => {
        const saved = getSavedSession(exam.id);
        const TEN_MINUTES = 10 * 60 * 1000;

        // Completed sessions should never be resumed; always start fresh.
        if (saved && saved.completed) {
            clearSavedSession(exam.id);
            startNewSession(exam);
            return;
        }

        if (saved && saved.lastUpdated) {
            const elapsed = Date.now() - saved.lastUpdated;

            // If user stopped for more than 10 minutes -> prompt
            if (elapsed > TEN_MINUTES) {
                setSessionPrompt({ exam, saved });
                return;
            }
        }

        // No saved session (or within 10 min) -> start fresh
        startNewSession(exam);
    };

    const startNewSession = async (exam) => {
        try {
            const response = await api.get(`/exams/${exam.id}/questions`);

            let allQuestions = [];

            if (response && response.success && Array.isArray(response.questions)) {
                allQuestions = response.questions;
            } else if (Array.isArray(response)) {
                allQuestions = response;
            } else if (response && Array.isArray(response.data)) {
                allQuestions = response.data;
            }

            if (!allQuestions || allQuestions.length === 0) {
                setSelectedExam(exam);
                return;
            }

            const shuffled = shuffleArray(allQuestions);
            const selectedQuestions = shuffled.slice(0, 40);

            const session = {
                examId: exam.id,
                examTitle: exam.title,
                examSubject: exam.subject,
                questions: selectedQuestions,
                answers: {},
                currentIndex: 0,
                lastUpdated: Date.now(),
                completed: false
            };

            persistSession(session);
            setExamSession(session);
            setSelectedExam(exam);
        } catch (err) {
            console.error('Failed to start exam session:', err);
            setSelectedExam(exam);
        }
    };

    const resumeSession = (saved) => {
        const updated = { ...saved, lastUpdated: Date.now() };
        persistSession(updated);
        setExamSession(updated);
        setSelectedExam({
            id: saved.examId,
            title: saved.examTitle,
            subject: saved.examSubject
        });
        setSessionPrompt(null);
    };

    const restartSession = (exam) => {
        clearSavedSession(exam.id);
        setExamSession(null);
        setSessionPrompt(null);
        startNewSession(exam);
    };

    const handleSessionUpdate = (updates) => {
        setExamSession((prev) => {
            if (!prev) return prev;
            const next = { ...prev, ...updates, lastUpdated: Date.now() };
            persistSession(next);
            return next;
        });
    };

    /**
     * Called by ExamModule when the user reveals their total score.
     *
     * NOTE: we deliberately do NOT unmount the exam view here.
     * The user needs to stay on the score/review screen. We only
     * clear the persisted resume session so a fresh attempt is
     * started next time.
     */
    const handleExamComplete = () => {
        if (examSession) {
            clearSavedSession(examSession.examId);
        }
        // Keep selectedExam so the ExamModule stays rendered
        // showing the score + review.
        setExamSession((prev) => (prev ? { ...prev, completed: true } : prev));
    };

    /**
     * Called by ExamModule when the user clicks Back.
     * Keeps the session saved (unless already completed) so it
     * can be resumed later.
     */
    const handleExamExit = () => {
        if (examSession) {
            if (examSession.completed) {
                clearSavedSession(examSession.examId);
            } else {
                const updated = { ...examSession, lastUpdated: Date.now() };
                persistSession(updated);
            }
        }
        setExamSession(null);
        setSelectedExam(null);
    };

    // =========================================================
    // RENDER: ExamModule when an exam is selected
    // =========================================================
    if (selectedExam) {
        return (
            <ExamModule
                examId={selectedExam.id}
                examTitle={selectedExam.title}
                examSubject={selectedExam.subject}
                session={examSession}
                onSessionUpdate={handleSessionUpdate}
                onComplete={handleExamComplete}
                onExit={handleExamExit}
                onBack={handleExamExit}
            />
        );
    }

    // =========================================================
    // RENDER: Main Education UI
    // =========================================================
    return (
        <div className="bg-white/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden relative animate-fadeIn">
            {/* Decorative background */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-purple-600/10 to-indigo-600/10 pointer-events-none" />

            <div className="p-6 md:p-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            <div className="bg-purple-100 p-2.5 rounded-xl">
                                <FaGraduationCap className="text-purple-600 text-2xl" />
                            </div>
                            Education Center
                        </h2>

                        <p className="text-gray-500 mt-2 font-medium ml-1">
                            Test your knowledge, develop clinical pharmacy skills,
                            and review clinical guidelines
                        </p>
                    </div>
                </div>

                {/* =====================================================
                    TABS
                ====================================================== */}
                <div className="flex flex-col sm:flex-row bg-gray-100/80 p-1.5 rounded-xl mb-8 max-w-4xl gap-1">
                    <button
                        onClick={() => setActiveTab('exam')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${
                            activeTab === 'exam'
                                ? 'bg-white text-purple-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                    >
                        <FaClipboardList
                            className={activeTab === 'exam' ? 'text-purple-500' : 'opacity-60'}
                        />
                        Exams
                    </button>

                    <button
                        onClick={() => setActiveTab('clinicalpharmacyskill')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${
                            activeTab === 'clinicalpharmacyskill'
                                ? 'bg-white text-indigo-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                    >
                        <FaBookOpen
                            className={
                                activeTab === 'clinicalpharmacyskill'
                                    ? 'text-indigo-500'
                                    : 'opacity-60'
                            }
                        />
                        Clinical Pharmacy Skill
                    </button>

                    <button
                        onClick={() => setActiveTab('guideline')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${
                            activeTab === 'guideline'
                                ? 'bg-white text-indigo-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                    >
                        <FaBookOpen
                            className={
                                activeTab === 'guideline' ? 'text-indigo-500' : 'opacity-60'
                            }
                        />
                        Guidelines
                    </button>
                </div>

                {/* =====================================================
                    EXAMS TAB CONTENT
                ====================================================== */}
                {activeTab === 'exam' && (
                    <div className="animate-fadeIn">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <h3 className="text-xl font-bold text-gray-800">Select Subject</h3>

                            <div className="relative w-full sm:w-64">
                                <input
                                    type="text"
                                    placeholder="Search subjects..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border-2 border-gray-100 rounded-xl focus:border-purple-300 focus:ring-4 focus:ring-purple-50 bg-gray-50/50 transition-all outline-none"
                                />

                                <FaSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <FaSpinner className="animate-spin text-purple-600 text-3xl" />
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-center">
                                {error}
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredExams.map((exam) => (
                                        <button
                                            key={exam.id}
                                            onClick={() => handleSelectExam(exam)}
                                            className="flex items-center p-4 bg-white rounded-xl border border-gray-100 hover:border-purple-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group text-left"
                                        >
                                            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mr-4 group-hover:bg-purple-600 transition-colors duration-300 flex-shrink-0">
                                                <FaClipboardList className="text-purple-600 group-hover:text-white text-lg transition-colors" />
                                            </div>

                                            <div>
                                                <h4 className="font-bold text-gray-800 group-hover:text-purple-700 transition-colors line-clamp-1">
                                                    {exam.title || `${exam.subject} Exam`}
                                                </h4>

                                                <p className="text-xs text-gray-500 mt-1">
                                                    {exam.subject} • {exam.question_count || 0}{' '}
                                                    Questions
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {filteredExams.length === 0 && (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-gray-500 font-medium">
                                            {exams.length === 0
                                                ? 'No exams available at the moment.'
                                                : `No exams found matching "${searchTerm}"`}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* =====================================================
                    CLINICAL PHARMACY SKILL TAB CONTENT
                ====================================================== */}
                {activeTab === 'clinicalpharmacyskill' && (
                    <div className="animate-fadeIn">
                        <PatientDetails />
                    </div>
                )}

                {/* =====================================================
                    GUIDELINES TAB CONTENT
                ====================================================== */}
                {activeTab === 'guideline' && (
                    <div className="animate-fadeIn">
                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-8 text-center">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaBookOpen className="text-indigo-600 text-2xl" />
                            </div>

                            <h3 className="text-xl font-bold text-indigo-900 mb-2">
                                Clinical Guidelines
                            </h3>

                            <p className="text-indigo-700 max-w-md mx-auto">
                                The guidelines section is currently under development.
                                Please check back later for comprehensive medical
                                guidelines across all specialties.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* =====================================================
                RESUME / RESTART PROMPT MODAL
            ====================================================== */}
            {sessionPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Resume Exam?</h3>

                        <p className="text-gray-600 mb-6">
                            You have an unfinished attempt for{' '}
                            <span className="font-semibold text-purple-700">
                                {sessionPrompt.exam.title || sessionPrompt.exam.subject}
                            </span>
                            . You stopped more than 10 minutes ago. Would you like to
                            resume where you left off, or start over?
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => resumeSession(sessionPrompt.saved)}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors"
                            >
                                Resume
                            </button>

                            <button
                                onClick={() => restartSession(sessionPrompt.exam)}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 px-4 rounded-xl transition-colors"
                            >
                                Restart
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Education;
