#!/bin/bash

docker-compose -f docker-compose-pc.yml build
docker-compose -f docker-compose-pc.yml pull
