#!/usr/bin/env python
import csv
import zmq
import time
import numpy as np
import selfdrive.messaging as messaging
from selfdrive.services import service_list
from common.realtime import set_realtime_priority, Ratekeeper
import os, os.path

# Polling rate should be twice the data rate to prevent aliasing
def main(rate=200):
  set_realtime_priority(3)
  context = zmq.Context()
  poller = zmq.Poller()

  live100 = messaging.sub_sock(context, service_list['live100'].port, conflate=True, poller=poller)

  vEgo = 0.0
  _live100 = None

  frame_count = 0
  skipped_count = 0

  rk = Ratekeeper(rate, print_delay_threshold=np.inf)

  # simple version for working with CWD
  #print len([name for name in os.listdir('.') if os.path.isfile(name)])

  # path joining version for other paths
  DIR = '/sdcard/tuning'
  filenumber = len([name for name in os.listdir(DIR) if os.path.isfile(os.path.join(DIR, name))])

  print("start")
  with open(DIR + '/dashboard_file_%d.csv' % filenumber, mode='w') as dash_file:
    print("opened")
    dash_writer = csv.writer(dash_file, delimiter=',', quotechar='', quoting=csv.QUOTE_NONE)
    print("initialized")
    dash_writer.writerow(['angleSteersDes','angleSteers','vEgo','steerOverride','upSteer','uiSteer','ufSteer','time'])
    print("first row")

    while 1:
      receiveTime = int(time.time() * 1000)
      for socket, event in poller.poll(0):
        if socket is live100:
          _live100 = messaging.recv_one(socket)
          vEgo = _live100.live100.vEgo
          if vEgo >= 0:
            frame_count += 1
            dash_writer.writerow([str(round(_live100.live100.angleSteersDes, 2)),
                                  str(round(_live100.live100.angleSteers, 2)),
                                  str(round(_live100.live100.vEgo, 1)),
                                  1 if _live100.live100.steerOverride else 0,
                                  str(round(_live100.live100.upSteer, 4)),
                                  str(round(_live100.live100.uiSteer, 4)),
                                  str(round(_live100.live100.ufSteer, 4)),
                                  str(receiveTime)])
          else:
            skipped_count += 1
        else:
          skipped_count += 1
      if frame_count % 200 == 0:
        print("captured = %d" % frame_count)
        frame_count += 1
      if skipped_count % 200 == 0:
        print("skipped = %d" % skipped_count)
        skipped_count += 1

      rk.keep_time()

if __name__ == "__main__":
  main()
