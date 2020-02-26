#!/bin/bash
docker-compose -f docker-compose-pc.yml up -d gost-db
wait 10
docker-compose -f docker-compose-pc.yml up -d
docker ps
