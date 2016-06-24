import zmq_publisher as pub
import time

ip = "127.0.0.1"
port = 5006
list_of_topics = ["A", "B"]

p = pub.Publisher(ip, port, list_of_topics)

# while True:
for i in range(100000):
    print "Sent %d" % i
    p.send_message("B", "msg")
    time.sleep(0.4)
