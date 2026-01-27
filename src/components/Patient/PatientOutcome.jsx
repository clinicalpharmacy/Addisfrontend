import React, { useState, useEffect } from 'react';
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
            }
        } catch (error) {
            console.error('Error fetching outcomes:', error);
        } finally {
            setLoading(false);
        }
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
        }
    };

    const getStatusColor = (status) => {
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
