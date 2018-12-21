![steering](https://github.com/Gernby/OpenPilot_Dashboard/blob/master/SteeringDashboard.png)

![binary](https://github.com/Gernby/OpenPilot_Dashboard/blob/master/BinaryDashboard.png)

# OpenPilot_Dashboard

This dashboard has been invalluable to me while enhancing lateral control for OpenPilot, and think it would be equally valuable to anyone that's trying to resolve a lateral tuning issue.

The UI is web-based, and runs on every platform I've tried, including my iPhone.  The server can be setup to run on a laptop, or dedicated server.  The server doesn't need to be powerful, but performance will be limited.  I've successfully configured a Raspberry Pi 3B as a server for this, and it worked surprisingly well.

If you are running a custom fork of OpenPilot, you can publish generic ZMQ feeds to the server without much effort.  My fork of OpenPilot has a generic stream of raw CAN data coming from parcer.cc at a frame rate of 10Hz.  I also have generic streams coming from various other Python modules, depending on what I'm trying to do with the branch.  If you want to run the standard fork of OpenPilot, you will need additional libraries on your server.  

The primary dependencies for generic (non-serealized) ZMQ streams are Python, [ZMQ](http://zeromq.org/bindings:python), [InfluxDB](https://github.com/influxdata/influxdb), and [Grafana](https://grafana.com/grafana/download).  I suggest installing these packages using the instructions for your operating system. 

Depending on your OS, the install commands below might really be helpful:  
`pip install influxdb`  
`pip install grafana-server`  
`pip install pyzmq`

Once you've installed these packages with their defaults (and started them), there's just a couple things that need to be configured before loading the dashboards. 

Create a database in influx called 'carDB'.  This is done using the influx client in a command line. 
`> create database carDB`

_*Note: The http interface to influxDB isn't navigable.  It will return a 404 error if you open it in a browser since it doesn't have index however you can verify by going to query http://localhost:8086/query *_

Load Grafana in your browser (https://localhost:3000), and login using the default user and password, which I think it just "admin" with no password.

On the main page, go to the settings menu, and click "Data Sources".  Then click the Add data sources button, and select influxDB.  If you used all the standard settings for influxDB, the only parameters you need to enter in this screen are `http://localhost:8086` for the URL, and `carDB` for the database.

![binary](https://i.imgur.com/qJjZYen.png)

Now click on + on left side of the menu and then import where you paste the one of the following JSON. You can either get both or just one.

![binary](https://i.imgur.com/yVr3ZrB.png)
Raw CAN Dashboard (https://raw.githubusercontent.com/Gernby/OpenPilot_Dashboard/master/Raw%20CAN%20Dashboard%20-%20Binary)
Steering_Dashboard (https://raw.githubusercontent.com/Gernby/OpenPilot_Dashboard/master/Steering_Dashboard)

![binary](https://i.imgur.com/4Te8yMf.png)
![binary](https://i.imgur.com/cAMiIwj.png)

For more info regarding  Grafana, Please go to the following link(http://docs.grafana.org/installation/) another note make sure Grafana server is running or elsee everything will be null.

All that's left should be creating a dashboard, which can be imported from this repo.

Actually, you still need to run a python client while connected to the EON somehow (WiFi tethering works very well).  The client in this repository has several ports I've used with preconfigured influx insert strings.

If you need help running local network on EON or tethering, Please go to the following link (https://openmechanics.github.io/ssh)

