#!/bin/bash
sudo apt-get update
sudo apt-get -y install watchdog llvm libatlas-base-dev liblapack-dev gfortran python3-scipy libasound-dev portaudio19-dev

pip3 install -r requirements_pi.txt

chmod +x ./src/listener.py
chmod +x ./autostart_listener.sh

mkdir savedfiles
sudo cp insectcounter.service /etc/systemd/system/
sudo systemctl enable insectcounter


sudo mkdir /mnt/ramdisk
echo 'tmpfs       /mnt/ramdisk tmpfs   nodev,nosuid,noexec,nodiratime,size=8M   0 0' | sudo tee -a /etc/fstab
sudo mount -a