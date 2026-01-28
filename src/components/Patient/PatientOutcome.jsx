import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
    FaCheckCircle,
    FaTimesCircle,
    FaUserMd,
    FaEdit,
    FaSave,
    FaTrash,
    FaCalendarAlt,
    FaFileMedical,
    FaChartLine,
    FaNotesMedical
} from 'react-icons/fa';

const PatientOutcome = ({ patientCode }) => {
    const [outcomes, setOutcomes] = useState([]);
    const [formData, setFormData] = useState({
        outcome_status: 'resolved',
        notes: ''
    });
    const [editIndex, setEditIndex] = useState(null);
    const [loading, setLoading] = useState(false);

    const outcomeStatusOptions = [
        { value: 'resolved', label: 'Resolved', color: 'green' },
        { value: 'improved', label: 'Improved', color: 'green' },
        { value: 'stable', label: 'Stable', color: 'blue' },
        { value: 'worsened', label: 'Worsened', color: 'red' },
        { value: 'discharged', label: 'Discharged', color: 'green' },
        { value: 'referred', label: 'Referred', color: 'yellow' },
        { value: 'lost_to_followup', label: 'Lost to Follow-up', color: 'gray' },
        { value: 'deceased', label: 'Deceased', color: 'red' }
    ];

    useEffect(() => {
        fetchOutcomes();
    }, [patientCode]);

    const fetchOutcomes = async () => {
        try {
            setLoading(true);
<<<<<<< HEAD
            const result = await api.get(`/outcomes/patient/${patientCode}`);

            if (result.success && result.outcomes) {
                setOutcomes(result.outcomes);
=======
            const token = localStorage.getItem('token');

            const response = await fetch(
                `http://localhost:3000/api/outcomes/patient/${patientCode}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setOutcomes(result.outcomes || []);
                }
>>>>>>> 87c6b3e4020877166519ea3f54e834b9edbcb268
            }
        } catch (error) {
            console.error('Error fetching outcomes:', error);
        } finally {
            setLoading(false);
        }
<<<<<<< HEAD
    };

    const saveOutcome = async () => {
        try {
            setLoading(true);

            if (!formData.notes.trim()) {
                alert('Please add a progress note');
                setLoading(false);
                return;
            }

            const outcomeData = {
                patient_code: patientCode,
                outcome_type: 'general', // Default since UI removed it
                ...formData
            };

            let result;
            if (editIndex !== null) {
                result = await api.put(`/outcomes/${editIndex}`, outcomeData);
            } else {
                result = await api.post('/outcomes', outcomeData);
            }

            if (result.success) {
                alert(editIndex !== null ? 'Outcome updated successfully!' : 'Outcome recorded successfully!');
                setFormData({
                    outcome_status: 'resolved',
                    notes: ''
                });
                setEditIndex(null);
                fetchOutcomes();
            }
        } catch (error) {
            console.error('Error saving outcome:', error);
            alert('Error saving outcome: ' + (error.message || error.error || 'Failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (outcomeItem) => {
        setFormData({
            outcome_status: outcomeItem.outcome_status || 'resolved',
            notes: outcomeItem.notes || ''
        });
        setEditIndex(outcomeItem.id);
    };

    const handleDelete = async (outcomeId) => {
        if (!window.confirm('Are you sure you want to delete this record?')) {
            return;
        }

        try {
            const result = await api.delete(`/outcomes/${outcomeId}`);
            if (result.success) {
                alert('Record deleted successfully!');
                fetchOutcomes();
            }
        } catch (error) {
            console.error('Error deleting outcome:', error);
            alert('Error deleting outcome: ' + (error.message || error.error || 'Failed'));
=======
    };

    const saveOutcome = async () => {
        try {
            if (!formData.notes.trim()) {
                alert('Please enter outcome notes');
                return;
            }

            setLoading(true);
            const token = localStorage.getItem('token');

            const outcomeData = {
                patient_code: patientCode,
                outcome_status: formData.outcome_status,
                notes: formData.notes.trim(),
                outcome_date: new Date().toISOString()
            };

            const url = editIndex
                ? `http://localhost:3000/api/outcomes/${editIndex}`
                : 'http://localhost:3000/api/outcomes';

            const method = editIndex ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(outcomeData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert('Outcome saved successfully');
                setFormData({ outcome_status: 'resolved', notes: '' });
                setEditIndex(null);
                fetchOutcomes();
            } else {
                throw new Error(result.error || 'Save failed');
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        setFormData({
            outcome_status: item.outcome_status || 'resolved',
            notes: item.notes || ''
        });
        setEditIndex(item.id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this outcome?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `http://localhost:3000/api/outcomes/${id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.ok) {
                fetchOutcomes();
            }
        } catch (error) {
            alert(error.message);
>>>>>>> 87c6b3e4020877166519ea3f54e834b9edbcb268
        }
    };

    const getStatusColor = (status) => {
<<<<<<< HEAD
        const statusObj = outcomeStatusOptions.find(opt => opt.value === status);
        if (!statusObj) return 'bg-gray-100 text-gray-800';

        switch (statusObj.color) {
            case 'green': return 'bg-green-100 text-green-800 border border-green-200';
            case 'red': return 'bg-red-100 text-red-800 border border-red-200';
            case 'blue': return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'yellow': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'gray': return 'bg-gray-100 text-gray-800 border border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'resolved':
            case 'improved':
            case 'discharged':
                return <FaCheckCircle className="text-green-500" />;
            case 'worsened':
            case 'deceased':
                return <FaTimesCircle className="text-red-500" />;
            default:
                return <FaUserMd className="text-blue-500" />;
        }
    };

    const getOutcomeStatusLabel = (status) => {
        const statusObj = outcomeStatusOptions.find(opt => opt.value === status);
        return statusObj ? statusObj.label : status;
=======
        const s = outcomeStatusOptions.find(o => o.value === status);
        if (!s) return 'bg-gray-100 text-gray-800';
        return `bg-${s.color}-100 text-${s.color}-800 border`;
    };

    const getStatusIcon = (status) => {
        if (['resolved', 'improved', 'discharged'].includes(status))
            return <FaCheckCircle className="text-green-500" />;
        if (['worsened', 'deceased'].includes(status))
            return <FaTimesCircle className="text-red-500" />;
        return <FaUserMd className="text-blue-500" />;
>>>>>>> 87c6b3e4020877166519ea3f54e834b9edbcb268
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
                <FaChartLine className="text-teal-600 text-xl" />
                <div>
                    <h2 className="text-2xl font-bold">Patient Outcome</h2>
                    <p className="text-gray-600">Patient: {patientCode}</p>
                </div>
            </div>

<<<<<<< HEAD
            {/* Outcome Form */}
            <div className="mb-8">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                        <FaFileMedical />
                        {editIndex !== null ? 'Edit Patient Outcome' : 'Record Patient Outcome'}
                    </h3>

                    <div className="grid grid-cols-1 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Outcome Status *
                            </label>
                            <select
                                value={formData.outcome_status}
                                onChange={(e) => setFormData({ ...formData, outcome_status: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500"
                            >
                                {outcomeStatusOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Progress Note *
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows="4"
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500"
                            placeholder="Describe the patient's current progress and overall assessment..."
                            required
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={saveOutcome}
                            disabled={loading}
                            className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 disabled:opacity-50"
                        >
                            <FaSave /> {loading ? 'Saving...' : (editIndex !== null ? 'Update Outcome' : 'Save Outcome')}
                        </button>

                        {editIndex !== null && (
                            <button
                                onClick={() => {
                                    setFormData({
                                        outcome_status: 'resolved',
                                        notes: ''
                                    });
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

            {/* Saved Outcomes */}
            <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                    <FaNotesMedical />
                    Outcome History ({outcomes.length})
                </h3>

                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
                        <p className="text-gray-600 mt-2">Loading outcomes...</p>
                    </div>
                ) : outcomes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <FaChartLine className="text-4xl mx-auto mb-3 text-gray-300" />
                        <p>No outcomes recorded yet.</p>
                        <p className="text-sm mt-1">Record the first outcome using the form above.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {outcomes.map((item, index) => (
                            <div key={item.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-white transition hover:shadow-md">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="text-xl">
                                            {getStatusIcon(item.outcome_status)}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-800">
                                                Outcome Entry #{outcomes.length - index}
                                            </h4>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                                    <FaCalendarAlt />
                                                    {new Date(item.created_at).toLocaleString()}
                                                </p>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.outcome_status)}`}>
                                                    {getOutcomeStatusLabel(item.outcome_status)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="text-blue-500 hover:text-blue-700 flex items-center gap-2 px-3 py-1 rounded hover:bg-blue-50"
                                        >
                                            <FaEdit /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="text-red-500 hover:text-red-700 flex items-center gap-2 px-3 py-1 rounded hover:bg-red-50"
                                        >
                                            <FaTrash /> Delete
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h5 className="font-medium text-gray-700 mb-2">Progress Note</h5>
                                    <p className="text-gray-700 bg-white border rounded p-3 whitespace-pre-wrap">
                                        {item.notes}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
=======
            <div className="mb-8 bg-gray-50 p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FaFileMedical />
                    {editIndex ? 'Edit Outcome' : 'Record Outcome'}
                </h3>

                <label className="block text-sm font-medium mb-2">
                    Outcome Status
                </label>
                <select
                    value={formData.outcome_status}
                    onChange={(e) =>
                        setFormData({ ...formData, outcome_status: e.target.value })
                    }
                    className="w-full border rounded p-3 mb-4"
                >
                    {outcomeStatusOptions.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>

                <label className="block text-sm font-medium mb-2">
                    Outcome Notes *
                </label>
                <textarea
                    rows="4"
                    value={formData.notes}
                    onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full border rounded p-3 mb-4"
                />

                <button
                    onClick={saveOutcome}
                    disabled={loading}
                    className="bg-teal-500 text-white px-6 py-3 rounded flex items-center gap-2"
                >
                    <FaSave /> {editIndex ? 'Update Outcome' : 'Save Outcome'}
                </button>
>>>>>>> 87c6b3e4020877166519ea3f54e834b9edbcb268
            </div>

            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaNotesMedical />
                Outcome History ({outcomes.length})
            </h3>

            {outcomes.map((item, i) => (
                <div key={item.id} className="border rounded p-4 mb-4 bg-gray-50">
                    <div className="flex justify-between mb-2">
                        <div className="flex items-center gap-2">
                            {getStatusIcon(item.outcome_status)}
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(item.outcome_status)}`}>
                                {item.outcome_status}
                            </span>
                            <span className="text-sm text-gray-600 flex items-center gap-1">
                                <FaCalendarAlt />
                                {new Date(item.outcome_date || item.created_at).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleEdit(item)}><FaEdit /></button>
                            <button onClick={() => handleDelete(item.id)}><FaTrash /></button>
                        </div>
                    </div>
                    <p className="bg-white border rounded p-3 whitespace-pre-wrap">
                        {item.notes}
                    </p>
                </div>
            ))}
        </div>
    );
};

export default PatientOutcome;
