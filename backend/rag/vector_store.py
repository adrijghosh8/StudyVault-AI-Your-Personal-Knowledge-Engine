import json
from uuid import uuid4

from langchain_core.documents import Document
from backend.config import vector_store


def _clean_metadata(metadata: dict) -> dict:
    """Chroma only accepts str/int/float/bool metadata values.

    Web loaders (Unstructured) attach lists and dicts, which make add_documents
    raise. Those values are stored as JSON strings instead.
    """
    cleaned = {}
    for key, value in metadata.items():
        if value is None or isinstance(value, (str, int, float, bool)):
            cleaned[key] = value
        else:
            try:
                cleaned[key] = json.dumps(value, default=str)
            except (TypeError, ValueError):
                cleaned[key] = str(value)
    return cleaned


def Db_store(chunks: list[Document]) -> list[str]:
    if not chunks:
        raise ValueError("No document chunks provided.")

    ids = []

    for chunk in chunks:
        # Ensure every document has an ID.
        document_id = chunk.metadata.get("document_id")
        if not document_id:
            document_id = uuid4().hex
            chunk.metadata["document_id"] = document_id

        # Every chunk gets a unique ID.
        chunk_id = f"{document_id}_{uuid4().hex}"
        chunk.metadata["chunk_id"] = chunk_id
        chunk.metadata = _clean_metadata(chunk.metadata)
        ids.append(chunk_id)

    vector_store.add_documents(documents=chunks, ids=ids)
    return ids


def List_Documents() -> list[dict]:
    result = vector_store.get(include=["metadatas"])
    grouped = {}

    for metadata in result.get("metadatas", []):
        if not metadata:
            continue

        document_id = metadata.get("document_id")
        if not document_id:
            continue

        if document_id not in grouped:
            grouped[document_id] = {
                "id": document_id,
                "filename": metadata.get("filename"),
                "source_type": metadata.get("source_type"),
                "source_url": metadata.get("source_url"),
                "chunks": 0,
            }

        grouped[document_id]["chunks"] += 1

    return list(grouped.values())


def Delete_Document(document_id: str) -> int:
    result = vector_store.get(
        where={"document_id": document_id},
        include=["metadatas"],
    )

    ids = result.get("ids", [])

    if ids:
        vector_store.delete(ids=ids)

    return len(ids)


def Delete_All_Documents() -> int:
    result = vector_store.get(include=["metadatas"])
    ids = result.get("ids", [])

    if ids:
        vector_store.delete(ids=ids)

    return len(ids)


def Get_Document_Chunks(document_id: str) -> list[dict]:
    result = vector_store.get(
        where={"document_id": document_id},
        include=["documents", "metadatas"],
    )

    return [
        {
            "chunk_id": chunk_id,
            "text": text,
            "metadata": metadata,
        }
        for chunk_id, text, metadata in zip(
            result.get("ids", []),
            result.get("documents", []),
            result.get("metadatas", []),
        )
    ]
