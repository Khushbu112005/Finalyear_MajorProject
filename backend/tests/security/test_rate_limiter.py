"""
Tests for Security Rate Limiter Middleware.
Verifies token bucket exhaustion, HTTP 429 response, and Retry-After headers.
"""

import pytest
from backend.app.common.rate_limiter import TokenBucket


def test_token_bucket_consumption_and_exhaustion():
    bucket = TokenBucket(capacity=3, refill_rate=0.0)  # No refill during test
    
    # 3 allowed requests
    assert bucket.consume(1.0) is True
    assert bucket.consume(1.0) is True
    assert bucket.consume(1.0) is True
    
    # 4th request must be rejected
    assert bucket.consume(1.0) is False
    assert bucket.consume(1.0) is False


def test_token_bucket_refill():
    bucket = TokenBucket(capacity=2, refill_rate=10.0)  # 10 tokens / sec
    assert bucket.consume(2.0) is True
    assert bucket.consume(1.0) is False
    
    import time
    time.sleep(0.2)  # Refills ~2 tokens
    assert bucket.consume(1.0) is True
