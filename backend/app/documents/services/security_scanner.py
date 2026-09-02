"""
Document Security Scanner.
Scans uploaded document byte streams for active content, macros, embedded JavaScript,
or malicious PDF stream attacks before parsing.
"""

from typing import Tuple, List
import re
import logging

logger = logging.getLogger("civicsphere.documents.scanner")

# PDF suspicious keywords representing active executable vectors
SUSPICIOUS_PDF_PATTERNS = [
    (rb"/JavaScript", "Embedded JavaScript detected in PDF"),
    (rb"/JS", "Embedded JS script tag detected"),
    (rb"/Launch", "Embedded launch action detected"),
    (rb"/EmbeddedFiles", "Embedded external files detected"),
    (rb"/AcroForm\s*<<.*/XFA", "Dynamic XFA form script detected"),
]


class DocumentSecurityScanner:
    """Performs static byte-level security analysis on untrusted document files."""

    @staticmethod
    def scan_pdf_bytes(file_bytes: bytes) -> Tuple[bool, List[str]]:
        """
        Scans PDF bytes for active scripting or exploit payloads.
        Returns (is_safe: bool, threat_reasons: List[str])
        """
        threats = []

        # Check for suspicious stream operators
        for pattern, description in SUSPICIOUS_PDF_PATTERNS:
            if re.search(pattern, file_bytes, re.IGNORECASE):
                threats.append(description)

        if threats:
            logger.warning(f"Security scanner detected threats in uploaded document: {threats}")
            return False, threats

        return True, []

    scan_pdf_content = scan_pdf_bytes


SecurityScanner = DocumentSecurityScanner
