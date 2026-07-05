import sys
import os
import urllib.request
import urllib.error
import json

BASE_URL = "http://localhost:8000/api/v1"

def make_request(url, method="GET", data=None, headers=None, is_multipart=False):
    if headers is None:
        headers = {}
    
    req_data = None
    if data is not None:
        if is_multipart:
            req_data = data
        else:
            req_data = json.dumps(data).encode("utf-8")
            headers["Content-Type"] = "application/json"
            
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body else None
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"HTTP Error {e.code}: {err_body}")
        return e.code, json.loads(err_body) if err_body else None

def main():
    print("1. Creating Lesson...")
    status, res = make_request(f"{BASE_URL}/lessons", method="POST", data={"title": "Test Lesson Title"})
    if status != 201:
        print("FAIL: Lesson creation failed.")
        sys.exit(1)
    
    lesson_id = res["id"]
    print(f"SUCCESS: Created lesson {lesson_id}")

    print("\n2. Getting Lesson Details...")
    status, res = make_request(f"{BASE_URL}/lessons/{lesson_id}")
    if status != 200 or res["title"] != "Test Lesson Title":
        print("FAIL: Get lesson details failed.")
        sys.exit(1)
    print("SUCCESS: Lesson details verified.")

    print("\n3. Uploading Transcript...")
    # Construct a multipart boundary and body manually since we are using urllib
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="test.srt"\r\n'
        f"Content-Type: text/plain\r\n\r\n"
        f"1\n00:00:01,000 --> 00:00:04,000\nHello world!\r\n"
        f"--{boundary}--\r\n"
    ).encode("utf-8")
    
    headers = {"Content-Type": f"multipart/form-data; boundary={boundary}"}
    status, res = make_request(
        f"{BASE_URL}/lessons/{lesson_id}/transcript",
        method="POST",
        data=body,
        headers=headers,
        is_multipart=True
    )
    
    if status != 200:
        print("FAIL: Upload transcript failed.")
        sys.exit(1)
    print("SUCCESS: Transcript uploaded:", res)

    print("\n4. Deleting Lesson...")
    status, res = make_request(f"{BASE_URL}/lessons/{lesson_id}", method="DELETE")
    if status != 200:
        print("FAIL: Delete lesson failed.")
        sys.exit(1)
    print("SUCCESS: Lesson deleted.")

    print("\n5. Confirming Deletion...")
    status, res = make_request(f"{BASE_URL}/lessons/{lesson_id}")
    if status != 404:
        print("FAIL: Lesson still accessible after deletion.")
        sys.exit(1)
    print("SUCCESS: Deletion confirmed (404 returned).")
    print("\nALL API UPLOAD TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
