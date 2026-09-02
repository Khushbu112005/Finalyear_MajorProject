"""
RFC 6238 / RFC 4226 Compliant TOTP (Time-Based One-Time Password) Implementation.
Provides multi-factor authentication (MFA) primitives using standard Python library:
- Secret generation (Base32 encoded 160-bit cryptographically secure secret)
- Provisioning URI generation for Authenticator apps (Google Authenticator, Microsoft Authenticator)
- TOTP token computation (HMAC-SHA1 with dynamic truncation)
- Time-skew-tolerant verification (window-based challenge checking)
"""

import hmac
import hashlib
import struct
import time
import base64
import secrets
from typing import Optional, Tuple
from urllib.parse import quote


class TOTPManager:
    """Standard RFC 6238 Time-based One-Time Password Manager."""

    TIME_STEP: int = 30
    DIGITS: int = 6
    ISSUER: str = "CivicSphere AI"

    @classmethod
    def generate_secret(cls, byte_length: int = 20) -> str:
        """Generates a random Base32 encoded 160-bit secret."""
        random_bytes = secrets.token_bytes(byte_length)
        return base64.b32encode(random_bytes).decode("utf-8").replace("=", "")

    @classmethod
    def get_provisioning_uri(cls, secret: str, email: str, issuer: Optional[str] = None) -> str:
        """Generates an otpauth:// URI for QR code scanning in standard authenticator apps."""
        iss = issuer or cls.ISSUER
        encoded_issuer = quote(iss)
        encoded_email = quote(email)
        return f"otpauth://totp/{encoded_issuer}:{encoded_email}?secret={secret}&issuer={encoded_issuer}&algorithm=SHA1&digits={cls.DIGITS}&period={cls.TIME_STEP}"

    @classmethod
    def generate_token(cls, secret: str, timestamp: Optional[float] = None) -> str:
        """Computes current 6-digit TOTP code for a given secret."""
        t = int(timestamp if timestamp is not None else time.time())
        time_counter = t // cls.TIME_STEP
        
        # Pad secret to valid Base32 length if needed
        padded_secret = secret + "=" * ((8 - len(secret) % 8) % 8)
        key = base64.b32decode(padded_secret.upper(), casefold=True)
        
        # 8-byte big-endian integer counter
        counter_bytes = struct.pack(">Q", time_counter)
        
        # HMAC-SHA1
        hmac_hash = hmac.new(key, counter_bytes, hashlib.sha1).digest()
        
        # Dynamic truncation (RFC 4226 section 5.4)
        offset = hmac_hash[-1] & 0x0F
        code_int = struct.unpack(">I", hmac_hash[offset : offset + 4])[0] & 0x7FFFFFFF
        
        # Modulo 10^digits
        token = code_int % (10 ** cls.DIGITS)
        return str(token).zfill(cls.DIGITS)

    @classmethod
    def verify_code(cls, secret: str, code: str, window: int = 1, timestamp: Optional[float] = None) -> bool:
        """
        Verifies a user-supplied TOTP code with time-skew window tolerance.
        Checks counter - window, counter, counter + window (±30 seconds per window).
        """
        if not secret or not code or len(code.strip()) != cls.DIGITS:
            return False

        clean_code = code.strip()
        t = int(timestamp if timestamp is not None else time.time())

        for step_offset in range(-window, window + 1):
            eval_time = t + (step_offset * cls.TIME_STEP)
            expected_token = cls.generate_token(secret, timestamp=eval_time)
            if hmac.compare_digest(expected_token, clean_code):
                return True

        return False
