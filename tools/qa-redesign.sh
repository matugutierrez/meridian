cd /data/meridian/fullstack
pkill -f 'node server.js' 2>/dev/null
sleep 1
rm -rf data
PORT=4321 nohup node server.js > /tmp/meridian3.log 2>&1 &
sleep 2
curl -s -m 3 localhost:4321/api/health | head -c 60
echo
chromium --headless --disable-gpu --no-sandbox --window-size=1280,900 --virtual-time-budget=6000 --screenshot=/tmp/r-login.png 'http://127.0.0.1:4321/' 2>/dev/null
chromium --headless --disable-gpu --no-sandbox --window-size=1280,900 --virtual-time-budget=7000 --screenshot=/tmp/r-dash.png 'http://127.0.0.1:4321/?demo=1' 2>/dev/null
chromium --headless --disable-gpu --no-sandbox --window-size=1280,900 --virtual-time-budget=7000 --screenshot=/tmp/r-pos.png 'http://127.0.0.1:4321/?demo=1#/pos' 2>/dev/null
ls -la /tmp/r-login.png /tmp/r-dash.png /tmp/r-pos.png
echo QA-REDESIGN-DONE
