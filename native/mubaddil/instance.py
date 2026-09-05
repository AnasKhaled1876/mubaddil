import sys

_mutex_handle = None


def acquire_single_instance() -> bool:
    """Return False if another Mubaddil process already owns the session."""
    global _mutex_handle
    if not sys.platform.startswith("win"):
        return True
    import ctypes

    kernel32 = ctypes.windll.kernel32
    kernel32.CreateMutexW.restype = ctypes.c_void_p
    handle = kernel32.CreateMutexW(None, True, "Local\\MubaddilSingleton")
    _mutex_handle = handle
    return ctypes.GetLastError() != 183
