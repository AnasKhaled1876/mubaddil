import sys
import threading

_mutex_handle = None
_SHOW_EVENT = "Local\\MubaddilShowWindow"
_EVENT_MODIFY_STATE = 0x0002
_INFINITE = 0xFFFFFFFF


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


def signal_running_instance() -> None:
    """Ask the Mubaddil that is already running to show its window."""
    if not sys.platform.startswith("win"):
        return
    import ctypes

    kernel32 = ctypes.windll.kernel32
    kernel32.OpenEventW.restype = ctypes.c_void_p
    handle = kernel32.OpenEventW(_EVENT_MODIFY_STATE, False, _SHOW_EVENT)
    if handle:
        kernel32.SetEvent(ctypes.c_void_p(handle))
        kernel32.CloseHandle(ctypes.c_void_p(handle))


def listen_for_show_requests(callback) -> None:
    """Call `callback` each time a second launch asks this instance to show itself."""
    if not sys.platform.startswith("win"):
        return
    import ctypes

    kernel32 = ctypes.windll.kernel32
    kernel32.CreateEventW.restype = ctypes.c_void_p
    handle = kernel32.CreateEventW(None, False, False, _SHOW_EVENT)
    if not handle:
        return

    def wait() -> None:
        while kernel32.WaitForSingleObject(ctypes.c_void_p(handle), _INFINITE) == 0:
            try:
                callback()
            except Exception:
                pass

    threading.Thread(target=wait, name="mubaddil-show", daemon=True).start()


def launched_at_sign_in(window_seconds: int = 180) -> bool:
    """True when Windows started us right after sign-in (the startup task)."""
    if not sys.platform.startswith("win"):
        return False
    import ctypes

    kernel32 = ctypes.windll.kernel32
    kernel32.GetTickCount64.restype = ctypes.c_ulonglong
    return kernel32.GetTickCount64() < window_seconds * 1000


UI_MUTEX = "Local\\MubaddilSettingsWindow"
UI_SHOW_EVENT = "Local\\MubaddilSettingsShow"
QUIT_EVENT = "Local\\MubaddilQuit"
_held = []


def acquire_named_mutex(name: str) -> bool:
    if not sys.platform.startswith("win"):
        return True
    import ctypes

    kernel32 = ctypes.windll.kernel32
    kernel32.CreateMutexW.restype = ctypes.c_void_p
    handle = kernel32.CreateMutexW(None, True, name)
    _held.append(handle)
    return ctypes.GetLastError() != 183


def signal_event(name: str) -> None:
    if not sys.platform.startswith("win"):
        return
    import ctypes

    kernel32 = ctypes.windll.kernel32
    kernel32.OpenEventW.restype = ctypes.c_void_p
    handle = kernel32.OpenEventW(_EVENT_MODIFY_STATE, False, name)
    if handle:
        kernel32.SetEvent(ctypes.c_void_p(handle))
        kernel32.CloseHandle(ctypes.c_void_p(handle))


def listen_event(name: str, callback) -> None:
    """Call `callback` on a background thread each time `name` is signalled."""
    if not sys.platform.startswith("win"):
        return
    import ctypes

    kernel32 = ctypes.windll.kernel32
    kernel32.CreateEventW.restype = ctypes.c_void_p
    handle = kernel32.CreateEventW(None, False, False, name)
    if not handle:
        return

    def wait() -> None:
        while kernel32.WaitForSingleObject(ctypes.c_void_p(handle), _INFINITE) == 0:
            try:
                callback()
            except Exception:
                pass

    threading.Thread(target=wait, name="mubaddil-event", daemon=True).start()
