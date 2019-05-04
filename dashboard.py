#!/usr/bin/env python
import zmq
import time
import os
import json
import selfdrive.messaging as messaging
from selfdrive.services import service_list
from common.params import Params

def dashboard_thread():

  context = zmq.Context()
  poller = zmq.Poller()
  ipaddress = "127.0.0.1"
  vEgo = 0.0
  live100 = messaging.sub_sock(context, service_list['live100'].port, addr=ipaddress, conflate=False, poller=poller)
  liveMap = messaging.sub_sock(context, service_list['liveMapData'].port, addr=ipaddress, conflate=False, poller=poller)
  frame_count = 0

  try:
    if os.path.isfile('/data/kegman.json'):
      with open('/data/kegman.json', 'r') as f:
        config = json.load(f)
        user_id = config['userID']
    else:
        params = Params()
        user_id = params.get("DongleId")
  except:
    params = Params()
    user_id = params.get("DongleId")

  context = zmq.Context()
  steerpub = context.socket(zmq.PUSH)
  #steerpub.connect("tcp://kevo.live:8594")
  steerpub.connect("tcp://gernstation.synology.me:8594")
  influxFormatString = user_id + ",sources=capnp ff_standard=;angle_steers_des=;angle_steers=;steer_override=;v_ego=;p=;i=;f=;cumLagMs=; "
  influxDataString = ""
  mapFormatString = "location,user=" + user_id + " latitude=;longitude=;altitude=;speed=;bearing=;accuracy=;speedLimitValid=;speedLimit=;curvatureValid=;curvature=;wayId=;distToTurn=;mapValid=;speedAdvisoryValid=;speedAdvisory=;speedAdvisoryValid=;speedAdvisory=;speedLimitAheadValid=;speedLimitAhead=;speedLimitAheadDistance=; "
  mapDataString = ""
  sendString = ""

  monoTimeOffset = 0
  receiveTime = 0

  while 1:
    for socket, event in poller.poll(0):
      if socket is liveMap:
        _liveMap = messaging.drain_sock(socket)
        for lmap in _liveMap:
          if vEgo > 0:
            receiveTime = int((monoTimeOffset + lmap.logMonoTime) * .0000002) * 5
            if (abs(receiveTime - int(time.time() * 1000)) > 10000):
              monoTimeOffset = (time.time() * 1000000000) - lmap.logMonoTime
              receiveTime = int((monoTimeOffset + lmap.logMonoTime) * 0.0000002) * 5
            lm = lmap.liveMapData
            lg = lm.lastGps
            #print(lm)
            mapDataString += ("%f,%f,%f,%f,%f,%f,%d,%f,%d,%f,%f,%f,%d,%d,%f,%d,%f,%d,%f,%f,%d|" %
                  (lg.latitude ,lg.longitude ,lg.altitude ,lg.speed ,lg.bearing ,lg.accuracy ,lm.speedLimitValid ,lm.speedLimit ,lm.curvatureValid
                  ,lm.curvature ,lm.wayId ,lm.distToTurn ,lm.mapValid ,lm.speedAdvisoryValid ,lm.speedAdvisory ,lm.speedAdvisoryValid ,lm.speedAdvisory
                  ,lm.speedLimitAheadValid ,lm.speedLimitAhead , lm.speedLimitAheadDistance , receiveTime))

      if socket is live100:
        _live100 = messaging.drain_sock(socket)
        for l100 in _live100:
          vEgo = l100.live100.vEgo
          receiveTime = int((monoTimeOffset + l100.logMonoTime) * .0000002) * 5
          if (abs(receiveTime - int(time.time() * 1000)) > 10000):
            monoTimeOffset = (time.time() * 1000000000) - l100.logMonoTime
            receiveTime = int((monoTimeOffset + l100.logMonoTime) * 0.0000002) * 5
          if vEgo > 0:

            influxDataString += ("%d,%0.2f,%0.2f,%d,%0.1f,%0.4f,%0.4f,%0.4f,%0.2f,%d|" %
                (1.0, l100.live100.angleSteersDes, l100.live100.angleSteers, l100.live100.steerOverride, vEgo,
                l100.live100.upSteer, l100.live100.uiSteer, l100.live100.ufSteer, l100.live100.cumLagMs, receiveTime))

            frame_count += 1

    if frame_count >= 20:
      sendString = influxFormatString + "~" + influxDataString
      if mapDataString != "":
        sendString += "!" + mapFormatString + "~" + mapDataString
      steerpub.send_string(sendString)
      print("frames: %d   Characters: %d" % (frame_count, len(influxDataString)))
      frame_count = 0
      influxDataString = ""
      mapDataString = ""
    else:
      time.sleep(0.1)

def main():
  dashboard_thread()

if __name__ == "__main__":
  main()
