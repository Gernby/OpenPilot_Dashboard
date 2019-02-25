#!/usr/bin/env python
import sys
import binascii
import time
import csv
import libusb
from panda import Panda

SAFETY_ALLOUTPUT = 0x1337

csv_file_in = open(sys.argv[1], mode='r')
csv_reader = csv.reader(csv_file_in)

p = Panda()
p.set_safety_mode(SAFETY_ALLOUTPUT)

out_cans = []
rownumber = -1
skipped = 0

#fingerprint = {148: 8, 228: 5, 304: 8, 330: 8, 344: 8, 380: 8, 399: 7, 419: 8, 420: 8, 427: 3, 432: 7, 441: 5, 446: 3, 450: 8, 464: 8, 477: 8, 479: 8, 495: 8, 545: 6, 662: 4, 773: 7, 777: 8, 780: 8, 804: 8, 806: 8, 808: 8, 829: 5, 862: 8, 884: 8, 891: 8, 927: 8, 929: 8, 1302: 8, 1600: 5, 1601: 8, 1652: 8}
fingerprint = {228: 5, 399: 7, 427: 3, 432: 7, 441: 5, 446: 3, 545: 6, 662: 4, 773: 7, 829: 5, 1600: 5}

while(p.health()['started'] == 0 and p.health()['started_alt'] == 0):
  print(p.health())
  time.sleep(1)

startTime = time.time()
nextSendTime = startTime
for row in csv_reader:
  try:
    (timestamp, address, bus, data) = row
  except:
    pass

  try:
    if rownumber >= 0 and float(timestamp) > 1.0 and int(bus) in (0,): #1,2,128,129,130): 
      if fingerprint.has_key(int(address)):
        datBytes = fingerprint[int(address)]
      else:
        datBytes = 8
      if int(bus) > 127:
        bus = int(bus) - 128
      if (len(out_cans) > 5 and sleepTime > 0) or len(out_cans) > 20:
        p.can_send_many(out_cans)
        print("total %d  skipped %d  sent %d  lag %f" % (rownumber, skipped, len(out_cans), out_cans[len(out_cans) - 1][1] - out_cans[0][1])) 
        out_cans = [] 
        sleepTime = startTime + float(timestamp) - time.time()
        if sleepTime > 0: 
          #print(sleepTime)
          time.sleep(sleepTime)
      sleepTime = startTime + float(timestamp) - time.time()
      out_cans.append([int(address), float(timestamp), str(data).decode("hex")[:datBytes], int(bus)])
      lastTimestamp = timestamp
    else:
      skipped += 1
    rownumber += 1    
  except KeyboardInterrupt:
    break  
