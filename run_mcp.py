import sys
import os
import subprocess
import signal
import platform

CREATE_NO_WINDOW = 0x08000000

proc = None

def handle_termination(signum, frame):
    if proc and proc.poll() is None:
        try:
            # On Windows, terminating the shell process doesn't always terminate the child
            # so we need to handle it more gracefully.
            if platform.system() == "Windows":
                subprocess.call(['taskkill', '/F', '/T', '/PID', str(proc.pid)])
            else:
                proc.terminate()
                proc.wait(timeout=1)
        except Exception:
            try:
                proc.kill()
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
        
        # Prepare arguments for Popen, excluding creationflags initially
        popen_kwargs = {
            "stdin": sys.stdin,
            "stdout": sys.stdout,
            "stderr": sys.stderr,
            "shell": True,
            "env": os.environ,
        }

        # Conditionally add creationflags only on Windows
        if platform.system() == "Windows":
            popen_kwargs["creationflags"] = CREATE_NO_WINDOW

        proc = subprocess.Popen(
            f"node {index_js_path}",
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