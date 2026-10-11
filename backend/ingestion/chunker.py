from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from pdf_loader import PDF_Loader
from image_ocr import Image_Loader
from web_loader import Web_Loader


def Text_Split(file_path: str,c_s: int = 1000,c_o: int = 200) -> list[Document]:

    # Initialize the splitter
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=c_s,
        chunk_overlap=c_o,
        separators=["\n\n", "\n", " ", ""]
    )

    # Identify and load the source
    
    if file_path.lower().startswith(("http://", "https://")):
        docs = Web_Loader(file_path)
        return splitter.split_documents(docs) #type: ignore

    elif file_path.lower().endswith((".png", ".jpg", ".jpeg")):
        text = Image_Loader(file_path)

    elif file_path.lower().endswith(".pdf"):
        text = PDF_Loader(file_path)

    elif file_path.lower().endswith(".txt"):
        with open(file_path, "r", encoding="utf-8") as f:
            text = [f.read()]

    else:
        raise ValueError(f"Unsupported file type: {file_path}")

    # Handle loaders returning either strings or Documents
    if text and isinstance(text[0], Document):
        return splitter.split_documents(text) #type: ignore

    # Convert strings to Document chunks
    return splitter.create_documents(text)