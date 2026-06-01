# Full verification: test backend recovery with Plumber scenario
$json = @'
{
  "workflowId": "verify_final",
  "scenario": "provider_cancellation",
  "bookingId": "book_wf_5c9ba2a6-644_1780266439006",
  "serviceType": "Plumber",
  "providerCandidates": [
    {"name": "PakFlow Plumbing Services", "candidateId": "p1", "rating": 4.22, "reviewCount": 64, "distanceEstimateKm": 10.1, "isRegistered": true, "bookable": true, "source": "registered"},
    {"name": "Electrician & Plumber in Islamabad", "candidateId": "p2", "rating": 4.9, "reviewCount": 61, "distanceEstimateKm": 6.8, "isRegistered": false, "bookable": false, "source": "google_places"},
    {"name": "Shakir water Tanks Repairing and plumbing services", "candidateId": "p3", "rating": 5.0, "reviewCount": 33, "distanceEstimateKm": 6.9, "isRegistered": false, "bookable": false, "source": "google_places"},
    {"name": "Islamabad plumber and electricians", "candidateId": "p4", "rating": 4.8, "reviewCount": 390, "distanceEstimateKm": 6.9, "isRegistered": false, "bookable": false, "source": "google_places"}
  ]
}
'@

$r = Invoke-RestMethod -Uri 'https://api-zbyomuiceq-uc.a.run.app/resolveDispute' -Method Post -Body $json -ContentType 'application/json'

Write-Host "=== PLUMBER RECOVERY ==="
Write-Host "Cancelled: $($r.recovery.stateAfter.cancelledProvider)"
Write-Host "Backup:    $($r.recovery.stateAfter.replacementProvider)"
Write-Host "Type:      $($r.recovery.stateAfter.serviceType)"
Write-Host "Category:  $($r.recovery.stateAfter.sameCategoryMatch)"
Write-Host ""

# Test 2: Math Tutor scenario
$json2 = @'
{
  "workflowId": "verify_tutor",
  "scenario": "provider_cancellation",
  "bookingId": "book_tutor_test",
  "serviceType": "Math Tutor",
  "providerCandidates": [
    {"name": "EduPak Home Tutors", "candidateId": "t1", "rating": 4.9, "isRegistered": true, "bookable": true, "source": "registered"},
    {"name": "Zahid Home Tuition Islamabad", "candidateId": "t2", "rating": 4.5, "isRegistered": false, "bookable": false, "source": "google_places"},
    {"name": "Islamabad Home Tuition Providers", "candidateId": "t3", "rating": 4.7, "isRegistered": false, "bookable": false, "source": "google_places"},
    {"name": "Open skies academy for math", "candidateId": "t4", "rating": 4.3, "isRegistered": false, "bookable": false, "source": "google_places"}
  ]
}
'@

$r2 = Invoke-RestMethod -Uri 'https://api-zbyomuiceq-uc.a.run.app/resolveDispute' -Method Post -Body $json2 -ContentType 'application/json'

Write-Host "=== MATH TUTOR RECOVERY ==="
Write-Host "Cancelled: $($r2.recovery.stateAfter.cancelledProvider)"
Write-Host "Backup:    $($r2.recovery.stateAfter.replacementProvider)"
Write-Host "Type:      $($r2.recovery.stateAfter.serviceType)"
Write-Host "Category:  $($r2.recovery.stateAfter.sameCategoryMatch)"
Write-Host ""

# HVAC check
$fail = $false
if ($r.recovery.stateAfter.replacementProvider -like "*HVAC*") { Write-Host "FAIL: Plumber got HVAC backup!" -ForegroundColor Red; $fail = $true }
if ($r2.recovery.stateAfter.replacementProvider -like "*HVAC*") { Write-Host "FAIL: Tutor got HVAC backup!" -ForegroundColor Red; $fail = $true }
if (-not $fail) { Write-Host "ALL PASS: No HVAC in any scenario" -ForegroundColor Green }
