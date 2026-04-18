@echo off
REM Run this as Administrator to allow mobile app to connect to backend

echo Adding Windows Firewall Exception for Node.js Port 3000...
netsh advfirewall firewall add rule name="Node.js Port 3000" dir=in action=allow protocol=tcp localport=3000

echo.
echo ✅ Firewall rule added successfully!
echo.
echo Your Android phone should now be able to connect to the backend at http://192.168.0.101:3000
echo.
pause
