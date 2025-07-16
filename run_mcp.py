import sys
import os
import subprocess
import signal
import platform

# CREATE_NO_WINDOW is a Windows-specific flag.
if platform.system() == "Windows":
    CREATE_NO_WINDOW = 0x08000000

proc = None

def handle_termination(signum, frame):
    if proc and proc.poll() is None:
        try:
            if platform.system() == "Windows":
                # On Windows, taskkill is the most reliable way to kill a process tree.
                subprocess.call(['taskkill', '/F', '/T', '/PID', str(proc.pid)])
            else:
                # On Unix-like systems, kill the entire process group.
                os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
                proc.wait(timeout=1)
        except (ProcessLookupError, PermissionError): # Process might be already dead
            pass
        except Exception:
            try:
                # Fallback to kill if terminate fails
                if platform.system() == "Windows":
                    proc.kill()
                else:
                    os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
            except Exception:
                pass
    sys.exit(0)

def main():
    global proc

    signal.signal(signal.SIGINT, handle_termination)
    signal.signal(signal.SIGTERM, handle_termination)

    try:
        # Get the directory where the script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        # Construct path to index.js relative to script location
        index_js_path = os.path.join(script_dir, 'dist', 'index.js')
        
        command = ['node', index_js_path]
        
        popen_kwargs = {
            "stdin": sys.stdin,
            "stdout": sys.stdout,
            "stderr": sys.stderr,
            "env": os.environ,
        }

        # Platform-specific arguments
        if platform.system() == "Windows":
            popen_kwargs["creationflags"] = CREATE_NO_WINDOW
        else:
            # On Unix-like systems, start the process in a new session
            # to make it a process group leader. This allows killing
            # the process and all its children together.
            popen_kwargs["start_new_session"] = True

        proc = subprocess.Popen(
            command,
            **popen_kwargs
        )

        proc.wait()

    except Exception as e:
        sys.stderr.write(f"Error: {str(e)}\n")
    finally:
        if proc and proc.poll() is None:
            handle_termination(None, None)

    sys.exit(proc.returncode if proc else 1)

if __name__ == "__main__":
    main() 