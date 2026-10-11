
import os
from PIL import Image
import pytesseract

tesseract_path = os.getenv("TESSERACT_CMD")

if tesseract_path:
    pytesseract.pytesseract.tesseract_cmd = tesseract_path


def Image_Loader(file_path: str) -> list[str]:
    with Image.open(file_path) as image:
        extracted_text = pytesseract.image_to_string(image)

    return [extracted_text]
