import zmq
import time
import json
from influxdb import InfluxDBClient, SeriesHelper

USER = ''
PASSWORD = ''
DBNAME = 'carDB'
influx = InfluxDBClient('localhost', 8086, USER, PASSWORD, DBNAME)
influxLineString = ""
latControlstring = 'steerData3,testName=secondRun,active=%s,ff_type=%s ff_type_a=%s,ff_type_r=%s,steer_status=%s,steer_torque_motor=%s,steering_control_active=%s,steer_parameter1=%s,steer_parameter2=%s,steer_parameter3=%s,steer_parameter4=%s,steer_parameter5=%s,steer_parameter6=%s,steer_stock_torque=%s,steer_stock_torque_request=%s,x=%s,y=%s,y1=%s,y2=%s,y3=%s,y3=%s,psi=%s,delta=%s,t=%s,curvature_factor=%s,slip_factor=%s,resonant_period=%s,accel_limit=%s,restricted_steer_rate=%s,ff_angle_factor=%s,ff_rate_factor=%s,pCost=%s,lCost=%s,rCost=%s,hCost=%s,srCost=%s,' + \
                    'steer_torque_motor=%s,driver_torque=%s,angle_rate_count=%s,angle_rate_desired=%s,avg_angle_rate=%s,future_angle_steers=%s,angle_rate=%s,steer_zero_crossing=%s,' + \
                    'center_angle=%s,angle_steers=%s,angle_steers_des=%s,angle_offset=%s,self.angle_steers_des_mpc=%s,' + \
                    'steerRatio=%s,steerKf=%s,steerKpV[0]=%s,steerKiV[0]=%s,steerRateCost=%s,l_prob=%s,r_prob=%s,c_prob=%s,p_prob=%s,' + \
                    'l_poly[0]=%s,l_poly[1]=%s,l_poly[2]=%s,l_poly[3]=%s,r_poly[0]=%s,r_poly[1]=%s,r_poly[2]=%s,r_poly[3]=%s,p_poly[0]=%s,p_poly[1]=%s,p_poly[2]=%s,p_poly[3]=%s,' + \
                    'c_poly[0]=%s,c_poly[1]=%s,c_poly[2]=%s,c_poly[3]=%s,d_poly[0]=%s,d_poly[1]=%s,d_poly[2]=%s,lane_width=%s,lane_width_estimate=%s,lane_width_certainty=%s,' + \
                    'v_ego=%s,p=%s,i=%s,f=%s %s\n'

canFrameString = 'rawCANData,pid=%s,bus=%s First32=%di,Second32=%di,word1=%di,word2=%di,word3=%di,sword4=%di,sword1=%di,sword2=%di,sword3=%di,word4=%di %d\n'
canByteString = 'rawCANBytes,pid=%s,bus=%s,bNum=b%s data=%di %d\n'
#steerFrameString = 'steerData,testName=secondRun lkas_hud_GERNBY1=%s,lkas_hud_GERNBY2=%s,lkas_hud_LKAS_PROBLEM=%s,lkas_hud_LKAS_OFF=%s,lkas_hud_LDW_RIGHT=%s,lkas_hud_BEEP=%s,lkas_hud_LDW_ON=%s,lkas_hud_LDW_OFF=%s,lkas_hud_CLEAN_WINDSHIELD=%s,lkas_hud_DTC=%s,lkas_hud_CAM_TEMP_HIGH=%s,radar_hud_gernby1=%s,radar_hud_gernby2=%s,radar_hud_gernby3=%s,radar_hud_gernby4=%s,radar_hud_gernby5=%s,radar_hud_gernby6=%s,radar_hud_CMBS_OFF=%s,radar_hud_RESUME_INSTRUCTION=%s,stock_steer_request=%s,stock_steer_set_me_x00=%s,stock_steer_set_me_x00_2=%s,stock_steer_steer_torque=%s,lkas_hud_solid_lanes=%s,lkas_hud_steering_required=%s,lkas_hud_set_me_x48=%s,lkas_hud_set_me_x41=%s,lkas_hud_dashed_lanes=%s,speed=%s,lane11=%s,lane12=%s,lane13=%s,lane14=%s,lane15=%s,lane16=%s,lane17=%s,lane18=%s,lane19=%s,lane1A=%s,lane31=%s,lane32=%s,lane33=%s,lane34=%s,lane35=%s,lane36=%s,lane37=%s,lane38=%s,lane39=%s,lane3A=%s,lane51=%s,lane52=%s,lane53=%s,lane54=%s,lane55=%s,lane56=%s,lane57=%s,lane58=%s,lane59=%s,lane5A=%s,lane71=%s,lane72=%s,lane73=%s,lane74=%s,lane75=%s,lane76=%s,lane77=%s,lane78=%s,lane79=%s,lane7A=%s,stock_lane_center=%s,protect_hard=%s,min_steer_limit=%s,OP_STEER_AT_STOCK_LANE_CENTER=%s,lane_diff_1=%s,lane_diff_2=%s,cross_diff=%s,OP_apply_steer=%s,angle_steers=%s,angle_steers_rate=%s,avg_steer_limit=%s,frame=%s,avg_lane_center=%s,sample_count=%s,sent_apply_steer=%s,steer_torque_driver=%s,stock_lane_limit=%s %s\n'
steerFrameString = 'steerData2,testName=secondRun,active=%s ' + \
                    'lane11=%si,lane12=%si,lane13=%si,lane14=%si,lane15=%si,lane16=%si,lane17=%si,lane18=%si,lane19=%si,lane1A=%si,' + \
                    'lane31=%si,lane32=%si,lane33=%si,lane34=%si,lane35=%si,lane36=%si,lane37=%si,lane38=%si,lane39=%si,lane3A=%si,' + \
                    'lane51=%si,lane52=%si,lane53=%si,lane54=%si,lane55=%si,lane56=%si,lane57=%si,lane58=%si,lane59=%si,lane5A=%si,' + \
                    'lane71=%si,lane72=%si,lane73=%si,lane74=%si,lane75=%si,lane76=%si,lane77=%si,lane78=%si,lane79=%si,lane7A=%si,' + \
                    'angle_steers=%si,angle_steers_rate=%si,sent_apply_steer=%si,stock_steer_steer_torque=%si,steer_torque_driver=%si,' + \
                    'stock_lane_center=%si,stock_lane_curvature=%si,avg_lane_center=%si,avg_lane_curvature=%si,avg_steer_angle=%si,avg_steer_error=%si,' + \
                    'lkas_hud_GERNBY1=%si,lkas_hud_GERNBY2=%si,lkas_hud_LKAS_PROBLEM=%si,lkas_hud_LKAS_OFF=%si,lkas_hud_LDW_RIGHT=%si,lkas_hud_BEEP=%si,' + \
                    'lkas_hud_LDW_ON=%si,lkas_hud_LDW_OFF=%si,lkas_hud_CLEAN_WINDSHIELD=%si,lkas_hud_DTC=%si,lkas_hud_CAM_TEMP_HIGH=%si,radar_hud_gernby1=%si,' + \
                    'radar_hud_gernby2=%si,radar_hud_gernby3=%si,radar_hud_gernby4=%si,radar_hud_gernby5=%si,radar_hud_gernby6=%si,radar_hud_CMBS_OFF=%si,' + \
                    'radar_hud_RESUME_INSTRUCTION=%si,stock_steer_request=%si,stock_steer_set_me_x00=%si,stock_steer_set_me_x00_2=%si,lkas_hud_solid_lanes=%si,' + \
                    'lkas_hud_steering_required=%si,lkas_hud_set_me_x48=%si,lkas_hud_set_me_x41=%si,lkas_hud_dashed_lanes=%si,speed=%si,' + \
                    'stock_lane_center=%si,protect_hard=%si,min_steer_limit=%si,OP_STEER_AT_STOCK_LANE_CENTER=%si,' + \
                    'OP_apply_steer=%si,avg_steer_limit=%si,frame=%si,avg_lane_center=%si,sample_count=%si,stock_lane_limit=%s %s\n'
              
steer2FrameString = 'steerData2,testName=secondRun,active=%s steer_torque_driver=%s,' + \
                    'lane11=%s,lane12=%s,lane13=%s,lane14=%s,lane15=%s,lane16=%s,lane17=%s,lane18=%s,lane19=%s,lane1A=%s,' + \
                    'lane31=%s,lane32=%s,lane33=%s,lane34=%s,lane35=%s,lane36=%s,lane37=%s,lane38=%s,lane39=%s,lane3A=%s,' + \
                    'lane51=%s,lane52=%s,lane53=%s,lane54=%s,lane55=%s,lane56=%s,lane57=%s,lane58=%s,lane59=%s,lane5A=%s,' + \
                    'lane71=%s,lane72=%s,lane73=%s,lane74=%s,lane75=%s,lane76=%s,lane77=%s,lane78=%s,lane79=%s,lane7A=%s,' + \
                    'stock_desired_steer_angle=%s,stock_lane_center=%s %s\n'

#FrameString = 'rawCANData,pid=%s,bus=%s First32=%di,Second32=%di,sword1=%d,sword2=%d,sword3=%d,sword4=%d %d\n'
canport = 8592 #8006
steerport = 8593
ipaddress = "192.168.43.1"
latport = 8594
steerport2 = 8595
steerport3 = 8596

#ipaddress = "192.168.0.11"
#ipaddress = "192.168.1.33"
context = zmq.Context()
can_socket = context.socket(zmq.SUB)
can_socket.connect ("tcp://%s:%d" % (ipaddress, canport))
can_socket.setsockopt(zmq.SUBSCRIBE, b"")
steer_socket = context.socket(zmq.SUB)
steer_socket.connect ("tcp://%s:%d" % (ipaddress, steerport))
steer_socket.setsockopt(zmq.SUBSCRIBE, b"")
lat_socket = context.socket(zmq.SUB)
lat_socket.connect ("tcp://%s:%d" % (ipaddress, latport))
lat_socket.setsockopt(zmq.SUBSCRIBE, b"")
steer2_socket = context.socket(zmq.SUB)
steer2_socket.connect ("tcp://%s:%d" % (ipaddress, steerport2))
steer2_socket.setsockopt(zmq.SUBSCRIBE, b"")
steer3_socket = context.socket(zmq.SUB)
steer3_socket.connect ("tcp://%s:%d" % (ipaddress, steerport3))
steer3_socket.setsockopt(zmq.SUBSCRIBE, b"")

poller = zmq.Poller()
poller.register(can_socket, zmq.POLLIN)
poller.register(steer_socket, zmq.POLLIN)
poller.register(steer2_socket, zmq.POLLIN)
poller.register(steer3_socket, zmq.POLLIN)
poller.register(lat_socket, zmq.POLLIN)
frame_count = 0

insertTime = int(time.time() * 1000000000)
receiveTime = int(time.time() * 1000000000)

words = [0,0,0,0]
swords = [0,0,0,0]

while 1:
  try:
    socks = dict(poller.poll(5))

  except KeyboardInterrupt:
    can_socket.close()
    steer_socket.close()
    steer2_socket.close()
    lat_socket.close()
    context.term()
    break      

  for sock in socks:
    
    while 1:
      thisData = None
      try:
        thisData = sock.recv(zmq.NOBLOCK)
      except zmq.error.Again:
        thisData = None
        break
      except KeyboardInterrupt:
        can_socket.close()
        steer_socket.close()
        steer2_socket.close()
        lat_socket.close()
        context.term()
        break      

      receiveTime = int(time.time() * 1000000000)

      doRecordCANData = False
      doRecordCANBytes = False
      
      recordBus = ['0','1','2','128','129','130']
      
      #print(thisData)
      if doRecordCANData and thisData is not None and sock is can_socket:
        strData = thisData.split('|')
        for strFrame in strData:
          frame_count += 1  
          strValues = strFrame.split(' ')
          if strValues[0] in recordBus and len(strValues) > 1:
            All64 = int(strValues[2])
            Second32 = All64 & 0xFFFFFFFF
            words[3] = Second32 & 0xFFFF
            words[2] = Second32 >> 16
            First32 = All64 >> 32
            words[1] = First32 & 0xFFFF
            words[0] = First32 >> 16
            for i in range(0, 3):
              swords[i] = words[i]
              if (swords[i] & 0x8000 > 0):
                swords[i] = swords[i] - 0x10000

            influxLineString += (canFrameString % (strValues[1], strValues[0], First32, Second32, words[0], words[1], words[2], words[3], swords[1], swords[2], swords[2], swords[3], receiveTime))

            if doRecordCANBytes:
              hexString = hex(int(strValues[2]))
              byteCount = len(hexString) / 2
              offset = (2 * byteCount) - 2
              for m in range(0, byteCount):
                thisByte = hexString[offset:offset + 2]
                offset -= 2
                if len(thisByte) == 2 and thisByte != "0x":
                  influxLineString += (canByteString % (strValues[1], strValues[0], str(m), int(thisByte, 16), receiveTime))

      if thisData is not None and sock is steer_socket:
        strData = thisData.split('|')
        for strFrame in strData:
          frame_count += 1  
          strValues = strFrame.split(',')
          if len(strValues) > 1:
            influxLineString += (steerFrameString % tuple(strValues))

      if thisData is not None and sock is steer2_socket:
        strData = thisData.split('|')
        for strFrame in strData:
          frame_count += 1  
          strValues = strFrame.split(',')
          if len(strValues) > 1:
            influxLineString += (steer2FrameString % tuple(strValues))

      if thisData is not None and sock is steer3_socket:
        influxLineString += thisData

      if thisData is not None and sock is lat_socket:
        strData = thisData.split('~')
        latControlstring = strData[0]
        strData = strData[1].split('|')
        for strFrame in strData:
          strValues = strFrame.split(',')
          if len(strValues) > 10:
            influxLineString += (latControlstring % tuple(strValues))

  if receiveTime - insertTime >= 200000000 and influxLineString != "":
    insertTime = receiveTime
    frame_count = 0
    print ('%d %d' % (frame_count, len(influxLineString)))
    headers = { 'Content-type': 'application/octet-stream', 'Accept': 'text/plain' }
    influx.request("write",'POST', {'db':DBNAME}, influxLineString.encode('utf-8'), 204, headers)
    influxLineString = ""
