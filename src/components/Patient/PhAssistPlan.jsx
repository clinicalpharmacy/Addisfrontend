import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
    FaClipboardList,
    FaEdit,
    FaSave,
    FaTrash,
    FaCalendarAlt,
    FaPills,
    FaUserMd,
    FaFileMedical
} from 'react-icons/fa';

const PhAssistPlan = ({ patientCode }) => {
    const [pharmacyAssessment, setPharmacyAssessment] = useState('');
    const [plan, setPlan] = useState('');
    const [savedPlans, setSavedPlans] = useState([]);
    const [editIndex, setEditIndex] = useState(null);
    const [loading, setLoading] = useState(false);
    const [planType, setPlanType] = useState(''); // now Progress Note (optional)
    const [followUpDate, setFollowUpDate] = useState('');

    useEffect(() => {
        if (patientCode) {
            fetchSavedPlans();
        }
    }, [patientCode]);

    const fetchSavedPlans = async () => {
        try {
            setLoading(true);
            console.log('Fetching plans for patient:', patientCode);
            
            // Convert patientCode to number if it's numeric
            const patientId = isNaN(patientCode) ? patientCode : parseInt(patientCode);
            const result = await api.get(`/plans/patient/${patientId}`);

            console.log('Fetch result:', result);

            if (result.success && result.plans) {
                setSavedPlans(result.plans);
            } else if (result.data && result.data.success && result.data.plans) {
                // Handle nested response structure
                setSavedPlans(result.data.plans);
            } else {
                console.warn('Unexpected response format:', result);
                setSavedPlans([]);
            }
        } catch (error) {
            console.error('Error fetching pharmacy plans:', error);
            console.error('Error details:', error.response?.data || error.message);
            // Don't show alert on fetch errors, just set empty array
            setSavedPlans([]);
        } finally {
            setLoading(false);
        }
    };

    const savePlan = async () => {
        try {
            setLoading(true);

            if (!pharmacyAssessment.trim() || !plan.trim()) {
                alert('Please fill in both Pharmacy Assessment and Plan of Action');
                setLoading(false);
                return;
            }

            // Convert patientCode to number if it's numeric
            const patientId = isNaN(patientCode) ? patientCode : parseInt(patientCode);
            
            const planData = {
                patient_id: patientId,
                plan_type: planType, // Progress Note (optional free text)
                goals: pharmacyAssessment,
                medications: '',
                monitoring: '',
                follow_up: followUpDate || null,
                notes: plan
            };

            console.log('Saving plan data:', planData);

            let result;
            if (editIndex !== null) {
                // Update existing plan
                const planId = isNaN(editIndex) ? editIndex : parseInt(editIndex);
                result = await api.put(`/plans/${planId}`, planData);
            } else {
                // Add new plan
                result = await api.post('/plans/pharmacy-assistance', planData);
            }

            console.log('Save result:', result);

            if (result.success || (result.data && result.data.success)) {
                const successData = result.data || result;
                alert(`Plan ${editIndex !== null ? 'updated' : 'saved'} successfully!`);
                setPharmacyAssessment('');
                setPlan('');
                setFollowUpDate('');
                setPlanType('');
                setEditIndex(null);
                fetchSavedPlans();
            } else {
                throw new Error(result.error || result.data?.error || 'Failed to save plan');
            }
        } catch (error) {
            console.error('Error saving plan:', error);
            const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to save plan';
            alert('Error: ' + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (planItem) => {
        console.log('Editing plan:', planItem);
        setPharmacyAssessment(planItem.goals || '');
        setPlan(planItem.notes || '');
        setPlanType(planItem.plan_type || '');
        setFollowUpDate(planItem.follow_up || planItem.follow_up_date || '');
        setEditIndex(planItem.id);
    };

    const handleDelete = async (planId) => {
        if (!window.confirm('Are you sure you want to delete this plan?')) return;

        try {
            setLoading(true);
            const numericPlanId = isNaN(planId) ? planId : parseInt(planId);
            const result = await api.delete(`/plans/${numericPlanId}`);
            
            console.log('Delete result:', result);
            
            if (result.success || (result.data && result.data.success)) {
                alert('Plan deleted successfully!');
                fetchSavedPlans();
            } else {
                throw new Error(result.error || result.data?.error || 'Failed to delete plan');
            }
        } catch (error) {
            console.error('Error deleting plan:', error);
            const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to delete plan';
            alert('Error deleting plan: ' + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-100 p-3 rounded-full">
                    <FaClipboardList className="text-green-600 text-xl" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Pharmacy Assessment & Plan</h2>
                    <p className="text-gray-600">For Patient: {patientCode}</p>
                </div>
            </div>

            {/* Input Form */}
            <div className="mb-8">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                        <FaFileMedical />
                        {editIndex !== null ? 'Edit Assessment & Plan' : 'New Assessment & Plan'}
                    </h3>

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

                        <div className="flex gap-3">
                            <button
                                onClick={savePlan}
                                disabled={loading}
                                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 disabled:opacity-50"
                            >
                                <FaSave /> {loading ? 'Saving...' : (editIndex !== null ? 'Update Plan' : 'Save Plan')}
                            </button>

                            {editIndex !== null && (
                                <button
                                    onClick={() => {
                                        setPharmacyAssessment('');
                                        setPlan('');
                                        setFollowUpDate('');
                                        setPlanType('');
                                        setEditIndex(null);
                                    }}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg"
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Saved Plans */}
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
                    <div className="text-center py-8 text-gray-500">
                        <FaClipboardList className="text-4xl mx-auto mb-3 text-gray-300" />
                        <p>No pharmacy assessments and plans saved yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {savedPlans.map((item, index) => (
                            <div key={item.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-white transition hover:shadow-md">
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="font-semibold text-gray-800">
                                        Plan #{index + 1}
                                    </h4>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(item)} className="text-blue-500 hover:text-blue-700">
                                            <FaEdit /> Edit
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700">
                                            <FaTrash /> Delete
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                
                                {/* Optional: Show follow-up date and progress note if they exist */}
                                {(item.follow_up || item.plan_type) && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        {item.follow_up && (
                                            <div className="text-sm text-gray-600">
                                                <FaCalendarAlt className="inline mr-1" size={12} />
                                                Follow-up: {new Date(item.follow_up).toLocaleDateString()}
                                            </div>
                                        )}
                                        {item.plan_type && (
                                            <div className="text-sm text-gray-600 mt-1">
                                                <FaFileMedical className="inline mr-1" size={12} />
                                                Progress Note: {item.plan_type}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhAssistPlan;
