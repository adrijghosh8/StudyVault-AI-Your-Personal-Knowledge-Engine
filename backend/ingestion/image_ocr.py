import os
from pathlib import Path
from PIL import Image
import pytesseract
from langchain_core.documents import Document

tesseract_path = os.getenv("TESSERACT_CMD")

if tesseract_path:
    pytesseract.pytesseract.tesseract_cmd = tesseract_path


def Image_Loader(file_path: str) -> list[Document]:
    filename = Path(file_path).name

    with Image.open(file_path) as image:
        extracted_text = pytesseract.image_to_string(image)

    return [
        Document(
            page_content=extracted_text,
            metadata={
                "filename": filename,
                "page_number": None,
                "source_type": "image",
                "chunk_id": f"{filename}_c0",
            },
        )
    ]