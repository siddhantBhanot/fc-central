#!/usr/bin/env python3
"""
Integration verification test suite for backend_service.
Executes end-to-end tests across all versioned /api/v1 routes,
validating JWT authentication, user-scoped conversation isolation,
SQLite persistence, feedback, and error handling.
"""

import os
from pathlib import Path
import sys
import unittest

# Ensure project root is in sys.path
_project_root = Path(__file__).resolve().parents[1]
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from starlette.testclient import TestClient
from backend_service.app.main import app
from backend_service.app.infrastructure.configuration import settings as settings_module


class TestBackendServiceAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        test_db = _project_root / "backend_service" / "data" / "test_api.db"
        if test_db.exists():
            test_db.unlink()
        os.environ["DATABASE_PATH"] = str(test_db)
        os.environ["RAG_CLIENT_MODE"] = "mock"  # Fast mock adapter for automated test suite

        # Reset cached settings and DB
        settings_module._settings = None
        from backend_service.app.infrastructure.persistence import database as db_module
        db_module._db = None

        cls._client_cm = TestClient(app)
        cls.client = cls._client_cm.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls._client_cm.__exit__(None, None, None)

    def test_01_health_check(self):
        """Test GET /api/v1/health returns healthy status and DB responsiveness."""
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["service"], "backend_service")
        self.assertEqual(data["database"], "healthy")
        self.assertIn("X-Request-ID", response.headers)

    def test_02_auth_signup_and_login(self):
        """Test user signup, duplicate detection, and login issuing valid JWT tokens."""
        # 1. Signup
        signup_resp = self.client.post(
            "/api/v1/auth/signup",
            json={
                "email": "alice@freecharge.com",
                "password": "securepassword123",
                "name": "Alice Engineer",
            },
        )
        self.assertEqual(signup_resp.status_code, 201)
        signup_data = signup_resp.json()
        self.assertIn("access_token", signup_data)
        self.assertEqual(signup_data["user"]["email"], "alice@freecharge.com")
        self.assertEqual(signup_data["user"]["name"], "Alice Engineer")

        # 2. Duplicate signup fails
        dup_resp = self.client.post(
            "/api/v1/auth/signup",
            json={
                "email": "alice@freecharge.com",
                "password": "securepassword123",
                "name": "Alice Duplicate",
            },
        )
        self.assertEqual(dup_resp.status_code, 422)

        # 3. Login
        login_resp = self.client.post(
            "/api/v1/auth/login",
            json={
                "email": "alice@freecharge.com",
                "password": "securepassword123",
            },
        )
        self.assertEqual(login_resp.status_code, 200)
        login_data = login_resp.json()
        self.assertIn("access_token", login_data)

        # 4. Check /auth/me with Bearer token
        token = login_data["access_token"]
        me_resp = self.client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(me_resp.status_code, 200)
        self.assertEqual(me_resp.json()["email"], "alice@freecharge.com")

    def test_03_unauthenticated_requests_fail(self):
        """Test protected routes reject requests without valid Bearer tokens with 401."""
        # 1. Unauthenticated query
        resp_query = self.client.post("/api/v1/query", json={"query": "hello"})
        self.assertEqual(resp_query.status_code, 401)
        self.assertEqual(resp_query.json()["code"], "AUTHENTICATION_FAILED")

        # 2. Unauthenticated conversations
        resp_conv = self.client.get("/api/v1/conversations")
        self.assertEqual(resp_conv.status_code, 401)

        # 3. Unauthenticated knowledge trigger
        resp_knowledge = self.client.post("/api/v1/knowledge", json={"service": "income-assessment-service"})
        self.assertEqual(resp_knowledge.status_code, 401)

    def test_04_query_execution_and_persistence(self):
        """Test POST /api/v1/query with JWT creates conversation and returns citations."""
        # Login Alice
        login = self.client.post(
            "/api/v1/auth/login",
            json={"email": "alice@freecharge.com", "password": "securepassword123"},
        ).json()
        auth_headers = {"Authorization": f"Bearer {login['access_token']}"}

        payload = {
            "query": "What is Zenith and what is it used for?",
            "service": "income-assessment-service",
            "top_k": 5,
        }
        response = self.client.post("/api/v1/query", json=payload, headers=auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("conversation_id", data)
        self.assertIn("message_id", data)
        self.assertIn("answer", data)
        self.assertIn("sources", data)

        cid = data["conversation_id"]

        # Verify conversation history from SQLite
        conv_resp = self.client.get(f"/api/v1/conversations/{cid}", headers=auth_headers)
        self.assertEqual(conv_resp.status_code, 200)
        conv_data = conv_resp.json()
        self.assertEqual(conv_data["id"], cid)
        self.assertEqual(len(conv_data["messages"]), 2)  # 1 user + 1 assistant

    def test_05_user_conversation_isolation(self):
        """Test strict user-scoped conversation isolation across different users."""
        # 1. Alice creates a conversation
        alice_login = self.client.post(
            "/api/v1/auth/login",
            json={"email": "alice@freecharge.com", "password": "securepassword123"},
        ).json()
        alice_headers = {"Authorization": f"Bearer {alice_login['access_token']}"}

        alice_query = self.client.post(
            "/api/v1/query",
            json={"query": "Alice private architecture question"},
            headers=alice_headers,
        ).json()
        alice_cid = alice_query["conversation_id"]

        # 2. Register Bob
        bob_signup = self.client.post(
            "/api/v1/auth/signup",
            json={
                "email": "bob@freecharge.com",
                "password": "bobpassword123",
                "name": "Bob Reviewer",
            },
        ).json()
        bob_headers = {"Authorization": f"Bearer {bob_signup['access_token']}"}

        # 3. Bob lists conversations -> Bob should see ZERO conversations
        bob_list = self.client.get("/api/v1/conversations", headers=bob_headers)
        self.assertEqual(bob_list.status_code, 200)
        bob_convs = bob_list.json()
        self.assertEqual(len(bob_convs), 0, "Bob must not see Alice's conversations")

        # 4. Bob attempts to access Alice's conversation by ID -> 404 (isolation enforced)
        bob_get = self.client.get(f"/api/v1/conversations/{alice_cid}", headers=bob_headers)
        self.assertEqual(bob_get.status_code, 404)

        # 5. Bob creates his own conversation
        bob_query = self.client.post(
            "/api/v1/query",
            json={"query": "Bob query regarding KYC"},
            headers=bob_headers,
        ).json()
        bob_cid = bob_query["conversation_id"]

        # 6. Bob now sees only 1 conversation
        bob_list_after = self.client.get("/api/v1/conversations", headers=bob_headers).json()
        self.assertEqual(len(bob_list_after), 1)
        self.assertEqual(bob_list_after[0]["id"], bob_cid)

        # 7. Alice lists conversations -> Alice sees only Alice's conversations
        alice_list = self.client.get("/api/v1/conversations", headers=alice_headers).json()
        alice_ids = [c["id"] for c in alice_list]
        self.assertIn(alice_cid, alice_ids)
        self.assertNotIn(bob_cid, alice_ids)

    def test_06_knowledge_ingestion_with_auth(self):
        """Test POST /api/v1/knowledge triggers ingestion job when authenticated."""
        alice_login = self.client.post(
            "/api/v1/auth/login",
            json={"email": "alice@freecharge.com", "password": "securepassword123"},
        ).json()
        alice_headers = {"Authorization": f"Bearer {alice_login['access_token']}"}

        response = self.client.post(
            "/api/v1/knowledge",
            json={"service": "income-assessment-service"},
            headers=alice_headers,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("job_id", data)
        self.assertEqual(data["status"], "completed")

    def test_07_error_handling_and_request_id(self):
        """Test error handling produces standardized JSON schema with request_id."""
        # 1. 422 on invalid request body
        bad_response = self.client.post("/api/v1/auth/signup", json={"email": "invalid"})
        self.assertEqual(bad_response.status_code, 422)
        err_data = bad_response.json()
        self.assertIn("code", err_data)
        self.assertIn("message", err_data)
        self.assertIn("request_id", err_data)
        self.assertIn("X-Request-ID", bad_response.headers)
        self.assertEqual(err_data["request_id"], bad_response.headers["X-Request-ID"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
