# 📋 MEDICATION RECONCILIATION - IMPLEMENTATION GUIDE

## Overview
This guide will help you add full backend support for the "Medication Reconciliation" section in your Clinical Medication Management (CMM) system.

---

## Step 1: Create Database Table

### Run the SQL Script
1. Open **Supabase SQL Editor**
2. Run the file: `CREATE_MEDICATION_RECONCILIATION_TABLE.sql`
3. Verify the table was created successfully

### Table Structure
The `medication_reconciliation` table includes:

**Core Fields:**
- `patient_code` - Links to patient
- `reconciliation_date` - When reconciliation was performed
- `reconciliation_type` - Admission/Transfer/Discharge/Routine
- `medication_name` - Name of the medication
- `dose`, `route`, `frequency` - Medication details
- `reconciliation_status` - Pending/Verified/Discrepancy Found/Resolved
- `action_taken` - Continue/Discontinue/Modify/Add/Hold

**Discrepancy Tracking:**
- `discrepancy_type` - Omission/Commission/Dose Error/etc.
- `discrepancy_details` - Description of the issue
- `resolution_notes` - How it was resolved

**Source Information:**
- `source` - Patient Interview/Previous Records/Family/Pharmacy
- `home_medication` - Boolean flag
- `hospital_medication` - Boolean flag

---

## Step 2: Backend API Routes

### Create `medicationReconciliationRoutes.js`

Create a new file: `AddisBackend/src/routes/medicationReconciliationRoutes.js`

```javascript
import express from 'express';
import { supabase } from '../config/supabase.js';
import { debug } from '../utils/logger.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all reconciliations for a patient
router.get('/:patientCode', authenticateToken, async (req, res) => {
    try {
        const { patientCode } = req.params;
        
        const { data, error } = await supabase
            .from('medication_reconciliation')
            .select('*')
            .eq('patient_code', patientCode)
            .order('reconciliation_date', { ascending: false });

        if (error) throw error;

        res.json({ success: true, reconciliations: data || [] });
    } catch (error) {
        debug.error('Get reconciliations error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new reconciliation
router.post('/', authenticateToken, async (req, res) => {
    try {
        const reconciliationData = {
            ...req.body,
            created_by: req.user.userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('medication_reconciliation')
            .insert([reconciliationData])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, reconciliation: data });
    } catch (error) {
        debug.error('Create reconciliation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update reconciliation
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {
            ...req.body,
            updated_at: new Date().toISOString()
        };

        delete updateData.id;
        delete updateData.created_at;
        delete updateData.created_by;

        const { data, error } = await supabase
            .from('medication_reconciliation')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, reconciliation: data });
    } catch (error) {
        debug.error('Update reconciliation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete reconciliation
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('medication_reconciliation')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ success: true, message: 'Reconciliation deleted successfully' });
    } catch (error) {
        debug.error('Delete reconciliation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get reconciliation statistics
router.get('/stats/:patientCode', authenticateToken, async (req, res) => {
    try {
        const { patientCode } = req.params;
        
        const { data, error } = await supabase
            .from('medication_reconciliation')
            .select('reconciliation_status, action_taken, discrepancy_type')
            .eq('patient_code', patientCode);

        if (error) throw error;

        const stats = {
            total: data.length,
            pending: data.filter(r => r.reconciliation_status === 'Pending').length,
            verified: data.filter(r => r.reconciliation_status === 'Verified').length,
            discrepancies: data.filter(r => r.reconciliation_status === 'Discrepancy Found').length,
            resolved: data.filter(r => r.reconciliation_status === 'Resolved').length,
            continued: data.filter(r => r.action_taken === 'Continue').length,
            discontinued: data.filter(r => r.action_taken === 'Discontinue').length,
            modified: data.filter(r => r.action_taken === 'Modify').length
        };

        res.json({ success: true, stats });
    } catch (error) {
        debug.error('Get stats error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
```

---

## Step 3: Register Routes in App

### Update `app.js` or `server.js`

Add this import:
```javascript
import medicationReconciliationRoutes from './routes/medicationReconciliationRoutes.js';
```

Add this route registration:
```javascript
app.use('/api/medication-reconciliation', medicationReconciliationRoutes);
```

---

## Step 4: Frontend Component Structure

### Recommended Component Structure

```
src/components/Patient/
├── MedicationHistory.jsx (existing)
└── MedicationReconciliation.jsx (new - create this)
```

### Key Features to Include:

1. **Reconciliation Form**
   - Medication name, dose, route, frequency
   - Reconciliation type selector
   - Status dropdown
   - Action taken selector
   - Discrepancy tracking fields

2. **Reconciliation List**
   - Table view of all reconciliations
   - Filter by status, type, date
   - Edit/Delete actions
   - Color-coded status badges

3. **Statistics Dashboard**
   - Total reconciliations
   - Pending vs. Verified
   - Discrepancies found
   - Actions taken breakdown

---

## Step 5: API Integration Example

### Frontend API Calls

```javascript
// Fetch reconciliations
const fetchReconciliations = async (patientCode) => {
    try {
        const response = await api.get(`/medication-reconciliation/${patientCode}`);
        if (response.success) {
            setReconciliations(response.reconciliations);
        }
    } catch (error) {
        console.error('Error fetching reconciliations:', error);
    }
};

// Create reconciliation
const handleSave = async (reconciliationData) => {
    try {
        const response = await api.post('/medication-reconciliation', reconciliationData);
        if (response.success) {
            alert('✅ Reconciliation saved successfully!');
            fetchReconciliations(patientCode);
        }
    } catch (error) {
        console.error('Error saving reconciliation:', error);
        alert('❌ Error saving reconciliation');
    }
};

// Update reconciliation
const handleUpdate = async (id, updateData) => {
    try {
        const response = await api.put(`/medication-reconciliation/${id}`, updateData);
        if (response.success) {
            alert('✅ Reconciliation updated successfully!');
            fetchReconciliations(patientCode);
        }
    } catch (error) {
        console.error('Error updating reconciliation:', error);
    }
};

// Delete reconciliation
const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this reconciliation?')) return;
    
    try {
        const response = await api.delete(`/medication-reconciliation/${id}`);
        if (response.success) {
            alert('✅ Reconciliation deleted successfully!');
            fetchReconciliations(patientCode);
        }
    } catch (error) {
        console.error('Error deleting reconciliation:', error);
    }
};
```

---

## Step 6: Form Data Structure

### Example Form State

```javascript
const [formData, setFormData] = useState({
    patient_code: patientCode,
    reconciliation_date: new Date().toISOString().split('T')[0],
    reconciliation_type: 'Admission',
    performed_by: '',
    performed_by_role: 'Pharmacist',
    
    medication_name: '',
    dose: '',
    route: 'PO',
    frequency: '',
    indication: '',
    
    reconciliation_status: 'Pending',
    action_taken: 'Continue',
    
    discrepancy_type: '',
    discrepancy_details: '',
    resolution_notes: '',
    
    source: 'Patient Interview',
    home_medication: false,
    hospital_medication: false,
    
    prescriber_name: '',
    pharmacy_name: '',
    last_fill_date: '',
    notes: ''
});
```

---

## Step 7: Dropdown Options

### Recommended Options

```javascript
const reconciliationTypes = [
    'Admission',
    'Transfer',
    'Discharge',
    'Routine',
    'Post-Discharge Follow-up'
];

const reconciliationStatuses = [
    { value: 'Pending', color: 'yellow' },
    { value: 'Verified', color: 'green' },
    { value: 'Discrepancy Found', color: 'red' },
    { value: 'Resolved', color: 'blue' }
];

const actionsTaken = [
    'Continue',
    'Discontinue',
    'Modify',
    'Add',
    'Hold'
];

const discrepancyTypes = [
    'Omission',
    'Commission',
    'Dose Error',
    'Frequency Error',
    'Route Error',
    'Duplicate Therapy',
    'Drug Interaction',
    'Allergy Conflict',
    'Other'
];

const sources = [
    'Patient Interview',
    'Previous Medical Records',
    'Family Member',
    'Pharmacy Records',
    'Electronic Health Record',
    'Medication List',
    'Prescription Bottles',
    'Other'
];

const performerRoles = [
    'Pharmacist',
    'Nurse',
    'Doctor',
    'Clinical Officer',
    'Pharmacy Technician',
    'Other'
];
```

---

## Step 8: Testing Checklist

### Backend Testing
- [ ] Run SQL script successfully
- [ ] Verify table exists in Supabase
- [ ] Test GET endpoint: `/api/medication-reconciliation/:patientCode`
- [ ] Test POST endpoint: `/api/medication-reconciliation`
- [ ] Test PUT endpoint: `/api/medication-reconciliation/:id`
- [ ] Test DELETE endpoint: `/api/medication-reconciliation/:id`
- [ ] Test stats endpoint: `/api/medication-reconciliation/stats/:patientCode`

### Frontend Testing
- [ ] Form displays correctly
- [ ] Can create new reconciliation
- [ ] Can edit existing reconciliation
- [ ] Can delete reconciliation
- [ ] Filters work correctly
- [ ] Statistics display correctly
- [ ] Validation works
- [ ] Error handling works

---

## Step 9: Integration with Existing Medication History

### Option 1: Separate Tab
Add a new tab in PatientDetails for "Medication Reconciliation"

### Option 2: Combined View
Add Medication Reconciliation as a section within the existing Medication History component

### Option 3: Modal/Popup
Open reconciliation in a modal from the Medication History page

---

## Quick Start Commands

```bash
# 1. Create the database table
# Run CREATE_MEDICATION_RECONCILIATION_TABLE.sql in Supabase

# 2. Create the backend route file
# Create: AddisBackend/src/routes/medicationReconciliationRoutes.js

# 3. Register the routes
# Update: AddisBackend/src/app.js or server.js

# 4. Restart backend server
cd AddisBackend
npm start

# 5. Test the API
# Use Postman or curl to test endpoints
```

---

## Example API Requests

### Create Reconciliation
```bash
POST /api/medication-reconciliation
Content-Type: application/json
Authorization: Bearer <token>

{
  "patient_code": "PAT260128001",
  "reconciliation_type": "Admission",
  "medication_name": "Metformin",
  "dose": "500",
  "route": "PO",
  "frequency": "Twice daily",
  "reconciliation_status": "Verified",
  "action_taken": "Continue",
  "source": "Patient Interview",
  "home_medication": true
}
```

### Get Reconciliations
```bash
GET /api/medication-reconciliation/PAT260128001
Authorization: Bearer <token>
```

---

## Files Created

1. ✅ `CREATE_MEDICATION_RECONCILIATION_TABLE.sql` - Database schema
2. 📝 `MEDICATION_RECONCILIATION_IMPLEMENTATION.md` - This guide
3. ⏳ `medicationReconciliationRoutes.js` - Backend routes (you need to create)
4. ⏳ `MedicationReconciliation.jsx` - Frontend component (you need to create)

---

## Need Help?

If you encounter any issues:
1. Check Supabase logs for database errors
2. Check backend console for API errors
3. Check browser console for frontend errors
4. Verify authentication token is being sent
5. Verify patient_code exists in patients table

---

## Next Steps

1. ✅ Run the SQL script to create the table
2. Create the backend routes file
3. Register the routes in your app
4. Create the frontend component (or I can help with this)
5. Test the complete flow
6. Add validation and error handling
7. Add export/print functionality

Let me know if you need help with any specific part!
