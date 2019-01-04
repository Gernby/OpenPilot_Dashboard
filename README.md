![steering](https://github.com/Gernby/OpenPilot_Dashboard/blob/master/SteeringDashboard.png)

![binary](https://github.com/Gernby/OpenPilot_Dashboard/blob/master/BinaryDashboard.png)

# Windows 10 OpenPilot_Dashboard Quick setup

1. [Download ZIP File](../../archive/master.zip)
2. Extract `OpenPilot_Dashboard-master.zip`
3. Run `install.bat` to install Python 2.7 and dependencies. Click Yes on the UAC security prompt to allow it to install. When it's done, press any key to continue at the prompt. You only need to install this once.
4. Make sure your EON is running a branch that includes Gernby's ZMQ Forwarder. Enable the hotspot tethering on your EON and connect your computer to it.
5. Start your car.
6. Click `run.bat` to start InfluxDB, Grafana, and the ZMQ influx Client.
7. A browser window will open the Grafana web interface located at http://localhost:3000
Username: admin
Password: admin
8. Click the Home drop down menu and select one of the dashboards. Example: `Steering 10_k`
9. To begin viewing live data, select the date picker in the upper right and enter From: `now-15s` and select Refreshing every `200ms`. Click Apply.
10. Start driving and Engage openpilot. Data will start to flow into the dashboard once openpilot is engaged.

# Prebuilt VMWare Virtual Machine

A VMWare Machine (Hardware v12) has been built using Ubuntu 18.04 LTS
The machine has no Desktop Environment, but contains everything needed.
It is configured with 2 Network Interfaces.  1 is a bridge, the other is Local Only.
Uses 1 CPU, 512M RAM, and is 3.6GB in size, it has a 20GB max size, so you can store HEAPS!

1. Watch the Video on how to use it : https://youtu.be/egYiMAJIYqQ
2. Honestly, watch the video before asking questions, it covers all the points below
3. Download the VMWare Image from here : https://drive.google.com/file/d/18OmSWia2sBbz9Npn9Eewr_rAV6zVQUTO/view?usp=sharing
4. Install VMWare Workstation Player or VMWare Fusion if not installed
5. Connect to your EON Hotspot
6. Extract downloaded Image, and double click on the VMX file
7. login, username = `user`, password = `password`  <-- take note of the IP Addresses
8. type: `python2.7 OpenPilot_Dashboard/ZMQ-Influx-Client.py` and press enter
9. In a web browser, type in one of the IP Addresses followed by :3000
10. Enjoy

Ask for support in `#openpilot-dashboard` on Discord https://discord.gg/Wyna3qy
Or in `#dashboard` on Slack https://comma.slack.com

# Ubuntu 18.04 Installation Instructions (Should be same for all distro's which use aptitude and systemd)

1. `sudo apt update -y && sudo apt upgrade -y` <-- Update and Upgrade before starting
2. `sudo apt install influxdb influxdb-client -y` <-- Install Influx client and server
3. `influx` <-- Launch Influx
4. `create database carDB` <-- Crate database
5. `exit` <-- quit influx
6. `sudo echo "deb https://packagecloud.io/grafana/stable/debian/ stretch main" >> /etc/apt/sources.list.d/grafana.list` <-- add APT source
7. `sudo curl https://packagecloud.io/gpg.key | sudo apt-key add -` <-- add key for source
8. `sudo apt update` <-- update aptitude
9. `sudo apt-get install grafana pip -y` <-- Install Grafana and pip
10. `sudo systemctl daemon-reload` <--Reload systemd
11. `sudo systemctl enable grafana-server` <-- Enable grafana on boot
12. `sudo systemctl start grafana-server` <-- Start Grafana
13. `pip install zmq`
14. `pip install influxdb`
15. `sudo apt install git`
16. `git clone https://github.com/Gernby/OpenPilot_Dashboard.git`
17. `python2.7 OpenPilot_Dashboard/ZMQ-Influx-Client.py`
18. Connect to your EON Hotspot
19. In a web browser, type in localhost:3000
20. Enjoy

Ask for support in `#openpilot-dashboard` on Discord https://discord.gg/Wyna3qy
Or in `#dashboard` on Slack https://comma.slack.com

# OpenPilot_Dashboard Generic Setup Instructions

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
