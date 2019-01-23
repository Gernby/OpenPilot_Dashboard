#!/usr/bin/env python
import zmq
import time
import numpy as np
from influxdb import InfluxDBClient, SeriesHelper
import selfdrive.messaging as messaging
from selfdrive.services import service_list
from selfdrive.controls.lib.latcontrol_helpers import calc_lookahead_offset
from selfdrive.controls.lib.pathplanner import PathPlanner
from selfdrive.controls.lib.vehicle_model import VehicleModel
from common.realtime import set_realtime_priority, Ratekeeper

def dashboard_thread(rate=100):
  set_realtime_priority(3)

  USER = ''
  PASSWORD = ''
  DBNAME = 'carDB'
  #influx = InfluxDBClient('192.168.1.61', 8086, USER, PASSWORD, DBNAME)
  influx = InfluxDBClient('192.168.43.151', 8086, USER, PASSWORD, DBNAME)
  context = zmq.Context()
  poller = zmq.Poller()
  ipaddress = "127.0.0.1"
  carState = messaging.sub_sock(context, service_list['carState'].port, addr=ipaddress, conflate=True, poller=poller)
  #can = messaging.sub_sock(context, service_list['can'].port, addr=ipaddress, poller=poller)
  can = "disabled"
  vEgo = 0.0
  live100 = messaging.sub_sock(context, service_list['live100'].port, addr=ipaddress, conflate=True, poller=poller)
  #live20 = messaging.sub_sock(context, service_list['live20'].port, addr=ipaddress, conflate=True, poller=poller)
  #model = messaging.sub_sock(context, service_list['model'].port, addr=ipaddress, conflate=True, poller=poller)
  #frame = messaging.sub_sock(context, service_list['frame'].port, addr=ipaddress, conflate=True, poller=poller)
  #sensorEvents = messaging.sub_sock(context, service_list['sensorEvents'].port, addr=ipaddress, conflate=True, poller=poller)
  #carControl = messaging.sub_sock(context, service_list['carControl'].port, addr=ipaddress, conflate=True, poller=poller)
  #health = messaging.sub_sock(context, service_list['health'].port, addr=ipaddress, conflate=True, poller=poller)
  #sendcan = messaging.sub_sock(context, service_list['sendcan'].port, addr=ipaddress, conflate=True, poller=poller)
  #androidLog = messaging.sub_sock(context, service_list['androidLog'].port, addr=ipaddress, conflate=True, poller=poller)
  androidLog = "disabled"
  sendcan = "disabled"
  health = "disabled"
  carControl = "disabled"
  sensorEvents = "disabled"
  frame = "disabled"
  model = "disabled"
  live20 = "disabled"

  _model = None
  _live100 = None
  _live20 = None
  _carState = None
  _can = None
  _frame = None
  _sensorEvents = None
  _carControl = None
  _health = None
  _sendcan = None
  _androidLog = None

  frame_count = 0
  can_count = 0
  sample_str = ""
  canDataString = ""
  influxLineString = ""
  captureResonantParams = True

  current_rate = rate
  rk = Ratekeeper(current_rate, print_delay_threshold=np.inf)

  while 1:
    receiveTime = int(time.time() * 1000000000)
    for socket, event in poller.poll(0):
      if socket is live100:
        _live100 = messaging.recv_one(socket)
        vEgo = _live100.live100.vEgo
        if vEgo > 0:
          if sample_str != "":
              sample_str += ","

          sample_str += ("angleSteersDes=%f,angleSteers=%f,vEgo=%f,steerOverride=%f,vPid=%f,upSteer=%f,uiSteer=%f,ufSteer=%f,cumLagMs=%f,vCruise=%f" %
                      (_live100.live100.angleSteersDes, _live100.live100.angleSteers, _live100.live100.vEgo, _live100.live100.steerOverride, _live100.live100.vPid,
                      _live100.live100.upSteer, _live100.live100.uiSteer, _live100.live100.ufSteer, _live100.live100.cumLagMs, _live100.live100.vCruise))

        '''print(_live100)
          live100 = (
            vEgo = 0,
            aEgoDEPRECATED = 0,
            vPid = 0.3,
            vTargetLead = 0,
            upAccelCmd = 0,
            uiAccelCmd = 0,
            yActualDEPRECATED = 0,
            yDesDEPRECATED = 0,
            upSteer = 0,
            uiSteer = 0,
            aTargetMinDEPRECATED = 0,
            aTargetMaxDEPRECATED = 0,
            jerkFactor = 0,
            angleSteers = -1,
            hudLeadDEPRECATED = 0,
            cumLagMs = -0.57132614,
            canMonoTimeDEPRECATED = 0,
            l20MonoTimeDEPRECATED = 0,
            mdMonoTimeDEPRECATED = 0,
            enabled = false,
            steerOverride = false,
            canMonoTimes = [],
            vCruise = 255,
            rearViewCam = false,
            alertText1 = "",
            alertText2 = "",
            awarenessStatus = 0,
            angleOffset = -0.74244022,
            planMonoTime = 10166703166901,
            angleSteersDes = -1,
            longControlState = off,
            state = disabled,
            vEgoRaw = 0,
            ufAccelCmd = 0,
            ufSteer = 0,
            aTarget = 0,
            active = false,
            curvature = -0.00038641863,
            alertStatus = normal,
            alertSize = none,
            gpsPlannerActive = false,
            engageable = false,
            alertBlinkingRate = 0,
            driverMonitoringOn = false,
            alertType = "",
            alertSound = "" ) )'''
      #elif socket is model:
      #  _model = messaging.recv_one(socket)
        '''model = (
                frameId = 19786,
                path = (
                points = [-0.002040863, 0.0048789978, 0.0024032593, -0.029251099, -0.050567627, -0.071716309, -0.10424805, -0.14196777, -0.18005371, -0.20825195, -0.2277832, -0.26391602, -0.31420898, -0.38085938, -0.43212891, -0.47900391, -0.51318359, -0.56494141, -0.62646484, -0.68212891, -0.73632812, -0.74951172, -0.82519531, -0.89648438, -0.97265625, -1.0615234, -1.1464844, -1.2412109, -1.3369141, -1.4462891, -1.5488281, -1.6445312, -1.7460938, -1.8544922, -1.9658203, -2.0820312, -2.2089844, -2.3320312, -2.484375, -2.6152344, -2.7265625, -2.8554688, -2.984375, -3.1425781, -3.2636719, -3.4160156, -3.5566406, -3.6835938, -3.8222656, -3.9746094],
                prob = 1,
                std = -0.66490114 ),
                leftLane = (
                points = [1.7112548, 1.7149169, 1.720166, 1.7105224, 1.704602, 1.7070434, 1.7025878, 1.6870239, 1.6792724, 1.6579101, 1.6454589, 1.633374, 1.6216552, 1.6204345, 1.5994384, 1.5890625, 1.5706298, 1.5534179, 1.539746, 1.5231445, 1.5058105, 1.4767578, 1.4601562, 1.4442871, 1.4245117, 1.407666, 1.3986328, 1.3683593, 1.340039, 1.3173339, 1.2873046, 1.2677734, 1.234082, 1.199414, 1.1696289, 1.1339843, 1.1095703, 1.0788085, 1.0495117, 1.0299804, 0.98798829, 0.95527345, 0.925, 0.89277345, 0.86982423, 0.81464845, 0.77656251, 0.75117189, 0.71308595, 0.66328126],
                prob = 0.11716748,
                std = -3.1076281 ),
                rightLane = (
                points = [-2.0839355, -2.0990722, -2.1112792, -2.1142089, -2.1159179, -2.1269042, -2.1374023, -2.1483886, -2.1569335, -2.1713378, -2.1752441, -2.1828125, -2.1942871, -2.2208984, -2.2377441, -2.2616699, -2.3014648, -2.3073242, -2.3302734, -2.3463867, -2.3625, -2.37666, -2.3898437, -2.4123046, -2.4396484, -2.4586914, -2.4953125, -2.5304687, -2.5529296, -2.5724609, -2.6032226, -2.6344726, -2.6637695, -2.6911132, -2.727246, -2.758496, -2.7921875, -2.8205078, -2.8458984, -2.8791015, -2.9230468, -2.9416015, -2.9894531, -3.0148437, -3.0392578, -3.0695312, -3.1144531, -3.1388671, -3.1652343, -3.1916015],
                prob = 0.095686942,
                std = -2.2504346 ),
                lead = (dist = 13.424072, prob = 0.37279058, std = 16.329063),
                settings = (
                bigBoxX = 0,
                bigBoxY = 0,
                bigBoxWidth = 0,
                bigBoxHeight = 0,
                inputTransform = [1.25, 0, 374, 0, 1.25, 337.75, 0, 0, 1] ) ) )'''
      #elif socket is live20:
      #  _live20 = messaging.recv_one(socket)
        '''live20 = (
            angleOffsetDEPRECATED = 0,
            calStatusDEPRECATED = 0,
            leadOne = (
            dRel = 0,
            yRel = 0,
            vRel = 0,
            aRel = 0,
            vLead = 0,
            aLeadDEPRECATED = 0,
            dPath = 0,
            vLat = 0,
            vLeadK = 0,
            aLeadK = 0,
            fcw = false,
            status = false,
            aLeadTau = 0 ),
            cumLagMs = 7678.7031,
            mdMonoTime = 10166684697265,
            ftMonoTimeDEPRECATED = 0,
            calCycleDEPRECATED = 0,
            calPercDEPRECATED = 0,
            canMonoTimes = [],
            l100MonoTime = 10166705048151,
            radarErrors = [] ) )'''
      elif socket is carState:
        _carState = messaging.recv_one(socket)
        if vEgo > 0:
          if sample_str != "":
              sample_str += ","
          sample_str += ("steeringTorque=%f,steeringRate=%f,yawRate=%f" % (_carState.carState.steeringTorque, _carState.carState.steeringRate, _carState.carState.yawRate))

        '''carState = (
            vEgo = 0,
            wheelSpeeds = (fl = 0, fr = 0, rl = 0, rr = 0),
            gas = 0,
            gasPressed = false,
            brake = 0,
            brakePressed = false,
            steeringAngle = -1,
            steeringTorque = 84,
            steeringPressed = false,
            cruiseState = (
            enabled = false,
            speed = 0,
            available = true,
            speedOffset = -0.3,
            standstill = false ),
            buttonEvents = [],
            canMonoTimes = [],
            events = [
            ( name = wrongGear,
                enable = false,
                noEntry = true,
                warning = false,
                userDisable = false,
                softDisable = true,
                immediateDisable = false,
                preEnable = false,
                permanent = false ),
            gearShifter = park,
            steeringRate = 0,
            aEgo = 0,
            vEgoRaw = 0,
            standstill = true,
            brakeLights = false,
            leftBlinker = false,
            rightBlinker = false,
            yawRate = -0,
            genericToggle = false,
            doorOpen = false,
            seatbeltUnlatched = true ) )'''
      elif socket is can:
        recordBus = [2,]
        recordPid = [228,]
        receiveTime = int(time.time() * 1000000000)
        words = [0,0,0,0]
        for _can in messaging.drain_sock(socket):
          for msg in _can.can:
            can_count += 1
            if msg.src in recordBus and (len(recordPid) == 0 or msg.address in recordPid):
              All64 = int(msg.dat.encode("hex"), 16)
              Second32 = All64 & 0xFFFFFFFF
              words[3] = Second32 & 0xFFFF
              words[2] = Second32 >> 16
              First32 = All64 >> 32
              words[1] = First32 & 0xFFFF
              words[0] = First32 >> 16
              canDataString += ('rawCANData,pid=%s,bus=%s First32=%di,Second32=%di,word1=%di,word2=%di,word3=%di,word4=%di %d\n' %
                      (msg.address, msg.src, First32, Second32, words[0], words[1], words[2], words[3], receiveTime))
        '''print(_can)
        can = [
            ( address = 513,
            busTime = 42188,
            dat = "",
            src = 1 ),'''
      #elif socket is frame:
      #  _frame = messaging.recv_one(socket)
        '''frame = (
            frameId = 14948,
            encodeId = 14947,
            timestampEof = 10728391665000,
            frameLength = 5419,
            integLines = 601,
            globalGain = 509,
            frameType = unknown,
            timestampSof = 0,
            transform = [1, 0, 0, 0, 1, 0, 0, 0, 1],
            lensPos = 281,
            lensSag = -0.59991455,
            lensErr = 54,
            lensTruePos = 273.13062 ) )'''
      #elif socket is sensorEvents:
      #  _sensorEvents = messaging.recv_one(socket)
        '''sensorEvents = [
            ( version = 104,
            sensor = 2,
            type = 2,
            timestamp = 10551787945172,
            magnetic = (
                v = [-40.446472, 92.475891, 17.285156],
                status = 2 ),
            source = android,
            uncalibratedDEPRECATED = false ),
            ( version = 104,
            sensor = 5,
            type = 16,
            timestamp = 10551844372174,
            source = android,
            uncalibratedDEPRECATED = false,
            gyroUncalibrated = (
                v = [-0.00062561035, -0.0029144287, -0.039916992, 1.5258789e-05, -0.0028686523, -0.039474487],
                status = 0 ) ) ] )'''
      #elif socket is carControl:
      #  _carControl = messaging.recv_one(socket)
        '''carControl = (
                enabled = false,
                gasDEPRECATED = 0,
                brakeDEPRECATED = 0,
                steeringTorqueDEPRECATED = 0,
                cruiseControl = (
                cancel = false,
                override = true,
                speedOverride = 0,
                accelOverride = 0.714 ),
                hudControl = (
                speedVisible = false,
                setSpeed = 70.833336,
                lanesVisible = false,
                leadVisible = false,
                visualAlert = none,
                audibleAlert = none ),
                actuators = (gas = 0, brake = -0, steer = 0, steerAngle = -2.7103169),
                active = false ) )'''
      #elif socket is _health:
      #  _health = messaging.recv_one(socket)
      #  print(_health)
      #elif socket is _sendcan:
      #  _sendcan = messaging.recv_one(socket)
      #  print(_sendcan)
      #elif socket is _androidLog:
      #  _androidLog = messaging.recv_one(socket)
      #  print(_androidLog)

    if sample_str != "":
        influxLineString += ("opData,sources=capnp " + sample_str + " %s\n" % receiveTime)
        frame_count += 1
        sample_str = ""
    if canDataString != "":
        influxLineString += canDataString
        frame_count += 1
        canDataString = ""

    if frame_count >= 4:
        headers = { 'Content-type': 'application/octet-stream', 'Accept': 'text/plain' }
        try:
            influx.request("write",'POST', {'db':DBNAME}, influxLineString.encode('utf-8'), 204, headers)
            if current_rate != rate:
              current_rate = rate
              rk = Ratekeeper(current_rate, print_delay_threshold=np.inf)
            print ('%d %d' % (frame_count, len(influxLineString)))
        except:
            if current_rate != 1:
              current_rate = 1
              rk = Ratekeeper(current_rate, print_delay_threshold=np.inf)
            continue
        frame_count = 0
        can_count = 0
        influxLineString = ""

    rk.keep_time()

def main(rate=200):
  dashboard_thread(rate)

if __name__ == "__main__":
  main()
