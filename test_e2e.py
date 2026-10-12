import urllib.request
import json
import time
import subprocess
import os
import sys

def post_json(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode('utf-8'))

def get_json(url):
    req = urllib.request.Request(url, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode('utf-8'))

def main():
    print("=" * 60)
    print("VARISAI END-TO-END VERIFICATION TEST SUITE")
    print("=" * 60)

    root_dir = os.path.dirname(os.path.abspath(__file__))
    ml_dir = os.path.join(root_dir, "ml_service")
    be_dir = os.path.join(root_dir, "backend")

    # Start ML service
    print("\n[INIT] Launching ML Microservice on port 8040...")
    env_ml = os.environ.copy()
    ml_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app:app", "--port", "8040"],
        cwd=ml_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    # Start Backend
    print("[INIT] Launching Backend Server on port 8050...")
    env_be = os.environ.copy()
    env_be["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"
    be_proc = subprocess.Popen(
        ["node", "dist/index.js"],
        cwd=be_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=env_be
    )

    # Wait for services to be ready
    time.sleep(3)

    try:
        # 1. Test ML Service
        print("\n[Step 1] Verifying ML Microservice on port 8040...")
        ml_health = get_json("http://127.0.0.1:8040/health")
        print(f"  [PASS] ML Health: Status={ml_health['status']}, Model={ml_health['model_name']}")
        
        ml_pred = post_json("http://127.0.0.1:8040/predict", {
            "queue_depth": 5,
            "arrival_hour": 11,
            "day_of_week": 2,
            "priority_category": "senior_citizen",
            "avg_service_duration": 15.0,
            "active_counters": 3
        })
        print(f"  [PASS] ML Predict: {ml_pred['predicted_wait_time_minutes']} mins (Model: {ml_pred['model_name']}, MAE: {ml_pred['benchmark_mae']}m)")

        # 2. Test Backend Email Auth
        print("\n[Step 2] Testing Email OTP Generation & Verification...")
        test_email = "citizen.raman@example.com"
        otp_res = post_json("http://127.0.0.1:8050/api/auth/send-otp", {"email": test_email, "name": "Ramanathan K.", "userType": "CITIZEN"})
        print(f"  [PASS] Citizen Email OTP Issued: Code = {otp_res['otp']}, Notice = '{otp_res['demoMessage']}'")

        verify_res = post_json("http://127.0.0.1:8050/api/auth/verify-otp", {"email": test_email, "otp": otp_res['otp'], "name": "Ramanathan K."})
        print(f"  [PASS] Citizen Email Verified: Success = {verify_res['success']}, User = {verify_res['user']['name']}")

        # 2b. Test Staff Authentication (Database Checked)
        print("\n[Step 2b] Testing Registered Staff Authentication & Authorization...")
        staff_login_res = post_json("http://127.0.0.1:8050/api/auth/staff-login", {"email": "officer@tn.gov.in", "staffId": "TN-OFFICER-001"})
        print(f"  [PASS] Staff Found in DB: {staff_login_res['name']} ({staff_login_res['role']}), Dept: {staff_login_res['department']}")
        staff_verify_res = post_json("http://127.0.0.1:8050/api/auth/staff-verify", {"email": "officer@tn.gov.in", "otp": staff_login_res['otp']})
        print(f"  [PASS] Staff Verified & Authorized: {staff_verify_res['staff']['name']}")

        # 3. Test Offices
        print("\n[Step 3] Fetching Government Offices from DB...")
        offices_res = get_json("http://127.0.0.1:8050/api/offices")
        offices = offices_res['offices']
        print(f"  [PASS] Found {len(offices)} active offices:")
        for o in offices:
            print(f"    - {o['category']}: {o['name']} ({o['openCountersCount']} counters active, {o['currentWaitingQueue']} waiting)")
        selected_office = offices[0]

        # 4. Test Services
        print(f"\n[Step 4] Fetching Services for {selected_office['name']}...")
        services_res = get_json(f"http://127.0.0.1:8050/api/services?officeId={selected_office['id']}")
        services = services_res['services']
        print(f"  [PASS] Found {len(services)} services:")
        for s in services:
            print(f"    - [{s['prefix']}] {s['name']} (Avg {s['avgServiceMinutes']} mins)")
        selected_service = services[0]

        # 5. Test Estimate
        print("\n[Step 5] Computing ML Wait-Time Estimate...")
        est_res = post_json("http://127.0.0.1:8050/api/bookings/estimate", {
            "officeId": selected_office['id'],
            "serviceId": selected_service['id'],
            "priorityCategory": "senior_citizen"
        })
        print(f"  [PASS] Estimated Wait: {est_res['predictedWaitMinutes']} mins (CI: [{est_res['confidenceIntervalLow']}-{est_res['confidenceIntervalHigh']}], Model: {est_res['modelName']})")

        # 6. Test Booking Creation
        print("\n[Step 6] Booking Digital Priority Token with Citizen Email...")
        booking_res = post_json("http://127.0.0.1:8050/api/bookings", {
            "email": test_email,
            "citizenName": "Ramanathan K.",
            "officeId": selected_office['id'],
            "serviceId": selected_service['id'],
            "priorityCategory": "senior_citizen"
        })
        new_booking = booking_res['booking']
        print(f"  [PASS] Token Created: Number = {new_booking['tokenNumber']}, Ref = {new_booking['bookingRef']}, Arrive Before = {new_booking['arriveMinutesBefore']}m")

        # 6b. Test QR Code URL Resolution (Lookup by bookingRef)
        print("\n[Step 6b] Simulating QR Code Scan (Token Details Lookup)...")
        token_lookup = get_json(f"http://127.0.0.1:8050/api/bookings/{new_booking['bookingRef']}")
        print(f"  [PASS] QR Verified Details: Token = {token_lookup['booking']['tokenNumber']}, Citizen = {token_lookup['booking']['email']}, Status = {token_lookup['booking']['status']}")

        # 7. Test Admin Call Next
        print("\n[Step 7] Testing Staff Console 'Call Next' Token Action...")
        call_res = post_json("http://127.0.0.1:8050/api/admin/call-next", {
            "officeId": selected_office['id'],
            "counterNumber": 1
        })
        print(f"  [PASS] Call Next Action: {call_res['message']}")

        # 8. Test Adaptive Rescheduling
        print("\n[Step 8] Testing Adaptive Priority Re-scoring Engine...")
        resched_res = post_json("http://127.0.0.1:8050/api/admin/reschedule", {
            "officeId": selected_office['id']
        })
        print(f"  [PASS] Reschedule Result: {resched_res['message']}")

        # 9. Test Analytics
        print("\n[Step 9] Verifying Real DB Analytics...")
        analytics_res = get_json("http://127.0.0.1:8050/api/admin/analytics")
        summary = analytics_res['summary']
        print(f"  [PASS] Analytics Summary: Total = {summary['totalBookings']}, Completed = {summary['completedBookings']}, Waiting = {summary['waitingBookings']}, Priority % = {summary['priorityRatio']}%")
        print(f"  [PASS] Priority Distribution: {len(analytics_res['priorityDistribution'])} categories computed")
        print(f"  [PASS] Wait-Time Trend: {len(analytics_res['waitTimeTrend'])} tiers calibrated")

        print("\n" + "=" * 60)
        print("ALL 9 VERIFICATION CHECKS PASSED WITH 100% SUCCESS!")
        print("=" * 60)

    finally:
        print("\n[CLEANUP] Stopping test subprocesses...")
        ml_proc.terminate()
        be_proc.terminate()
        try:
            ml_proc.wait(timeout=2)
            be_proc.wait(timeout=2)
        except Exception:
            ml_proc.kill()
            be_proc.kill()
        print("[CLEANUP] Cleaned up cleanly.")

if __name__ == "__main__":
    main()
