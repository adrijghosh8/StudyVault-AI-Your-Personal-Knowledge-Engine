import pymupdf

def PDF_Loader(file_path: str) -> list[str]:    
    doc = pymupdf.open(file_path)
    text = []
    for page in doc:
        text.append(page.get_text())  
    
    return text