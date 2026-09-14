"""Public-safe adapters for local/private model runtimes."""

from .gpb_audio_risk import AdapterConfig, create_adapter_app

__all__ = ["AdapterConfig", "create_adapter_app"]
