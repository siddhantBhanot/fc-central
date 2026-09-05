from datetime import datetime, timezone
import json
from typing import List, Optional
import uuid

from backend_service.app.domain.interfaces.conversation_repository import ConversationRepository
from backend_service.app.domain.models.conversation import Conversation, Message, MessageRole, SourceCitation
from backend_service.app.infrastructure.persistence.database import Database, get_database


class SqliteConversationRepository(ConversationRepository):
    """SQLite implementation of ConversationRepository using aiosqlite."""

    def __init__(self, db: Optional[Database] = None):
        self.db = db or get_database()

    async def get_or_create_conversation(
        self,
        conversation_id: Optional[str] = None,
        service: str = "income-assessment-service",
        title: Optional[str] = None,
    ) -> Conversation:
        cid = conversation_id or str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        async with self.db.connection() as conn:
            cursor = await conn.execute(
                "SELECT id, service, title, created_at, updated_at FROM conversations WHERE id = ?",
                (cid,),
            )
            row = await cursor.fetchone()
            if row:
                messages = await self.get_messages(cid)
                return Conversation(
                    id=row["id"],
                    service=row["service"],
                    title=row["title"],
                    created_at=datetime.fromisoformat(row["created_at"]),
                    updated_at=datetime.fromisoformat(row["updated_at"]),
                    messages=messages,
                )

            # Insert new conversation
            await conn.execute(
                "INSERT INTO conversations (id, service, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                (cid, service, title, now, now),
            )
            await conn.commit()

            return Conversation(
                id=cid,
                service=service,
                title=title,
                created_at=datetime.fromisoformat(now),
                updated_at=datetime.fromisoformat(now),
                messages=[],
            )

    async def get_conversation(self, conversation_id: str) -> Optional[Conversation]:
        async with self.db.connection() as conn:
            cursor = await conn.execute(
                "SELECT id, service, title, created_at, updated_at FROM conversations WHERE id = ?",
                (conversation_id,),
            )
            row = await cursor.fetchone()
            if not row:
                return None

            messages = await self.get_messages(conversation_id)
            return Conversation(
                id=row["id"],
                service=row["service"],
                title=row["title"],
                created_at=datetime.fromisoformat(row["created_at"]),
                updated_at=datetime.fromisoformat(row["updated_at"]),
                messages=messages,
            )

    async def add_message(self, conversation_id: str, message: Message) -> Message:
        now = datetime.now(timezone.utc).isoformat()
        sources_json = json.dumps([s.to_dict() for s in message.sources])

        async with self.db.connection() as conn:
            # Ensure conversation exists
            cursor = await conn.execute(
                "SELECT id FROM conversations WHERE id = ?", (conversation_id,)
            )
            if not await cursor.fetchone():
                await conn.execute(
                    "INSERT INTO conversations (id, service, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                    (conversation_id, "income-assessment-service", None, now, now),
                )

            await conn.execute(
                """
                INSERT INTO messages (id, conversation_id, role, content, sources_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    message.id,
                    conversation_id,
                    message.role.value if isinstance(message.role, MessageRole) else str(message.role),
                    message.content,
                    sources_json,
                    message.created_at.isoformat(),
                ),
            )
            await conn.execute(
                "UPDATE conversations SET updated_at = ? WHERE id = ?",
                (now, conversation_id),
            )
            await conn.commit()

        message.conversation_id = conversation_id
        return message

    async def get_messages(self, conversation_id: str, limit: int = 50) -> List[Message]:
        async with self.db.connection() as conn:
            cursor = await conn.execute(
                """
                SELECT id, conversation_id, role, content, sources_json, created_at
                FROM messages
                WHERE conversation_id = ?
                ORDER BY created_at ASC
                LIMIT ?
                """,
                (conversation_id, limit),
            )
            rows = await cursor.fetchall()
            messages = []
            for row in rows:
                raw_sources = json.loads(row["sources_json"]) if row["sources_json"] else []
                sources = [SourceCitation.from_dict(s) for s in raw_sources]
                messages.append(
                    Message(
                        id=row["id"],
                        conversation_id=row["conversation_id"],
                        role=MessageRole(row["role"]),
                        content=row["content"],
                        sources=sources,
                        created_at=datetime.fromisoformat(row["created_at"]),
                    )
                )
            return messages

    async def list_conversations(
        self,
        service: Optional[str] = None,
        limit: int = 20,
    ) -> List[Conversation]:
        async with self.db.connection() as conn:
            if service:
                cursor = await conn.execute(
                    "SELECT id, service, title, created_at, updated_at FROM conversations WHERE service = ? ORDER BY updated_at DESC LIMIT ?",
                    (service, limit),
                )
            else:
                cursor = await conn.execute(
                    "SELECT id, service, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC LIMIT ?",
                    (limit,),
                )
            rows = await cursor.fetchall()
            conversations = []
            for row in rows:
                conversations.append(
                    Conversation(
                        id=row["id"],
                        service=row["service"],
                        title=row["title"],
                        created_at=datetime.fromisoformat(row["created_at"]),
                        updated_at=datetime.fromisoformat(row["updated_at"]),
                    )
                )
            return conversations
