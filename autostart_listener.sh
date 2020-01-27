#! /bin/sh

cd /home/pi/project29

export $(egrep -v '^#' .env | xargs)

cd src

sleep 10

./listener.py --threshold $THRESHOLD --permanent $PERMANENT --use_sensor $USE_SENSOR --server_url $SERVER_URL

exit 0