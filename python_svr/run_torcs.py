import subprocess
import csv
import datetime
import sys
import json
import zmq_publisher as pub
import time
from pprint import pprint


ELECTRON = False  # Show electron frontend
ELECTRON_PATH = "/vagrant/UW-infotainment-dev/Car_Simulator/dashboard/"

LOG = True
LOG_PATH = '/vagrant/logs/'


class Electron:
    def __init__(self):
        self.proc = None

    def run(self, path):
        print "Starting electron..."
        cmd = "cd %s && npm start" % path
        self.proc = subprocess.Popen(cmd, shell=True)

    def kill(self, wait=0):
        time.sleep(wait)
        print "Killing electron in %d seconds..." % wait
        subprocess.Popen("TASKKILL /F /PID {pid} /T".format(pid=self.proc.pid))


def date_str(time):
    return datetime.datetime.fromtimestamp(int(time)).strftime('[%Y-%m-%d_%H-%M-%S]')


# Saves scores to csv file
def save_log(log, csv_file):
    print 'Saving log : ' + csv_file
    header = ["Speed", "Yaw", "RPM", "Gear", "Fuel"]
    with open(csv_file, 'wb') as csvfile:
        writer = csv.writer(csvfile, quoting=csv.QUOTE_MINIMAL)
        writer.writerow(header)
        for data in log:
            writer.writerow(data)


def main():
    if len(sys.argv) == 1:  # no args
        cmd = "torcs"
        label = 'human_'
    elif sys.argv[1] == 'quiet':
        cmd = ["torcs", "-r", "quickrace.xml"]
        label = 'bot_'
        # start the pyclient
        runserver = ["python", "/vagrant/python_svr/pyclient.py"]
        subprocess.Popen(runserver, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    elif sys.argv[1] == 'bot':
        cmd = "torcs"
        label = 'bot_'
        # start the pyclient
        runserver = ["python", "/vagrant/python_svr/pyclient.py"]
        subprocess.Popen(runserver, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)

    # Run command
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)

    # Run Electron Frontend
    if ELECTRON:
        electron = Electron()
        electron.run(ELECTRON_PATH)
    # ZMQ setup
    ip = "127.0.0.1"
    port = 5006
    list_of_topics = ['Simulator']
    ZMQp = pub.Publisher(ip, port, list_of_topics)


    log = []
    line_num = 0
    for line in iter(p.stdout.readline, b''):
        if "Speed : " in line and line_num % 3 == 0:  # take every 3 frames
            pyout = {}
            log_list = []
            splitline = line.splitlines()[0].split('\t')

            for info in splitline:
                nameValue = info.split(': ')
                if len(nameValue) == 2:
                    value = nameValue[1].strip()
                    pyout[nameValue[0]] = value
                    log_list.append(value)
            jsonout = json.dumps(pyout)
            if LOG:
                # print log_list
                log.append(log_list)

            pprint(jsonout)  # print JSON
            ZMQp.send_message('Simulator', jsonout)

        line_num += 1

    if LOG:
        start_time = date_str(time.time())  # unique for file names
        sim_csv = LOG_PATH + 'simulator_' + label + start_time + '.csv'
        save_log(log, sim_csv)

if __name__ == "__main__":
    main()
