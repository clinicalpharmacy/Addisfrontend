# Complete Guide: Testing CDSS with New Lab Tests

## Overview
The CDSS RuleEngine now **automatically integrates** any new lab test created in Lab Settings. No code changes needed!

## Step-by-Step Test Procedure

### Step 1: Create a New Lab Test
1. Navigate to **Settings** → **Lab Settings**
2. Click **"New Lab Test Definition"**
3. Fill in the form:
   - **Lab Test Name**: `Serum B12`
   - **Unit**: `pg/mL`
   - **Category**: `Vitamin Panel`
   - **Reference Range**: `200-900`
   - **Description**: `Vitamin B12 blood level`
4. Click **"Create Definition"**

### Step 2: Create a CDSS Rule for the New Lab
1. Navigate to **CDSS** → **Clinical Rules Admin**
2. Click **"Create New Rule"**
3. Fill in the rule details:

**Rule Name**: `Low Vitamin B12 Alert`

**Rule Type**: `lab_monitoring`

**Rule Description**: `Alert when Vitamin B12 levels are below the normal range`

**Rule Condition**:
```json
{
  "all": [
    {
      "fact": "labs.serum_b12",
      "operator": "<",
      "value": 200
    }
  ]
}
```

**Rule Action**:
```json
{
  "message": "Low Vitamin B12 Detected ({{labs.serum_b12}} pg/mL)",
  "recommendation": "Serum B12 is below the 200 pg/mL threshold. Evaluate patient for megaloblastic anemia or neurological symptoms. Consider supplementation.",
  "severity": "high"
}
```

**Severity**: `high`

**DTP Category**: `monitoring_needed`

4. Click **"Create Rule"**

### Step 3: Test with a Patient
1. Navigate to **Patients** → **Add New Patient** (or select existing)
2. Fill in basic patient information
3. Go to the **Labs** tab
4. You should see **"Serum B12 (pg/mL)"** automatically listed under **"Vitamin Panel"**
5. Enter a value: `150` (below threshold)
6. Wait ~1 second for the debounce

### Step 4: Verify CDSS Alert
You should see a **red/orange alert box** at the top:
```
🚨 Real-time Clinical Insights: 1 Alert

⚠️ Low Vitamin B12 Detected (150 pg/mL)
📋 Serum B12 is below the 200 pg/mL threshold. Evaluate patient for 
   megaloblastic anemia or neurological symptoms. Consider supplementation.
```

## How It Works Internally

### 1. Lab Storage (Database)
```
lab_tests table:
┌────────────┬──────┬──────────┬────────────────┐
│ name       │ unit │ category │ reference_range│
├────────────┼──────┼──────────┼────────────────┤
│ Serum B12  │pg/mL │ Vitamin  │ 200-900        │
└────────────┴──────┴──────────┴────────────────┘

patients table (labs JSONB column):
{
  "labs": {
    "Serum B12": "150",
    "hemoglobin": "14.5",
    ...
  }
}
```

### 2. Fact Extraction (RuleEngine.jsx)
```javascript
// Automatically extracts ALL keys from labs JSONB
facts.labs = {
  "serum_b12": 150,      // normalized (lowercase + underscore)
  "serum b12": 150,      // original (lowercase)
  "hemoglobin": 14.5,
  ...
}
```

### 3. Rule Matching (RuleEngine.jsx)
```javascript
// Rule condition: "labs.serum_b12" < 200
// System checks:
// 1. facts.labs["serum_b12"] ✓ Found!
// 2. 150 < 200 ✓ True!
// 3. Trigger alert!
```

## Troubleshooting

### Issue: Lab doesn't appear in patient form
**Solution**: Refresh the page or check that `is_active = true` in Lab Settings

### Issue: Rule doesn't trigger
**Check the browser console** for these debug logs:
```
🧪 Lab Fact Created: facts.labs["serum_b12"] = 150
🔍 Condition Check: "labs.serum_b12" < "200"
📊 Patient Value: 150 (Type: number)
```

### Issue: Case sensitivity problems
**No worries!** The system now handles:
- `labs.serum_b12` ✓
- `labs.Serum_B12` ✓
- `labs.serum b12` ✓
- `labs.SERUM_B12` ✓

## Advanced: Testing Multiple New Labs

You can create multiple labs and rules at once:

### Example 1: Vitamin D
```json
// Lab: Vitamin D (ng/mL), Range: 30-100
// Rule Condition:
{
  "all": [
    {
      "fact": "labs.vitamin_d",
      "operator": "<",
      "value": 30
    }
  ]
}
```

### Example 2: Ferritin (Gender-Specific)
```json
// Lab: Ferritin (ng/mL), Range: 12-300
// Rule Condition:
{
  "all": [
    {
      "fact": "gender",
      "operator": "equals",
      "value": "female"
    },
    {
      "fact": "labs.ferritin",
      "operator": "<",
      "value": 12
    }
  ]
}
```

## Key Takeaways

✅ **No code changes needed** - RuleEngine auto-detects new labs
✅ **Instant integration** - New labs appear immediately in patient forms
✅ **Flexible naming** - Case-insensitive, handles spaces/underscores
✅ **Real-time alerts** - CDSS triggers automatically on value entry
✅ **Scalable** - Add unlimited lab tests without touching code

## Next Steps

1. Test with the Serum B12 example above
2. Create your own custom lab tests
3. Build comprehensive CDSS rules for your workflow
4. Monitor the browser console for debugging if needed

---
**Note**: Make sure your backend server is running and the database connection is active!
