# Run CyberLoy LMS on Your Local Network

The frontend is served on port `3035`; its `/api` requests are proxied to the
Laravel backend on port `8010`. This avoids ports `8000` and `8001`, which are
occupied by Docker Desktop on this machine.

## Start both services

From PowerShell in the project root, run:

```powershell
.\start-local.ps1
```

Or start them in two terminals:

```powershell
cd backend
php artisan serve --host=0.0.0.0 --port=8010
```

```powershell
cd frontend
& "C:\Program Files\nodejs\npm.cmd" run dev
```

Use `npm.cmd` because an empty file named `C:\Windows\System32\npm` currently
shadows the normal `npm` command in PowerShell.

## Open the LMS

- This computer: `http://localhost:3035`
- Another device on the same Wi-Fi/LAN: `http://<host-computer-IP>:3035`

Find the host IP with `ipconfig` and use its IPv4 address (for example,
`http://192.168.1.25:3035`). Allow the Windows Firewall prompt for **Private
networks** when it appears. If no prompt appears, create inbound Private-network
rules for TCP ports `3035` and `8010`.

The demo seed accounts are for local development only. Replace their credentials
and remove them before exposing any deployment to the internet. Configure SMTP
locally if you need to test password-reset and email-verification delivery;
with `MAIL_MAILER=log`, messages are written to the Laravel log rather than sent.

Run `php artisan migrate` in `backend/` after updating the application. New
accounts require email verification by default, so check the mail log locally
or configure a development mail catcher.
