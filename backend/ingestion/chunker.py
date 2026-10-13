from pathlib import Path
from urllib.parse import urlparse
from hashlib import sha256

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from backend.ingestion.pdf_loader import PDF_Loader
from backend.ingestion.image_ocr import Image_Loader
from backend.ingestion.web_loader import Web_Loader


def Text_Split(file_path: str, c_s: int = 1800, c_o: int = 250,) -> list[Document]:

    # Validate splitter configuration
    if c_s <= 0:
        raise ValueError("Chunk size must be greater than zero.")

    if c_o < 0 or c_o >= c_s:
        raise ValueError(
            "Chunk overlap must be non-negative and smaller than chunk size."
        )

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=c_s,
        chunk_overlap=c_o,
        separators=["\n\n", "\n", " ", ""],
    )

    # Identify source type
    is_url = file_path.lower().startswith(("http://", "https://"))

    if is_url:
        source_type = "web"
        source_id = file_path.strip()
        docs = Web_Loader(file_path)

    else:
        path = Path(file_path).resolve()

        if not path.is_file():
            raise FileNotFoundError(f"File not found: {file_path}")

        filename = path.name
        source_id = filename

        if path.suffix.lower() == ".pdf":
            source_type = "pdf"
            docs = PDF_Loader(file_path)

        elif path.suffix.lower() == ".txt":
            source_type = "text"
            docs = PDF_Loader(file_path)

        elif path.suffix.lower() in {".png", ".jpg", ".jpeg"}:
            source_type = "image"
            docs = Image_Loader(file_path)

        else:
            raise ValueError(
                f"Unsupported file type: {path.suffix}"
            )

    # Normalize loader output to LangChain Documents
    source_hash = sha256(
        source_id.encode("utf-8")
    ).hexdigest()[:12]
    
    normalized_docs: list[Document] = []

    for index, item in enumerate(docs):
        if isinstance(item, Document):
            doc = Document(
                page_content=item.page_content,
                metadata=dict(item.metadata),
            )
        elif isinstance(item, str):
            doc = Document(
                page_content=item,
                metadata={},
            )
        else:
            raise TypeError(
                f"Unsupported loader output: {type(item).__name__}"
            )

        metadata = dict(doc.metadata)

        metadata.setdefault("filename", Path(urlparse(file_path).path).name
                            if is_url else Path(file_path).name)
        metadata.setdefault("source_type", source_type)
        metadata.setdefault("source_url", file_path if is_url else None)
        metadata.setdefault("page_number", None)

        # Track the original document/page before splitting
        metadata.setdefault("source_document_index", index)
        metadata["source_id"] = source_hash

        normalized_docs.append(
            Document(
                page_content=doc.page_content,
                metadata=metadata,
            )
        )

    # Split while retaining the source metadata
    chunks = splitter.split_documents(normalized_docs)

    for index, chunk in enumerate(chunks):
        page = chunk.metadata.get("page_number")
        page_part = f"p{page}" if page is not None else "pNA"

        chunk_id = f"{source_id}_{page_part}_c{index}"

        chunk.metadata["chunk_id"] = chunk_id

    return chunks


if __name__ == "__main__":
    chunks = Text_Split(
        r"evaluation\sample_notes.txt"
    )

    print("Total chunks:", len(chunks))

    for chunk in chunks[:3]:
        print("\nMetadata:", chunk.metadata)
        print("Content:", chunk.page_content[:100])
        print("-" * 40)