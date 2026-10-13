from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from pathlib import Path
import os

load_dotenv()

# Parameters

# Vector db parameter
# Absolute path (next to the uploads folder) so the index is found no matter
# which directory the server is started from.
PERSIST_DIRECTORY = str(
    Path(__file__).resolve().parent / "data" / "chroma_langchain_db"
)
COLLECTION_NAME = "studyvault"

# API / lifecycle parameters

# Browser origins allowed to call the API directly (comma-separated).
# Only needed when the frontend does NOT go through the Vite /api proxy.
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:4173,http://127.0.0.1:4173",
    ).split(",")
    if origin.strip()
]

# By default indexed documents and uploads now SURVIVE a server restart.
# Set CLEAR_DATA_ON_SHUTDOWN=true in .env to get the old wipe-on-shutdown behaviour.
CLEAR_DATA_ON_SHUTDOWN = os.getenv("CLEAR_DATA_ON_SHUTDOWN", "false").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}

# retrieval parameter

k = 6
fetch_k = 20
lambda_mult = 0.25

# Intialize Embedding Model

embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)
 # Intialize vector store
 
vector_store = Chroma(
    collection_name=COLLECTION_NAME,
    embedding_function=embedding_model,
    persist_directory=PERSIST_DIRECTORY,
)

# initialize llms

llm = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite",
    temperature=0.2,
    max_output_tokens=2048,
    max_retries=2,
)

# Initialize retriever

retriever = vector_store.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": k,
        "fetch_k" : fetch_k,
        "lambda_mult" : lambda_mult,
    },
)
