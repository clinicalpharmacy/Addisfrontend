import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
    FaClipboardList,
    FaEdit,
    FaSave,
    FaTrash,
    FaCalendarAlt,
    FaFileMedical,
    FaSync,
    FaPlus
} from 'react-icons/fa';

const PhAssistPlan = ({ patientCode, patientId }) => {
    const [pharmacyAssessment, setPharmacyAssessment] = useState('');
    const [plan, setPlan] = useState('');
    const [savedPlans, setSavedPlans] = useState([]);
    const [editIndex, setEditIndex] = useState(null);
    const [loading, setLoading] = useState(false);
    const [planType, setPlanType] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState(null);

    // Use patientId if available, otherwise use patientCode
    const effectivePatientId = patientId || patientCode;

    useEffect(() => {
        if (effectivePatientId) {
            console.log('Fetching plans for patient:', effectivePatientId);
            fetchSavedPlans();
        }
    }, [effectivePatientId]);

    const fetchSavedPlans = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Use the effective patient identifier
            const response = await api.get(`/pharmacy-plans/patient/${effectivePatientId}`);
            console.log('Fetch response:', response);
            
            if (response && response.success) {
                setSavedPlans(response.plans || []);
            } else if (response && response.data && response.data.success) {
                setSavedPlans(response.data.plans || []);
            } else {
                setSavedPlans([]);
            }
        } catch (error) {
            console.error('Error fetching pharmacy plans:', error);
            setError(error.response?.data?.error || error.message || 'Failed to load plans');
            setSavedPlans([]);
        } finally {
            setLoading(false);
        }
    };

    const savePlan = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!pharmacyAssessment.trim() || !plan.trim()) {
                alert('Please fill in both Pharmacy Assessment and Plan of Action');
                setLoading(false);
                return;
            }

            if (!effectivePatientId) {
                alert('Patient information is missing. Please refresh the page.');
                setLoading(false);
                return;
            }

            const planData = {
                patient_code: String(effectivePatientId), // Send as string to handle both numeric and text
                plan_type: planType || null,
                goals: pharmacyAssessment,
                medications: '',
                monitoring: '',
                follow_up: followUpDate || null,
                notes: plan
            };

            console.log('Saving plan data:', planData);

            let result;
            if (editIndex !== null) {
                result = await api.put(`/pharmacy-plans/${editIndex}`, planData);
            } else {
                result = await api.post('/pharmacy-plans', planData);
            }

            console.log('Save response:', result);

            if (result && result.success) {
                alert(`Plan ${editIndex !== null ? 'updated' : 'saved'} successfully!`);
                resetForm();
                await fetchSavedPlans();
            } else {
                throw new Error(result?.error || result?.data?.error || 'Failed to save plan');
            }
        } catch (error) {
            console.error('Error saving plan:', error);
            const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error occurred';
            setError(errorMsg);
            alert('Error: ' + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (planItem) => {
        console.log('Editing plan:', planItem);
        setPharmacyAssessment(planItem.goals || '');
        setPlan(planItem.notes || '');
        setPlanType(planItem.plan_type || '');
        setFollowUpDate(planItem.follow_up || '');
        setEditIndex(planItem.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (planId) => {
        if (!window.confirm('Are you sure you want to delete this plan?')) return;

        try {
            setLoading(true);
            const result = await api.delete(`/pharmacy-plans/${planId}`);
            console.log('Delete response:', result);
            
            if (result && result.success) {
                alert('Plan deleted successfully!');
                await fetchSavedPlans();
            } else {
                throw new Error(result?.error || 'Failed to delete plan');
            }
        } catch (error) {
            console.error('Error deleting plan:', error);
            alert('Error deleting plan: ' + (error.response?.data?.error || error.message || 'Failed'));
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setPharmacyAssessment('');
        setPlan('');
        setFollowUpDate('');
        setPlanType('');
        setEditIndex(null);
        setShowForm(false);
        setError(null);
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-3 md:p-6 overflow-x-hidden max-w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="bg-green-100 p-2 md:p-3 rounded-full flex-shrink-0">
                        <FaClipboardList className="text-green-600 text-lg md:text-xl" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800 truncate">Pharmacy Assessment & Plan</h2>
                        <p className="text-xs md:text-base text-gray-600 flex items-center gap-2 truncate">
                            <span>Patient ID:</span>
                            <span className="font-semibold bg-green-50 px-2 py-1 rounded text-xs md:text-sm">{patientCode || patientId}</span>
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchSavedPlans}
                    className="text-green-600 hover:text-green-800 flex items-center gap-2 px-3 md:px-4 py-2 border border-green-200 rounded-lg hover:bg-green-50 transition text-sm flex-shrink-0"
                >
                    <FaSync className={`${loading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="bg-green-50 p-2 md:p-3 rounded-lg border border-green-100">
                    <div className="text-xs md:text-sm text-green-700">Total Plans</div>
                    <div className="text-lg md:text-xl font-bold text-green-800">{savedPlans.length}</div>
                </div>
                <div className="bg-blue-50 p-2 md:p-3 rounded-lg border border-blue-100">
                    <div className="text-xs md:text-sm text-blue-700">With Follow-up</div>
                    <div className="text-lg md:text-xl font-bold text-blue-800">
                        {savedPlans.filter(p => p.follow_up).length}
                    </div>
                </div>
                <div className="bg-purple-50 p-2 md:p-3 rounded-lg border border-purple-100">
                    <div className="text-xs md:text-sm text-purple-700">With Notes</div>
                    <div className="text-lg md:text-xl font-bold text-purple-800">
                        {savedPlans.filter(p => p.plan_type).length}
                    </div>
                </div>
                <div className="bg-teal-50 p-2 md:p-3 rounded-lg border border-teal-100">
                    <div className="text-xs md:text-sm text-teal-700">Last Month</div>
                    <div className="text-lg md:text-xl font-bold text-teal-800">
                        {savedPlans.filter(p => {
                            if (!p.created_at) return false;
                            const lastMonth = new Date();
                            lastMonth.setMonth(lastMonth.getMonth() - 1);
                            return new Date(p.created_at) > lastMonth;
                        }).length}
                    </div>
                </div>
            </div>

            {/* Toggle Form Button */}
            <div className="mb-4">
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                >
                    <FaPlus />
                    {showForm ? 'Hide Assessment Form' : 'New Assessment & Plan'}
                </button>
            </div>

            {/* Input Form */}
            {showForm && (
                <div className="bg-gray-50 rounded-lg p-3 md:p-6 mb-4 md:mb-8 border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <FaFileMedical />
                            {editIndex !== null ? 'Edit Assessment & Plan' : 'New Assessment & Plan'}
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {/* Progress Note */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Progress Note
                            </label>
                            <textarea
                                value={planType}
                                onChange={(e) => setPlanType(e.target.value)}
                                rows="3"
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500"
                                placeholder="Optional clinical progress note..."
                            />
                        </div>

                        {/* Follow-up Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Follow-up Date
                            </label>
                            <div className="flex items-center">
                                <FaCalendarAlt className="text-gray-400 mr-2" />
                                <input
                                    type="date"
                                    value={followUpDate}
                                    onChange={(e) => setFollowUpDate(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        </div>

                        {/* Pharmacy Assessment */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pharmacy Assessment *
                            </label>
                            <textarea
                                value={pharmacyAssessment}
                                onChange={(e) => setPharmacyAssessment(e.target.value)}
                                rows="4"
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500"
                                placeholder="Document your comprehensive pharmacy assessment..."
                                required
                            />
                        </div>

                        {/* Plan of Action */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Plan of Action *
                            </label>
                            <textarea
                                value={plan}
                                onChange={(e) => setPlan(e.target.value)}
                                rows="4"
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500"
                                placeholder="Outline your recommendations and follow-up plan..."
                                required
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={savePlan}
                                disabled={loading}
                                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 disabled:opacity-50"
                            >
                                <FaSave /> {loading ? 'Saving...' : (editIndex !== null ? 'Update Plan' : 'Save Plan')}
                            </button>

                            {(editIndex !== null || showForm) && (
                                <button
                                    onClick={resetForm}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Saved Plans List */}
            <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <FaClipboardList />
                    Saved Pharmacy Assessments & Plans ({savedPlans.length})
                </h3>

                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                        <p className="text-gray-600 mt-2">Loading plans...</p>
                    </div>
                ) : savedPlans.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                        <FaClipboardList className="text-4xl mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-500">No pharmacy assessments and plans saved yet.</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Click "New Assessment & Plan" to create your first plan
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {savedPlans.map((item, index) => (
                            <div key={item.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-white transition hover:shadow-md">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-2">
                                    <div>
                                        <h4 className="font-semibold text-gray-800">
                                            Plan #{index + 1}
                                        </h4>
                                        {item.follow_up && (
                                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                                <FaCalendarAlt className="text-xs" />
                                                Follow-up: {new Date(item.follow_up).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleEdit(item)} 
                                            className="text-blue-500 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded transition"
                                        >
                                            <FaEdit className="inline mr-1" /> Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(item.id)} 
                                            className="text-red-500 hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded transition"
                                        >
                                            <FaTrash className="inline mr-1" /> Delete
                                        </button>
                                    </div>
                                </div>

                                {item.plan_type && (
                                    <div className="mb-3">
                                        <h5 className="font-medium text-gray-700 mb-1 text-sm">
                                            Progress Note
                                        </h5>
                                        <div className="bg-blue-50 border border-blue-200 rounded p-3 whitespace-pre-wrap text-sm">
                                            {item.plan_type}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h5 className="font-medium text-gray-700 mb-2">
                                            Pharmacy Assessment
                                        </h5>
                                        <div className="bg-white border rounded p-3 whitespace-pre-wrap">
                                            {item.goals}
                                        </div>
                                    </div>
                                    <div>
                                        <h5 className="font-medium text-gray-700 mb-2">
                                            Plan of Action
                                        </h5>
                                        <div className="bg-white border rounded p-3 whitespace-pre-wrap">
                                            {item.notes}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 text-xs text-gray-400">
                                    Created: {new Date(item.created_at).toLocaleString()}
                                    {item.updated_at !== item.created_at && ` | Updated: ${new Date(item.updated_at).toLocaleString()}`}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhAssistPlan;
