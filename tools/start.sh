cd /data/meridian/fullstack
rm -rf data
PORT=4321 node server.js &
echo $! > /tmp/msrv.pid
sleep 2
curl -s localhost:4321/api/health
echo
echo SERVER-STARTED
