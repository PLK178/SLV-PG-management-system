"""Non-destructive smoke tests for the API exposed through Nginx.

Start the application separately, then run this file with unittest. These tests
only read data or submit invalid payloads, so they do not alter application data.
"""

import json
import os
import unittest
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8080/api").rstrip("/")


def request(path: str, method: str = "GET", payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    headers = {"Content-Type": "application/json"} if data else {}
    http_request = Request(f"{API_BASE_URL}{path}", data=data, headers=headers, method=method)
    try:
        with urlopen(http_request, timeout=10) as response:
            return response.status, json.loads(response.read().decode())
    except HTTPError as error:
        body = error.read().decode()
        status = error.code
        error.close()
        return status, json.loads(body) if body else None
    except URLError as error:
        raise AssertionError(f"Cannot reach API at {API_BASE_URL}: {error.reason}") from error


class ApiSmokeTests(unittest.TestCase):
    def test_admin_login(self):
        status, body = request("/auth/admin/login", "POST", {"email": "admin@gmail.com", "password": "admin"})
        self.assertEqual(status, 200)
        self.assertEqual(body["role"], "admin")
        self.assertEqual(body["email"], "admin@gmail.com")

    def test_rejects_invalid_admin_login(self):
        status, _ = request("/auth/admin/login", "POST", {"email": "admin@gmail.com", "password": "wrong-password"})
        self.assertEqual(status, 401)

    def test_tenant_login(self):
        status, body = request("/auth/tenant/login", "POST", {"email": "alice@example.com", "password": "tenant123"})
        self.assertEqual(status, 200)
        self.assertEqual(body["email"], "alice@example.com")

    def test_read_endpoints_return_lists(self):
        required_fields = {
            "/rooms": {"id", "number", "type", "rent", "floor", "status"},
            "/tenants": {"id", "name", "email", "phone", "room", "joinDate", "paymentStatus"},
            "/payments": {"id", "tenant", "amount", "date", "method", "status"},
            "/complaints": {"id", "tenant", "room", "issue", "severity", "status"},
            "/outings": {"id", "tenant", "room", "departureTime", "expectedReturnTime", "actualReturnTime", "purpose", "status"},
        }
        for path, fields in required_fields.items():
            with self.subTest(path=path):
                status, body = request(path)
                self.assertEqual(status, 200)
                self.assertIsInstance(body, list)
                self.assertGreater(len(body), 0)
                self.assertTrue(fields.issubset(body[0]))

    def test_write_endpoints_validate_payloads_without_changing_data(self):
        for path in ("/rooms", "/tenants", "/payments", "/complaints", "/outings"):
            with self.subTest(path=path):
                status, _ = request(path, "POST", [{}])
                self.assertEqual(status, 422)


if __name__ == "__main__":
    unittest.main()
