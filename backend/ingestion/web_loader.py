from urllib.parse import urlparse
from langchain_unstructured import UnstructuredLoader
from langchain_core.documents import Document


def Web_Loader(url: str) -> list[Document]:
    loader = UnstructuredLoader(web_url=url)
    docs = loader.load()

    filename = urlparse(url).path.rstrip("/").split("/")[-1] or urlparse(url).netloc

    documents = []

    for index, doc in enumerate(docs):
        documents.append(
            Document(
                page_content=doc.page_content,
                metadata={
                    **doc.metadata,
                    "filename": filename,
                    "source_url": url,
                    "source_type": "web",
                    "page_number": None,
                    "chunk_id": f"web_{index}",
                },
            )
        )

    return documents