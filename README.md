![honda steering torque7](https://user-images.githubusercontent.com/6308011/50301232-603ac280-044c-11e9-9de4-4503d3efc7a0.png)

# OpenPilot_Dashboard

This dashboard has been invalluable to me while enhancing lateral control for OpenPilot, and think it would be equally valuable to anyone that's trying to resolve a lateral tuning issue.

The UI is web-based, and runs on every platform I've tried, including my iPhone.  The server can be setup to run on a laptop, or dedicated server.  The server doesn't need to be powerful, but performance will be limited.  I've successfully configured a Raspberry Pi 3B as a server for this, and it worked surprisingly well.

If you are running a custom fork of OpenPilot, you can publish generic ZMQ feeds to the server without much effort.  My fork of OpenPilot has a generic stream of raw CAN data coming from parcer.cc at a frame rate of 10Hz.  I also have generic streams coming from various other Python modules, depending on what I'm trying to do with the branch.  If you want to run the standard fork of OpenPilot, you will need additional libraries on your server.  

The primary dependencies for generic (non-serealized) ZMQ streams are Python, [ZMQ](http://zeromq.org/bindings:python), [InfluxDB](https://github.com/influxdata/influxdb), and [Grafana](https://grafana.com/grafana/download).  I suggest installing these packages using the instructions for your operating system. 

Depending on your OS, the install commands below might really be helpful:  
`pip install influxdb`  
`pip install grafana-server`  
`pip install pyzmq`

Once you've installed these packages with their defaults, there's just a couple things that need to be configured before running the dashboard. 

Create a database in influx called 'carDB'.  This is done using the influx client in a command line.  
`> create database carDB`

Load Grafana in your browser (localhost:3000), and login using the default user and password, which I think it just "admin" with no password.

On the main page, go to the settings menu, and click "Data Sources".  Then click the Add data sources button, and select influxDB.  If you used all the standard settings for influxDB, the only parameters you need to enter in this screen are `http://localhost:8086` for the URL, and `carDB` for the database.

All that's left should be creating a dashboard, which can be imported from this repo.

Actually, you still need to run a python client while connected to the EON somehow (WiFi tethering works very well).  The client in this repository has several ports I've used with preconfigured influx insert strings.
