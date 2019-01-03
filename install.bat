@echo off
msiexec /qb /i python-2.7.15.amd64.msi ALLUSERS=1 ADDLOCAL=ALL REBOOT=ReallySuppress
SET PATH=%PATH%;C:\Python27\;C:\Python27\Scripts
python -m pip install --upgrade pip
pip install influxdb
pip install pyzmq
pause

