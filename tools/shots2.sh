chromium --headless --disable-gpu --no-sandbox --window-size=1280,900 --virtual-time-budget=6000 --screenshot=/tmp/r-login.png 'http://127.0.0.1:4321/' 2>/dev/null
echo login-done
chromium --headless --disable-gpu --no-sandbox --window-size=1280,900 --virtual-time-budget=7000 --screenshot=/tmp/r-dash.png 'http://127.0.0.1:4321/?demo=1' 2>/dev/null
echo dash-done
chromium --headless --disable-gpu --no-sandbox --window-size=1280,900 --virtual-time-budget=7000 --screenshot=/tmp/r-pos.png 'http://127.0.0.1:4321/?demo=1#/pos' 2>/dev/null
echo pos-done
ls -la /tmp/r-login.png /tmp/r-dash.png /tmp/r-pos.png
