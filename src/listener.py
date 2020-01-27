#! /usr/bin/env python3
"""
This is the main pi module. Only works on a raspberry pi (4).

usage: python3 listener.py [-h] [--dirpath DIRPATH] [--modelpath MODELPATH]
                   [--tokenfile TOKENFILE] [--permanent PERMANENT]
                   [--server_url SERVER_URL] [--threshold THRESHOLD]
                   [--device DEVICE] [--target_rate TARGET_RATE]
                   [--rec_rate REC_RATE] [--samples SAMPLES]
                   [--buffer_size BUFFER_SIZE] [--address ADDRESS]
                   [--use_sensor USE_SENSOR]

optional arguments:
  -h, --help            show this help message and exit
  --dirpath DIRPATH     Verzeichnis in dem die Dateien abgespeichert
                        werden.(Wird nur benutzt wenn die permanent FLAG
                        gesetzt ist, ansonsten wird auf eine RAM-DISK
                        geschrieben und die Dateien nach dem Absenden
                        gelöscht.
  --modelpath MODELPATH
                        Pfad an dem das Modell und die zugehörige JSON
                        abgespeichert ist.
  --tokenfile TOKENFILE
                        Name des Tokenfiles des Sensors.
  --permanent PERMANENT
                        Gibt an ob die Daten permanent gespeichert werden oder
                        nach dem Senden gelöscht werden.
  --server_url SERVER_URL
                        URL des InsectCounter Projekts, e.g.
                        https://insectcounter.zapto.org oder
                        http://localhost:3000 wenn der Server lokal läuft
  --threshold THRESHOLD
                        Kleinster RMS um die Aufnahme zu starten.
  --device DEVICE       Port des Audio Devices.
  --target_rate TARGET_RATE
                        Samplespeed in Hz des Ausgabe Files.
  --rec_rate REC_RATE   Samplespeed in Hz der eingehenden Aufname.
  --samples SAMPLES     Anzahl an Samples in einer Aufnahme.
  --buffer_size BUFFER_SIZE
                        Größe des Buffer.
  --address ADDRESS     Adresse des BME280.
  --use_sensor USE_SENSOR
                        Gibt an ob der BME280 Sensor benutzt werden soll.

"""

import os
import argparse

from multiprocessing import Process
from watchdog.events import PatternMatchingEventHandler
from watchdog.observers import Observer

from classifier.network import NetworkModule
from classifier.classifier import ClassifierModule
from recording.recorder import Recorder


def str2bool(v):
    if isinstance(v, bool):
       return v
    if v.lower() in ('yes', 'true', 't', 'y', '1'):
        return True
    elif v.lower() in ('no', 'false', 'f', 'n', '0'):
        return False
    else:
        raise argparse.ArgumentTypeError('Boolean value expected.')


class Listener(PatternMatchingEventHandler):
    """
    Class that can react to new files being generated in the file system.
    """

    def __init__(self, args, patterns=None, ignore_patterns=None,
                 ignore_directories=False, case_sensitive=False):
        """
        Constructs a listener that reacts to new wav files being created.
        :param args: An argparse object containing the relevant paths.
        """
        super().__init__(patterns=["*.wav"], ignore_patterns=None, ignore_directories=False, case_sensitive=False)
        # Create the classifier module
        self.clf = ClassifierModule(args.dirpath, args.modelpath, args.permanent)
        # Create the network module
        self.nw = NetworkModule(args.dirpath, args.tokenfile, args.server_url)

    def process(self, event):
        """
        Process the newly generated wav file by sending it through the classifier and the result to the server.
        :param event: Name of the newly generated wav file.
        """
        if self.clf and self.nw:
            timestamp = os.path.splitext(os.path.basename(event.src_path))[0]
            additional_info = self.clf.get_additional_info(timestamp)
            label, score = self.clf.classify(event.src_path)
            self.nw.send_http(label, timestamp, additional_info, score)
            self.clf.remove_from_disk(os.path.normpath(event.src_path))

    def on_created(self, event):
        """
        Reacts on newly created files.
        :param event: Information about a new file given by the OS.
        """
        self.process(event)


def main(args):
    """
    Creates the recorder to capture wingbeats data and creates an observer to react to new files being created.
    :param args: An argparse object containing all relevant arguments.
    """
    if not args.permanent:
        args.dirpath = "/mnt/ramdisk"

    # Create a listener
    listener = Listener(args)

    # Create an observer looking for new wav files in the given directory.
    observer = Observer()
    observer.schedule(listener, args.dirpath)
    observer.start()

    # Creates the recorder to capture wingbeats data from the microphone.
    recorder = Recorder(args.dirpath, args.threshold, args.device, args.rec_rate, args.target_rate, args.samples,
                        args.buffer_size, args.address, args.use_sensor)

    p = Process(target=recorder.listen)
    p.start()
    p.join()
    observer.join()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dirpath", default="../savedfiles", type=str,
                        help="Verzeichnis in dem die Dateien abgespeichert werden."
                             "(Wird nur benutzt wenn die permanent FLAG gesetzt ist, "
                             "ansonsten wird auf eine RAM-DISK geschrieben und die Dateien nach dem Absenden gelöscht.")
    parser.add_argument("--modelpath", default="../model", type=str,
                        help="Pfad an dem das Modell und die zugehörige JSON abgespeichert ist.")
    parser.add_argument("--tokenfile", default="../model/token.json", type=str,
                        help="Name des Tokenfiles des Sensors.")
    parser.add_argument("--permanent", default=False, type=str2bool,
                        help="Gibt an ob die Daten permanent gespeichert werden oder nach dem Senden gelöscht werden.")
    parser.add_argument("--server_url", default="http://192.168.2.104:3000", type=str,
                        help="URL des InsectCounter Projekts, e.g. https://insectcounter.zapto.org oder "
                             "http://localhost:3000 wenn der Server lokal läuft")

    parser.add_argument("--threshold", default=10, type=int, help="Kleinster RMS um die Aufnahme zu starten.")
    parser.add_argument("--device", default=2, type=int, help="Port des Audio Devices.")
    parser.add_argument("--target_rate", default=8000, type=int, help="Samplespeed in Hz des Ausgabe Files.")
    parser.add_argument("--rec_rate", default=44100, type=int, help="Samplespeed in Hz der eingehenden Aufname.")
    parser.add_argument("--samples", default=5000, type=int, help="Anzahl an Samples in einer Aufnahme.")
    parser.add_argument("--buffer_size", default=4096, type=int, help="Größe des Buffer.")
    parser.add_argument("--address", default=0x76, type=int, help="Adresse des BME280.")
    parser.add_argument("--use_sensor", default=False, type=str2bool,
                        help="Gibt an ob der BME280 Sensor benutzt werden soll.")

    args = parser.parse_args()
    main(args)
