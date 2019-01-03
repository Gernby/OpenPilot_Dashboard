REM @echo off
start .\influxdb-1.7.2-1\influxd.exe
cd .\grafana-5.4.2\bin
start grafana-server.exe
cd ..\..
start python ZMQ-Influx-Client.py
start "" http://localhost:3000
