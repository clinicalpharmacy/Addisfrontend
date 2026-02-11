@echo off
cd AddisBackend
del /Q test_herl_auth.js reproduce_issue.js new_routes.txt original_routes.txt server.modular.js "console.log(JSON.stringify(r.data"
cd ..
del /Q CDSS_NEW_LAB_TEST_GUIDE.md COMPANY_PERFORMANCE_REPORT.md COMPANY_USER_FIX_SUMMARY.md COMPLETE_FIX_SUMMARY.md IMPLEMENTATION_SUMMARY.md INDIVIDUAL_SUBSCRIPTION_LIMIT.md MEDICATION_RECONCILIATION_IMPLEMENTATION.md PATIENT_DETAILS_UPDATES.md "{"
echo Clean complete.
