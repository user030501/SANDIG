# Offline Windows Installer

`build.ps1` creates a 64-bit Inno Setup installer. The resulting setup runs without network access and includes the frontend, Express API, AI service, Node runtime, MariaDB, and the Microsoft Visual C++ runtime.

## Build machine

- Windows 10/11 x64 with Node.js/npm and Inno Setup 6.
- Install project dependencies from the root and `server` package lockfiles.
- Create `ai-service/.venv`, install `ai-service/requirements.txt`, and install PyInstaller into that environment.
- Close SANDIG's Vite and backend development servers before building so Prisma can regenerate its native client.
- Place the official x64 Node.js `node.exe` at `installer/vendor/node.exe`.
- Extract the official x64 MariaDB ZIP to `installer/vendor/mariadb` so `bin/mariadbd.exe`, `bin/mariadb.exe`, and `bin/mariadb-install-db.exe` are present.
- Place Microsoft's official x64 Visual C++ Redistributable installer at `installer/vendor/vc_redist.x64.exe`.

Then run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
./installer/build.ps1
```

The versioned setup executable is written to a unique directory under `installer/build`. The builder does not delete previous build output. Use runtime downloads from their official sources and review the included licenses before redistribution; the installer requires administrator permission to install the Visual C++ runtime.

## Installed behavior

The desktop shortcut starts MariaDB, the local AI service, and the production Express server, then opens the browser. Services bind to loopback and use available ports, so an existing XAMPP/MySQL instance on port 3306 does not need to be stopped. The MariaDB database and generated configuration are stored under the installing user's `%LOCALAPPDATA%\SANDIG`; uninstalling or upgrading the app does not remove that data. Use **Stop SANDIG** before shutting down Windows if you want the child processes closed immediately.

On first start, Prisma creates the schema and the existing synthetic demo seed is loaded once. A separate marker prevents the seed script from running again on upgrades or later starts. The demo login is `admin` / `sandig2026`; change it before entering real records. Keep the Windows account protected because the local database contains sensitive health and disability information.

The package builder expects the backend production build and Prisma Client generation to succeed. Do not distribute an installer until the generated package has been tested on a clean Windows machine without Node.js, Python, MySQL, or internet access.