chromium --headless --disable-gpu --no-sandbox --window-size=1280,900 --virtual-time-budget=6000 --screenshot=/tmp/purchases.png 'http://127.0.0.1:4321/?demo=1#/purchases' 2>/dev/null
chromium --headless --disable-gpu --no-sandbox --window-size=1280,900 --virtual-time-budget=7000 --screenshot=/tmp/reports.png 'http://127.0.0.1:4321/?demo=1#/reports' 2>/dev/null
ls -la /tmp/purchases.png /tmp/reports.png
echo SHOTS-DONE
