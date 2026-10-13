from backend.config import (
    retriever,
    llm
)

from backend.rag.prompts import studyvault_prompt, Format_Context

SNIPPET_CHARS = 400


def Extract_Answer(response) -> str:
    content = response.content

    if isinstance(content, str):
        return content

    if isinstance(content, list):
        return "\n".join(
            block["text"]
            for block in content
            if isinstance(block, dict)
            and block.get("type") == "text"
            and isinstance(block.get("text"), str)
        )

    return str(content)


def _snippet(text: str) -> str:
    text = " ".join((text or "").split())
    if len(text) <= SNIPPET_CHARS:
        return text
    return text[:SNIPPET_CHARS].rstrip() + "…"


def _build_result(query: str, documents, response) -> dict:
    # Extract unique sources from retrieved documents
    unique_sources = {}

    for doc in documents:
        key = doc.metadata.get("chunk_id")

        if key:
            unique_sources[key] = {
                "filename": doc.metadata.get("filename"),
                "page_number": doc.metadata.get("page_number"),
                "chunk_id": key,
                "source_type": doc.metadata.get("source_type"),
                "source_url": doc.metadata.get("source_url"),
                "snippet": _snippet(doc.page_content),
            }

    return {
        "question": query,
        "answer": Extract_Answer(response),
        "sources": list(unique_sources.values()),
    }


def Generate_Answer(query: str) -> dict:
    if not query.strip():
        raise ValueError("Question cannot be empty.")

    # 1. Retrieve relevant chunks
    documents = retriever.invoke(query)

    # 2. Format the retrieved context
    context = Format_Context(documents)

    # 3. Build the prompt
    messages = studyvault_prompt.format_messages(
        context=context,
        question=query,
    )

    # 4. Generate the answer
    response = llm.invoke(messages)

    # 5. Build the response with source metadata
    return _build_result(query, documents, response)


async def Generate_Answer_Async(query: str) -> dict:
    """Same as Generate_Answer, but awaitable.

    Because the model call is awaited (not run in a worker thread), cancelling
    the asyncio task that runs this coroutine really cancels the in-flight
    request to the model. The /ask endpoint uses that to implement Stop.
    """
    if not query.strip():
        raise ValueError("Question cannot be empty.")

    documents = await retriever.ainvoke(query)
    context = Format_Context(documents)
    messages = studyvault_prompt.format_messages(
        context=context,
        question=query,
    )
    response = await llm.ainvoke(messages)

    return _build_result(query, documents, response)
