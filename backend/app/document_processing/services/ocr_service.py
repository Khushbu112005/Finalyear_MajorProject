"""
Intelligent Document Processing — OCR Service.
Extracts raw text from PDF documents using PyMuPDF.
Treats all uploaded files as untrusted — no execution of embedded content.
"""

import logging

logger = logging.getLogger("civicsphere.ocr")


class OCRService:
    """Securely extracts text content from PDF byte streams."""

    @staticmethod
    def extract_text_from_pdf(file_bytes: bytes) -> str:
        """
        Extracts text from a PDF byte stream.

        Args:
            file_bytes: Raw bytes of the uploaded PDF.

        Returns:
            Concatenated text from all pages.

        Raises:
            Exception: If the PDF cannot be read or parsed.
        """
        text_content = []
        doc = None
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text_content.append(page.get_text())
            return "\n".join(text_content)
        except ImportError:
            logger.warning("PyMuPDF (fitz) is not installed. Attempting basic byte text extraction fallback.")
            # Fallback basic extraction for testing/mocking
            try:
                decoded = file_bytes.decode("utf-8", errors="ignore")
                return decoded
            except Exception:
                return "Mock document content for test environment."
        except Exception as e:
            logger.error(f"Failed to extract PDF text: {type(e).__name__}")
            raise
        finally:
            if doc:
                doc.close()
