import fs from "fs";
import path from "path";

let cachedPythonPath: string | null = null;

/**
 * Resolves the actual working Python executable across platforms.
 * On Windows, this specifically bypasses the Microsoft Store stub
 * (AppData\Local\Microsoft\WindowsApps\python.exe) which fails or hangs in subprocesses.
 */
export function getPythonExecutable(): string {
  if (cachedPythonPath) {
    return cachedPythonPath;
  }

  // 1. Explicit environment variable
  if (process.env.PYTHON_PATH && fs.existsSync(process.env.PYTHON_PATH)) {
    cachedPythonPath = process.env.PYTHON_PATH;
    return cachedPythonPath;
  }

  // 2. Windows-specific user/local installations
  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA || "";
    const userProfile = process.env.USERPROFILE || "";

    const candidates = [
      // Standard user Python installer path
      path.join(localAppData, "Python", "bin", "python.exe"),
      path.join(localAppData, "Programs", "Python", "Python314", "python.exe"),
      path.join(localAppData, "Programs", "Python", "Python313", "python.exe"),
      path.join(localAppData, "Programs", "Python", "Python312", "python.exe"),
      path.join(localAppData, "Programs", "Python", "Python311", "python.exe"),
      path.join(localAppData, "Programs", "Python", "Python310", "python.exe"),
      // Workspace virtual environment
      path.join(process.cwd(), "ml-service", ".venv", "Scripts", "python.exe"),
      path.join(process.cwd(), ".venv", "Scripts", "python.exe"),
      // Global Windows Python installs
      "C:\\Python314\\python.exe",
      "C:\\Python313\\python.exe",
      "C:\\Python312\\python.exe",
      "C:\\Python311\\python.exe",
      path.join(userProfile, ".conda", "python.exe"),
    ];

    for (const cand of candidates) {
      if (cand && fs.existsSync(cand)) {
        cachedPythonPath = cand;
        return cachedPythonPath;
      }
    }
  } else {
    // Unix / macOS
    const unixCandidates = [
      path.join(process.cwd(), "ml-service", ".venv", "bin", "python"),
      path.join(process.cwd(), ".venv", "bin", "python"),
      "/usr/bin/python3",
      "/usr/local/bin/python3",
      "/opt/homebrew/bin/python3",
    ];

    for (const cand of unixCandidates) {
      if (fs.existsSync(cand)) {
        cachedPythonPath = cand;
        return cachedPythonPath;
      }
    }
  }

  // 3. Fallback to generic name if no specific binary was found
  cachedPythonPath = process.platform === "win32" ? "python" : "python3";
  return cachedPythonPath;
}
