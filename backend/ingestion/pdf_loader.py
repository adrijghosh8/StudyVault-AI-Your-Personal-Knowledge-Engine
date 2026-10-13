import pymupdf
from pathlib import Path
from langchain_core.documents import Document


def PDF_Loader(file_path: str) -> list[Document]:
    docs = []

    with pymupdf.open(file_path) as pdf:
        for i, page in enumerate(pdf): #type: ignore
            text = page.get_text("text", sort=True)

            # Extract tables
            try:
                for table in page.find_tables().tables:
                    rows = table.extract()
                    text += "\n" + "\n".join(
                        " | ".join(str(c or "") for c in row)
                        for row in rows
                    )
            except Exception:
                pass

            if text.strip():
                docs.append(Document(
                    page_content=text,
                    metadata={
                        "filename": Path(file_path).name,
                        "page_number": i + 1
                    }
                ))

    return docs