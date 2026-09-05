#!/usr/bin/env python3
"""
Integration verification test suite for backend_service.
Executes end-to-end tests across all versioned /api/v1 routes,
validating SQLite persistence, conversation memory, feedback, and error handling.
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
        # Set database path to a temporary test DB
        test_db = _project_root / "backend_service" / "data" / "test_api.db"
        if test_db.exists():
            test_db.unlink()
        os.environ["DATABASE_PATH"] = str(test_db)
        os.environ["RAG_CLIENT_MODE"] = "mock"  # Use fast mock adapter for automated test suite

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

    def test_02_query_execution_and_persistence(self):
        """Test POST /api/v1/query creates a conversation, persists messages, and returns citations."""
        payload = {
            "query": "What is Zenith and what is it used for?",
            "service": "income-assessment-service",
            "top_k": 5,
        }
        response = self.client.post("/api/v1/query", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn("conversation_id", data)
        self.assertIn("message_id", data)
        self.assertIn("answer", data)
        self.assertTrue(len(data["sources"]) > 0)
        self.assertIn("X-Request-ID", response.headers)

        conv_id = data["conversation_id"]
        msg_id = data["message_id"]

        # Verify conversation history from SQLite
        hist_response = self.client.get(f"/api/v1/conversations/{conv_id}")
        self.assertEqual(hist_response.status_code, 200)
        hist_data = hist_response.json()
        self.assertEqual(hist_data["id"], conv_id)
        # Should have 2 messages: user query and assistant answer
        self.assertEqual(len(hist_data["messages"]), 2)
        self.assertEqual(hist_data["messages"][0]["role"], "user")
        self.assertEqual(hist_data["messages"][1]["role"], "assistant")

    def test_03_multi_turn_conversation(self):
        """Test multi-turn query appending to an existing conversation."""
        # Turn 1
        turn1 = self.client.post(
            "/api/v1/query",
            json={"query": "Who is the primary handler for personal loans?", "service": "income-assessment-service"},
        )
        self.assertEqual(turn1.status_code, 200)
        conv_id = turn1.json()["conversation_id"]

        # Turn 2 with same conversation_id
        turn2 = self.client.post(
            "/api/v1/query",
            json={
                "query": "What endpoint does that handler expose?",
                "conversation_id": conv_id,
                "service": "income-assessment-service",
            },
        )
        self.assertEqual(turn2.status_code, 200)
        self.assertEqual(turn2.json()["conversation_id"], conv_id)

        # Verify history has 4 messages
        hist_response = self.client.get(f"/api/v1/conversations/{conv_id}")
        hist_data = hist_response.json()
        self.assertEqual(len(hist_data["messages"]), 4)

    def test_04_list_conversations(self):
        """Test GET /api/v1/conversations returns list of conversations."""
        response = self.client.get("/api/v1/conversations")
        self.assertEqual(response.status_code, 200)
        conversations = response.json()
        self.assertTrue(len(conversations) >= 2)
        self.assertIn("id", conversations[0])
        self.assertIn("service", conversations[0])

    def test_05_feedback_submission_and_retrieval(self):
        """Test POST /api/v1/feedback persists feedback and can be retrieved."""
        # Run a query first to get a message ID
        q_resp = self.client.post(
            "/api/v1/query",
            json={"query": "Explain Perfios integration flow"},
        )
        data = q_resp.json()
        msg_id = data["message_id"]
        conv_id = data["conversation_id"]

        # Submit positive feedback
        fb_resp = self.client.post(
            "/api/v1/feedback",
            json={
                "message_id": msg_id,
                "conversation_id": conv_id,
                "rating": "positive",
                "comment": "Accurate Kotlin file references!",
            },
        )
        self.assertEqual(fb_resp.status_code, 200)
        fb_data = fb_resp.json()
        self.assertEqual(fb_data["message_id"], msg_id)
        self.assertEqual(fb_data["rating"], "positive")

        # Retrieve feedback
        get_fb = self.client.get(f"/api/v1/feedback/{msg_id}")
        self.assertEqual(get_fb.status_code, 200)
        list_fb = get_fb.json()
        self.assertEqual(len(list_fb), 1)
        self.assertEqual(list_fb[0]["comment"], "Accurate Kotlin file references!")

    def test_06_knowledge_ingestion_trigger(self):
        """Test POST /api/v1/knowledge triggers ingestion job."""
        response = self.client.post(
            "/api/v1/knowledge",
            json={"service": "income-assessment-service"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("job_id", data)
        self.assertEqual(data["service"], "income-assessment-service")
        self.assertEqual(data["status"], "completed")

    def test_07_error_handling_and_request_id(self):
        """Test error handling produces standardized JSON schema with request_id."""
        # 1. 422 on invalid request body
        bad_response = self.client.post("/api/v1/query", json={"query": ""})  # min_length=1
        self.assertEqual(bad_response.status_code, 422)
        err_data = bad_response.json()
        self.assertIn("code", err_data)
        self.assertIn("message", err_data)
        self.assertIn("request_id", err_data)
        self.assertIn("X-Request-ID", bad_response.headers)
        self.assertEqual(err_data["request_id"], bad_response.headers["X-Request-ID"])

        # 2. 404 on non-existent conversation
        not_found_response = self.client.get("/api/v1/conversations/non-existent-uuid-12345")
        self.assertEqual(not_found_response.status_code, 404)
        nf_data = not_found_response.json()
        self.assertEqual(nf_data["code"], "ENTITY_NOT_FOUND")
        self.assertIn("not found", nf_data["message"])
        self.assertIn("request_id", nf_data)


if __name__ == "__main__":
    unittest.main(verbosity=2)
