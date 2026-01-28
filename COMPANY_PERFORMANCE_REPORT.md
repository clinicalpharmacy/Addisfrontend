# 📊 COMPANY ADMIN PERFORMANCE REPORT - IMPLEMENTATION GUIDE

## Overview
Company admins can now view comprehensive performance reports for all users in their company, tracking patients, medications, assessments, plans, outcomes, and costs.

---

## ✅ Files Created

1. **Backend API**: `AddisBackend/src/routes/performanceRoutes.js`
2. **Frontend Component**: `src/pages/CompanyPerformanceReport.jsx`
3. **This Guide**: `COMPANY_PERFORMANCE_REPORT.md`

---

## Step 1: Register Backend Routes

### Update `app.js` or `server.js`

Add the import:
```javascript
import performanceRoutes from './routes/performanceRoutes.js';
```

Add the route registration:
```javascript
app.use('/api/performance', performanceRoutes);
```

### Example (in `app.js`):
```javascript
// ... other imports
import performanceRoutes from './routes/performanceRoutes.js';

// ... middleware setup

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/performance', performanceRoutes); // ← ADD THIS
// ... other routes
```

---

## Step 2: Add Route to Frontend

### Update `App.jsx` or your router configuration

```javascript
import CompanyPerformanceReport from './pages/CompanyPerformanceReport';

// In your routes:
<Route 
    path="/company-performance" 
    element={<CompanyPerformanceReport />} 
/>
```

### Example (in `App.jsx`):
```javascript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CompanyPerformanceReport from './pages/CompanyPerformanceReport';

function App() {
    return (
        <Router>
            <Routes>
                {/* ... other routes */}
                <Route path="/company-performance" element={<CompanyPerformanceReport />} />
            </Routes>
        </Router>
    );
}
```

---

## Step 3: Add Navigation Link

### Update Sidebar Component

Add a link for company admins to access the performance report:

```javascript
// In Sidebar.jsx or your navigation component

{user?.account_type === 'company_admin' && (
    <Link 
        to="/company-performance"
        className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-lg transition"
    >
        <FaChartLine className="text-blue-600" />
        <span>Performance Report</span>
    </Link>
)}
```

---

## API Endpoints

### 1. Get Company Performance Report
```
GET /api/performance/company-performance
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "report": {
    "company_id": "uuid",
    "generated_at": "2026-01-28T09:00:00Z",
    "generated_by": "user-uuid",
    "user_performance": [
      {
        "user_id": "uuid",
        "email": "user@example.com",
        "full_name": "John Doe",
        "role": "user",
        "joined_at": "2026-01-01T00:00:00Z",
        "days_active": 27,
        "total_patients": 15,
        "total_medications": 45,
        "total_assessments": 12,
        "total_plans": 10,
        "total_outcomes": 8,
        "total_cost_managed": 50000,
        "patients_per_day": 0.56,
        "avg_medications_per_patient": 3.0,
        "recent_activity": {
          "patients": 5,
          "medications": 12,
          "assessments": 4
        },
        "outcomes_breakdown": {
          "improved": 5,
          "stable": 2,
          "declined": 1
        }
      }
    ],
    "summary": {
      "total_users": 5,
      "total_patients": 50,
      "total_medications": 150,
      "total_assessments": 40,
      "total_plans": 35,
      "total_outcomes": 30,
      "total_cost_managed": 200000,
      "top_patient_creator": { /* user object */ },
      "top_medication_recorder": { /* user object */ },
      "most_active_last_30_days": { /* user object */ }
    }
  }
}
```

### 2. Get Individual User Performance
```
GET /api/performance/user-performance/:userId
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "performance": {
    "user_id": "uuid",
    "patients": [ /* array of patient objects */ ],
    "medications": [ /* array of medication objects */ ],
    "assessments": [ /* array of assessment objects */ ],
    "plans": [ /* array of plan objects */ ],
    "outcomes": [ /* array of outcome objects */ ]
  }
}
```

---

## Features

### 📊 Summary Dashboard
- **Total Users**: Count of all company users
- **Total Patients**: All patients managed by the company
- **Total Medications**: All medication records
- **Total Assessments**: All clinical assessments
- **Total Plans**: All pharmacy plans
- **Total Outcomes**: All patient outcomes
- **Total Cost Managed**: Sum of all costs

### 🏆 Top Performers
- **Top Patient Creator**: User who created the most patients
- **Top Medication Recorder**: User who recorded the most medications
- **Most Active (30 Days)**: User with highest recent activity

### 📋 User Performance Table
Sortable columns:
- User name and email
- Total patients
- Total medications (with avg per patient)
- Total assessments
- Recent activity (last 30 days)
- Activity rate (patients per day)
- Total cost managed

### 🔄 Actions
- **Refresh**: Reload the latest data
- **Print**: Print-friendly view
- **Export CSV**: Download data as CSV file

---

## Metrics Explained

### Overall Metrics
- **Total Patients**: Number of patients created by the user
- **Total Medications**: Number of medication records
- **Total Assessments**: Number of clinical assessments
- **Total Plans**: Number of pharmacy plans
- **Total Outcomes**: Number of patient outcomes recorded
- **Total Cost Managed**: Sum of all patient costs

### Activity Rates
- **Patients Per Day**: Average patients created per day since joining
- **Avg Medications Per Patient**: Average number of medications per patient

### Recent Activity (Last 30 Days)
- **Patients**: New patients in last 30 days
- **Medications**: New medication records in last 30 days
- **Assessments**: New assessments in last 30 days

### Outcomes Breakdown
- **Improved**: Patients with improved outcomes
- **Stable**: Patients with stable outcomes
- **Declined**: Patients with declined outcomes

---

## Access Control

### Who Can Access?
- ✅ **Company Admins**: Full access to all company user performance
- ✅ **System Admins**: Full access to all companies
- ❌ **Regular Users**: Cannot access (403 Forbidden)

### Security Features
- JWT authentication required
- Company ID verification
- Role-based access control
- User can only view their own company's data

---

## Testing

### Test as Company Admin

1. **Login** as a company admin user
2. **Navigate** to `/company-performance`
3. **Verify** you see:
   - Summary cards with totals
   - Top performers section
   - User performance table
   - All users from your company

### Test Sorting
1. Click column headers to sort
2. Verify ascending/descending order works
3. Try sorting by different columns

### Test Export
1. Click "Export CSV" button
2. Verify CSV file downloads
3. Open CSV and verify data is correct

### Test Refresh
1. Click "Refresh" button
2. Verify data reloads
3. Check for any new data

---

## Database Tables Used

The performance report queries these tables:
- `company_users` - Company membership
- `users` - User information
- `patients` - Patient records
- `medication_history` - Medication records
- `clinical_assessments` - Assessment records
- `pharmacy_plans` - Pharmacy plan records
- `patient_outcomes` - Outcome records
- `patient_costs` - Cost records

---

## Performance Considerations

### Optimization Tips
1. **Caching**: Consider caching report data for 5-10 minutes
2. **Pagination**: For companies with many users, add pagination
3. **Date Filters**: Add date range filters to limit data
4. **Background Jobs**: Generate reports asynchronously for large datasets

### Current Limitations
- No date range filtering (shows all-time data)
- No pagination (loads all users at once)
- No real-time updates (manual refresh required)

---

## Future Enhancements

### Suggested Features
1. **Date Range Filters**: Filter by custom date ranges
2. **Charts/Graphs**: Visual representation of data
3. **Drill-Down**: Click user to see detailed breakdown
4. **Scheduled Reports**: Email reports weekly/monthly
5. **Comparison**: Compare performance across time periods
6. **Goals/Targets**: Set and track performance goals
7. **Export to PDF**: Generate PDF reports
8. **Real-time Updates**: WebSocket for live data

---

## Troubleshooting

### Issue: "Access denied" error
**Solution**: Verify user has `account_type = 'company_admin'` in database

### Issue: No data showing
**Solution**: 
- Check if company has any users
- Verify company_id is set correctly
- Check if users have created any patients

### Issue: Performance is slow
**Solution**:
- Add database indexes on frequently queried columns
- Implement caching
- Add pagination for large datasets

### Issue: Export CSV not working
**Solution**:
- Check browser console for errors
- Verify data is loaded before exporting
- Check file download permissions

---

## Example Usage

### Company Admin Workflow
1. Login as company admin
2. Navigate to "Performance Report" from sidebar
3. Review summary metrics
4. Identify top performers
5. Sort table by different metrics
6. Export data for further analysis
7. Share insights with team

### Monitoring Team Performance
- Track which users are most active
- Identify users who may need support
- Recognize high performers
- Monitor recent activity trends
- Analyze cost management efficiency

---

## Integration Checklist

- [ ] Backend routes file created
- [ ] Routes registered in app.js
- [ ] Frontend component created
- [ ] Route added to router
- [ ] Navigation link added to sidebar
- [ ] Tested as company admin
- [ ] Tested sorting functionality
- [ ] Tested export functionality
- [ ] Tested refresh functionality
- [ ] Verified access control works
- [ ] Documentation reviewed

---

## Support

If you encounter any issues:
1. Check browser console for errors
2. Check backend logs for API errors
3. Verify database tables exist and have data
4. Verify user permissions are correct
5. Test API endpoints directly with Postman

---

## Summary

The Company Performance Report provides company admins with comprehensive insights into their team's productivity and performance. It tracks key metrics across patients, medications, assessments, plans, outcomes, and costs, helping identify top performers and areas for improvement.

**Key Benefits**:
- 📊 Data-driven decision making
- 🏆 Recognize top performers
- 📈 Track team productivity
- 💰 Monitor cost management
- 🎯 Identify improvement areas

---

**Ready to use!** Company admins can now access comprehensive performance reports at `/company-performance`.
