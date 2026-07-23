cd /data/meridian/fullstack
node --test 2>&1 | grep -aE 'tests [0-9]|pass [0-9]|fail [0-9]' | tail -3
rm -rf data
PORT=4321 nohup node server.js > /tmp/meridian2.log 2>&1 &
sleep 1.5
curl -s localhost:4321/api/health
echo
echo STEP1-DONE
