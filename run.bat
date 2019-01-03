@echo off
start /D .\influxdb-1.7.2-1\ "influxd" influxd.exe -config influxdb.conf
cd .\grafana-5.4.2\bin
start grafana-server.exe
cd ..\..
start python ZMQ-Influx-Client.py
start "" http://localhost:3000
