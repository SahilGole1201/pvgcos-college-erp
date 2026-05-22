import requests
import json
import time

NOTIFICATION_URL = "https://tapering-gradation-quickness.ngrok-free.dev/api/module-notification"
ERP_BACKEND_URL = "http://localhost:8000/admin/trigger-timetable-alert"

def test_notification_module_directly():
    print("--------------------------------------------------")
    print("1. Testing External Notification Module Directly")
    print(f"URL: {NOTIFICATION_URL}")
    
    payload = {
        "api_key": "EXAM_KEY_2026",
        "module_name": "Examination and Result",
        "event_type": "Time table alert",
        "title": "Timetable ",
        "message": "Lecture Tommorow",
        "recipient_roles": ["student"],
        "delivery_modes": ["email", "whatsapp"],
        "department": "BSc CS"
    }
    
    try:
        response = requests.post(NOTIFICATION_URL, json=payload, headers={"Content-Type": "application/json"})
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except requests.exceptions.ConnectionError:
        print("ERROR: Connection refused. Is the Notification Module running on port 8001?")
    except Exception as e:
        print(f"ERROR: {e}")

def test_erp_backend_endpoint():
    print("\n--------------------------------------------------")
    print("2. Testing ERP Backend Endpoint (/admin/trigger-timetable-alert)")
    print(f"URL: {ERP_BACKEND_URL}")
    
    # This payload matches what your FastAPI endpoint expects
    payload = {
        "department": "BSc CS",
        "message": "Lecture Tommorow"
    }
    
    try:
        response = requests.post(ERP_BACKEND_URL, json=payload, headers={"Content-Type": "application/json"})
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except requests.exceptions.ConnectionError:
        print("ERROR: Connection refused. Is the ERP Backend running on port 8000?")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    print("Starting API Tests...")
    test_notification_module_directly()
    time.sleep(1)
    test_erp_backend_endpoint()
    print("--------------------------------------------------")
    print("Tests completed.")
