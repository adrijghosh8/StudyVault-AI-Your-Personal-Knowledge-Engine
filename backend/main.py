from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from uuid import uuid4
from urllib.parse import urlparse
from fastapi.openapi.utils import get_openapi
from contextlib import asynccontextmanager
import asyncio
import shutil

from backend.config import CORS_ORIGINS, CLEAR_DATA_ON_SHUTDOWN

from backend.ingestion.chunker import Text_Split
from backend.rag.vector_store import (
    Db_store,
    List_Documents,
    Delete_Document,
    Delete_All_Documents,
    Get_Document_Chunks,
)

from backend.rag.generator import Generate_Answer_Async



@asynccontextmanager
async def lifespan(app: FastAPI):
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    yield

    # Indexed documents and uploads are kept between restarts unless
    # CLEAR_DATA_ON_SHUTDOWN=true is set in the environment / .env file.
    if CLEAR_DATA_ON_SHUTDOWN:
        # Remove all vectors from the Chroma collection.
        Delete_All_Documents()

        # Remove uploaded files from disk.
        shutil.rmtree(UPLOAD_DIR, ignore_errors=True)


app = FastAPI(
    title="StudyVault AI",
    description="A RAG-powered educational study assistant",
    version="0.1.0",
    lifespan=lifespan, #type: ignore
)

# Lets a browser app served from another origin (e.g. the Vite dev server
# calling the API directly) use the API. Configure with CORS_ORIGINS.
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path(__file__).resolve().parent / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE = 200 * 1024 * 1024


@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "application": "StudyVault AI",
        "clears_data_on_shutdown": CLEAR_DATA_ON_SHUTDOWN,
    }


async def _run_until_disconnected(request: Request, coro):
    """Await `coro`, but cancel it as soon as the client goes away.

    This is what makes the frontend's Stop button work: aborting the browser
    request closes the connection, which cancels the in-flight model call
    instead of letting it run to completion for nobody.
    """
    task = asyncio.ensure_future(coro)
    try:
        while True:
            done, _ = await asyncio.wait({task}, timeout=0.5)
            if done:
                return task.result()
            if await request.is_disconnected():
                raise HTTPException(
                    status_code=499,
                    detail="The client cancelled the request.",
                )
    finally:
        if not task.done():
            task.cancel()


@app.post("/ask")
async def ask_question(request: Request, payload: dict):
    question = payload.get("question", "")

    if not isinstance(question, str) or not question.strip():
        raise HTTPException(
            status_code=422,
            detail="A non-empty question is required.",
        )

    try:
        return await _run_until_disconnected(
            request, Generate_Answer_Async(question)
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate an answer.",
        ) from exc


@app.post("/documents/upload")
async def upload_documents(
    files: list[UploadFile] = File(default=[]),
    urls: list[str] = Form(default=[]),
):
    results = []

    for file in files:
        original_name = Path(file.filename or "").name
        destination = None

        try:
            extension = Path(original_name).suffix.lower()

            if not original_name or extension not in ALLOWED_EXTENSIONS:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid filename or unsupported file type.",
                )

            content = await file.read()

            if not content:
                raise HTTPException(400, "File is empty.")

            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(413, "Maximum file size is 20 MB.")

            document_id = uuid4().hex
            destination = UPLOAD_DIR / f"{document_id}_{original_name}"
            destination.write_bytes(content)

            chunks = Text_Split(str(destination))

            if not chunks:
                raise ValueError("No text could be extracted.")

            for chunk in chunks:
                chunk.metadata["document_id"] = document_id
                chunk.metadata["filename"] = original_name

            Db_store(chunks)

            results.append({
                "id": document_id,
                "filename": original_name,
                "status": "success",
                "chunks": len(chunks),
            })

        except HTTPException as exc:
            results.append({
                "filename": original_name,
                "status": "failed",
                "error": exc.detail,
            })

        except Exception:
            if destination:
                destination.unlink(missing_ok=True)

            results.append({
                "filename": original_name,
                "status": "failed",
                "error": "Document processing failed.",
            })

        finally:
            await file.close()
  
    for url in urls:
        document_id = uuid4().hex

        try:
            url = url.strip()
            parsed = urlparse(url)

            if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                raise ValueError("Enter a valid HTTP or HTTPS URL.")

            # Your Text_Split function should route URLs to Web_Loader.
            chunks = Text_Split(url)

            if not chunks:
                raise ValueError("No readable text was extracted from this URL.")

            for chunk in chunks:
                chunk.metadata["document_id"] = document_id
                chunk.metadata["filename"] = parsed.netloc
                chunk.metadata["source_url"] = url
                chunk.metadata["source_type"] = "web"

            Db_store(chunks)

            results.append({
                "id": document_id,
                "url": url,
                "status": "success",
                "chunks": len(chunks),
            })

        except Exception as exc:
            results.append({
                "url": url,
                "status": "failed",
                "error": str(exc),
            })

    return {
        # Files AND urls (this used to count only files).
        "total": len(results),
        "successful": sum(r["status"] == "success" for r in results),
        "failed": sum(r["status"] == "failed" for r in results),
        "results": results,
    }


@app.get("/documents")
def list_documents():
    return {"documents": List_Documents()}


@app.delete("/documents/{document_id}")
def delete_document(document_id: str):
    chunks = Get_Document_Chunks(document_id)

    if not chunks:
        raise HTTPException(404, "Document not found.")

    deleted_chunks = Delete_Document(document_id)

    # Delete its physical upload using its unique ID prefix.
    for path in UPLOAD_DIR.glob(f"{document_id}_*"):
        path.unlink(missing_ok=True)

    return {
        "status": "success",
        "document_id": document_id,
        "deleted_chunks": deleted_chunks,
    }
    

@app.delete("/documents")
def delete_all_documents():
    deleted_chunks = Delete_All_Documents()

    deleted_files = 0

    for path in UPLOAD_DIR.iterdir():
        if path.is_file():
            path.unlink(missing_ok=True)
            deleted_files += 1

    return {
        "status": "success",
        "deleted_chunks": deleted_chunks,
        "deleted_files": deleted_files,
        "message": "All indexed documents and uploaded files were deleted.",
    }
    
@app.get("/documents/{document_id}/chunks")
def inspect_chunks(document_id: str):
    chunks = Get_Document_Chunks(document_id)

    if not chunks:
        raise HTTPException(404, "Document not found.")

    return {
        "document_id": document_id,
        "total_chunks": len(chunks),
        "chunks": chunks,
    }
    
    
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    schema_name = "Body_upload_documents_documents_upload_post"
    body_schema = openapi_schema["components"]["schemas"].get(schema_name)

    if body_schema:
        files_schema = body_schema["properties"].get("files")

        if files_schema:
            files_schema["items"]["format"] = "binary"

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi
