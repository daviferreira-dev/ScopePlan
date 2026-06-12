"""
Encryption utilities for LGPD-compliant PII storage.

Usage:
- EncryptedString: SQLAlchemy column type — transparent encrypt/decrypt via Fernet.
  Falls back to plaintext when FERNET_KEY is not set (safe dev mode).
- email_lookup_hash: deterministic HMAC-SHA256 used as the actual DB lookup key
  because Fernet uses random IVs (same plaintext → different ciphertext each time,
  making SQL WHERE queries on the encrypted column impossible).

Required env vars:
  FERNET_KEY  — base64-url Fernet key (generate: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
  HMAC_KEY    — any secret string used to hash email for lookups
"""
import os
import hmac
import hashlib
from sqlalchemy import types


def _fernet_key() -> bytes | None:
    val = os.environ.get('FERNET_KEY', '').strip()
    return val.encode() if val else None


def _hmac_key() -> bytes:
    val = os.environ.get('HMAC_KEY', '').strip()
    return val.encode() if val else b'scopeplan-dev-hmac-insecure-change-in-prod'


def encrypt_str(value: str) -> str:
    """Encrypt a string with Fernet. Returns plaintext if FERNET_KEY is not set."""
    key = _fernet_key()
    if not key:
        return value
    from cryptography.fernet import Fernet
    return Fernet(key).encrypt(value.encode()).decode()


def decrypt_str(value: str) -> str:
    """Decrypt a Fernet token. Returns value as-is on failure (handles legacy plaintext)."""
    key = _fernet_key()
    if not key:
        return value
    from cryptography.fernet import Fernet
    try:
        return Fernet(key).decrypt(value.encode()).decode()
    except Exception:
        return value


def email_lookup_hash(email: str) -> str:
    """HMAC-SHA256 of the normalised email — used as the DB lookup key."""
    return hmac.new(_hmac_key(), email.lower().strip().encode(), hashlib.sha256).hexdigest()


class EncryptedString(types.TypeDecorator):
    """SQLAlchemy column type that transparently encrypts on write and decrypts on read.

    Column length should be ≥200 to accommodate Fernet token overhead.
    When FERNET_KEY is absent the value is stored/returned as plain text (dev mode).
    """
    impl = types.String
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        return encrypt_str(str(value))

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        return decrypt_str(str(value))
