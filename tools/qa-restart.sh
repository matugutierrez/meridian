cd /data/meridian/fullstack
pkill -f 'node server.js' 2>/dev/null
sleep 1
rm -rf data
PORT=4321 nohup node server.js > /tmp/meridian2.log 2>&1 &
sleep 2
curl -s -m 3 localhost:4321/api/health
echo
bash tools/qa-shots.sh
