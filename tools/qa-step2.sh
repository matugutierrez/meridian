cd /data/meridian/fullstack
pkill -f 'node server.js' 2>/dev/null
sleep 1
cat /tmp/meridian2.log 2>/dev/null | tail -2
rm -rf data
PORT=4321 nohup node server.js > /tmp/meridian2.log 2>&1 &
sleep 1.5
curl -s localhost:4321/api/health
echo
echo STEP2-DONE
