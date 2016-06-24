import zmq_subscriber as sub
import time
import zmq

def print_msg(topic, msg):
    print topic, msg

ip = "127.0.0.1"
port = 5000
list_of_topics = ["A", "B"]
topic_to_callback_map = dict([("A", print_msg)])

s = sub.Subscriber(ip, port, list_of_topics, topic_to_callback_map)

for i in range(300):
    print "Recieved %d" % i
    s.recv_message("B")


all_msg = s.get_messages("B")
print all_msg
