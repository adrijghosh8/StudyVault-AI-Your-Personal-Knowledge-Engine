from langchain_unstructured import UnstructuredLoader


def Web_Loader(url: str) -> list[str]:    
    text = []
    loader = UnstructuredLoader(web_url=url)
    docs = loader.load()

    for doc in docs:
        text.append(doc)
    
    return text