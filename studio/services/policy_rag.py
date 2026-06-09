from __future__ import annotations

import hashlib
import json
import math
import re
from dataclasses import dataclass
from datetime import datetime, timezone as datetime_timezone
from functools import lru_cache
from pathlib import Path
from typing import Any

import chromadb
from django.conf import settings
from llama_index.core import Document, StorageContext, VectorStoreIndex
from llama_index.core.base.embeddings.base import BaseEmbedding
from llama_index.core.node_parser import SentenceSplitter
from llama_index.vector_stores.chroma import ChromaVectorStore


INDEX_VERSION = "1"


@dataclass(frozen=True)
class PolicyAnswerResult:
    question: str
    answer: str
    generation_mode: str
    sources: list[dict[str, Any]]

    def to_dict(self) -> dict[str, Any]:
        return {
            "question": self.question,
            "answer": self.answer,
            "generationMode": self.generation_mode,
            "sources": self.sources,
        }


class KeywordHashEmbedding(BaseEmbedding):
    dim: int = 256

    def __init__(self, dim: int = 256, **kwargs: Any) -> None:
        super().__init__(model_name=f"keyword-hash-{dim}-v1", **kwargs)
        self.dim = dim

    @classmethod
    def class_name(cls) -> str:
        return "KeywordHashEmbedding"

    def _token_features(self, text: str) -> list[str]:
        tokens = re.findall(r"[a-z0-9']+", text.lower())
        bigrams = [f"{left}_{right}" for left, right in zip(tokens, tokens[1:])]
        return [*tokens, *bigrams]

    def _embed(self, text: str) -> list[float]:
        vector = [0.0] * self.dim

        for token in self._token_features(text):
            digest = hashlib.blake2b(token.encode("utf-8"), digest_size=8).digest()
            index = int.from_bytes(digest[:4], "big") % self.dim
            vector[index] += 1.0

        norm = math.sqrt(sum(value * value for value in vector)) or 1.0
        return [value / norm for value in vector]

    def _get_query_embedding(self, query: str) -> list[float]:
        return self._embed(query)

    async def _aget_query_embedding(self, query: str) -> list[float]:
        return self._embed(query)

    def _get_text_embedding(self, text: str) -> list[float]:
        return self._embed(text)

    async def _aget_text_embedding(self, text: str) -> list[float]:
        return self._embed(text)


class PolicyRagService:
    def __init__(self) -> None:
        self.policy_file = Path(settings.RAG_POLICY_FILE)
        self.rag_root = Path(settings.RAG_STORAGE_DIR)
        self.chroma_path = self.rag_root / "chroma"
        self.manifest_path = self.rag_root / "policy_index.json"
        self.collection_name = settings.RAG_COLLECTION_NAME
        self.top_k = settings.RAG_TOP_K
        self.embed_model = KeywordHashEmbedding(dim=settings.RAG_EMBED_DIM)

    def get_status(self, force: bool = False) -> dict[str, Any]:
        manifest = self._ensure_index(force=force)
        policy_mtime = datetime.fromtimestamp(
            self.policy_file.stat().st_mtime,
            tz=datetime_timezone.utc,
        )

        return {
            "policyFile": self._display_path(self.policy_file),
            "collectionName": self.collection_name,
            "chunkCount": manifest.get("chunk_count", 0),
            "lastIndexedAt": manifest.get("indexed_at"),
            "policyUpdatedAt": policy_mtime.strftime("%Y-%m-%d %H:%M UTC"),
            "embeddingModel": self.embed_model.model_name,
            "generationMode": "retrieval-backed local synthesis",
        }

    def answer(self, question: str) -> PolicyAnswerResult:
        question = question.strip()
        if not question:
            raise ValueError("Ask a question before querying the policy.")

        self._ensure_index()
        retriever = self._load_index().as_retriever(
            similarity_top_k=self.top_k,
            embed_model=self.embed_model,
        )
        nodes = retriever.retrieve(question)
        sources = self._build_sources(question, nodes)

        return PolicyAnswerResult(
            question=question,
            answer=self._compose_answer(question, sources),
            generation_mode="retrieval-backed local synthesis",
            sources=sources,
        )

    def rebuild(self) -> dict[str, Any]:
        return self.get_status(force=True)

    def _ensure_index(self, force: bool = False) -> dict[str, Any]:
        self.rag_root.mkdir(parents=True, exist_ok=True)
        self.chroma_path.mkdir(parents=True, exist_ok=True)

        policy_hash = hashlib.sha256(self.policy_file.read_bytes()).hexdigest()
        manifest = self._read_manifest()

        if force or not self._manifest_matches(manifest, policy_hash) or not self._collection_exists():
            manifest = self._rebuild_index(policy_hash)

        return manifest

    def _manifest_matches(self, manifest: dict[str, Any], policy_hash: str) -> bool:
        return (
            manifest.get("index_version") == INDEX_VERSION
            and manifest.get("policy_sha256") == policy_hash
            and manifest.get("collection_name") == self.collection_name
            and manifest.get("embedding_model") == self.embed_model.model_name
        )

    def _rebuild_index(self, policy_hash: str) -> dict[str, Any]:
        client = self._client()
        try:
            client.delete_collection(self.collection_name)
        except Exception:
            pass

        collection = client.get_or_create_collection(name=self.collection_name)
        vector_store = ChromaVectorStore(chroma_collection=collection)
        storage_context = StorageContext.from_defaults(vector_store=vector_store)

        VectorStoreIndex.from_documents(
            self._load_documents(),
            storage_context=storage_context,
            embed_model=self.embed_model,
            transformations=[
                SentenceSplitter(
                    chunk_size=settings.RAG_CHUNK_SIZE,
                    chunk_overlap=settings.RAG_CHUNK_OVERLAP,
                )
            ],
            show_progress=False,
        )

        manifest = {
            "index_version": INDEX_VERSION,
            "policy_sha256": policy_hash,
            "collection_name": self.collection_name,
            "embedding_model": self.embed_model.model_name,
            "chunk_count": collection.count(),
            "indexed_at": datetime.now(datetime_timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        }
        self.manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        return manifest

    def _load_index(self) -> VectorStoreIndex:
        collection = self._client().get_or_create_collection(name=self.collection_name)
        vector_store = ChromaVectorStore(chroma_collection=collection)
        return VectorStoreIndex.from_vector_store(
            vector_store=vector_store,
            embed_model=self.embed_model,
        )

    def _load_documents(self) -> list[Document]:
        raw_text = self.policy_file.read_text(encoding="utf-8")
        sections: list[tuple[str, list[str]]] = []
        current_title = "Overview"
        current_lines: list[str] = []

        for line in raw_text.splitlines():
            stripped = line.strip()
            if stripped.startswith("## "):
                if current_lines:
                    sections.append((current_title, current_lines))
                current_title = stripped.removeprefix("## ").strip()
                current_lines = []
            elif stripped and not stripped.startswith("# "):
                current_lines.append(stripped)

        if current_lines:
            sections.append((current_title, current_lines))

        documents = []
        for title, lines in sections:
            body = " ".join(lines)
            documents.append(
                Document(
                    text=f"{title}\n\n{body}",
                    metadata={
                        "section": title,
                        "source": self.policy_file.name,
                    },
                )
            )
        return documents

    def _build_sources(self, question: str, nodes: list[Any]) -> list[dict[str, Any]]:
        sources = []
        for node in nodes:
            text = " ".join(node.text.split())
            sources.append(
                {
                    "section": node.metadata.get("section", "Company policy"),
                    "score": round(float(node.score or 0.0), 3),
                    "excerpt": text[:260].rstrip() + ("..." if len(text) > 260 else ""),
                    "matchedSentences": self._best_sentences(question, node.text),
                }
            )
        return sources

    def _compose_answer(self, question: str, sources: list[dict[str, Any]]) -> str:
        candidates: list[tuple[int, float, str]] = []

        for source in sources:
            for sentence in source["matchedSentences"]:
                overlap = self._overlap_score(question, sentence)
                if overlap > 0:
                    candidates.append((overlap, source["score"], sentence))

        candidates.sort(key=lambda item: (item[0], item[1], len(item[2])), reverse=True)

        if not candidates:
            return (
                "I could not find a strong match in the current policy text. "
                "Try using policy terms like PTO, remote work, travel reimbursement, "
                "security incidents, or home office equipment."
            )

        top_overlap = candidates[0][0]

        seen: set[str] = set()
        selected: list[str] = []
        for overlap, _, sentence in candidates:
            if overlap < top_overlap:
                continue
            normalized = sentence.lower()
            if normalized in seen:
                continue
            seen.add(normalized)
            selected.append(sentence.strip())
            if len(selected) == 2:
                break

        return "According to the current company policy, " + " ".join(selected)

    def _best_sentences(self, question: str, text: str) -> list[str]:
        sentences = [
            sentence.strip()
            for sentence in re.split(r"(?<=[.!?])\s+", text.replace("\n", " "))
            if sentence.strip()
        ]
        ranked = sorted(
            (
                (self._overlap_score(question, sentence), sentence)
                for sentence in sentences
            ),
            key=lambda item: (item[0], len(item[1])),
            reverse=True,
        )
        return [sentence for score, sentence in ranked if score > 0][:3]

    def _overlap_score(self, question: str, sentence: str) -> int:
        question_terms = set(self._keyword_terms(question))
        sentence_terms = set(self._keyword_terms(sentence))
        return len(question_terms & sentence_terms)

    def _keyword_terms(self, text: str) -> list[str]:
        return re.findall(r"[a-z0-9']+", text.lower())

    def _collection_exists(self) -> bool:
        try:
            self._client().get_collection(name=self.collection_name)
            return True
        except Exception:
            return False

    def _client(self) -> chromadb.PersistentClient:
        return chromadb.PersistentClient(path=str(self.chroma_path))

    def _read_manifest(self) -> dict[str, Any]:
        if not self.manifest_path.exists():
            return {}

        try:
            return json.loads(self.manifest_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {}

    def _display_path(self, path: Path) -> str:
        try:
            return str(path.relative_to(settings.BASE_DIR))
        except ValueError:
            return str(path)


@lru_cache(maxsize=1)
def get_policy_rag_service() -> PolicyRagService:
    return PolicyRagService()
