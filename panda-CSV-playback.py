#!/usr/bin/env python
import sys
import time
import csv
import libusb
from panda import Panda

SAFETY_ALLOUTPUT = 0x1337

csv_file_in = open(sys.argv[1], mode='r')
csv_reader = csv.reader(csv_file_in)

p = Panda()
p.set_safety_mode(SAFETY_ALLOUTPUT)

startTime = time.time()
out_cans = []
rownumber = -1
sleepTime = 0.0
skipped = 0
bus = 0
for row in csv_reader:
  (timestamp, address, bus, data) = row
  if rownumber >= 0 and int(bus) in (0,): 
    if out_cans != [] and sleepTime > 0:
      p.can_send_many(out_cans)
      print("total %d  skipped %d  sent %d  " % (rownumber, skipped, len(out_cans))) 
      out_cans = [] 
    sleepTime = startTime + float(timestamp) - time.time()
    if sleepTime > 0: time.sleep(sleepTime)
    out_cans += [[int(address), None, str(data).decode("hex"), int(bus)]]  
  else:
    skipped += 1
  rownumber += 1      
