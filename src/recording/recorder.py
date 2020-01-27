import os
import json
import struct
import datetime
import math

import librosa
import board
import busio
import adafruit_bme280
import argparse

import scipy.io as spo
import pyaudio as py
import numpy as np

import sys

SHORT_NORMALIZE = (1.0 / 32768.0)
FORMAT = py.paInt16
CHANNELS = 1


class Recorder:
    """
    Class that records wingbeats of insects.
    """
    # Calculates the Root Mean Square of a signal
    @staticmethod
    def rms(frame):
        """
        Calculates the rms of a frame.

        :param frame: Short buffer of the audio input signal.
        :return: The rms of a frame.
        """
        try:
            count = len(frame) / 2
            format = "%dh" % (count)
            shorts = struct.unpack(format, frame)
            sum_squares = 0.0
            for sample in shorts:
                n = sample * SHORT_NORMALIZE
                sum_squares += n * n
            rms = math.pow(sum_squares / count, 0.5)
            return rms * 1000
        except:
            sys.exit(1)


    def __init__(self, directory, threshold, device, rec_rate, target_rate, samples, buffer_size, address, use_sensor):
        """
        Creates a recorder.

        :param directory: Where to save the audio files to.
        :param threshold: What the threshold for recording audio is.
        :param device: Port of the audio device.
        :param rec_rate: The recording samplespeed.
        :param target_rate: The target samplespeed (downsampling).
        :param samples: How many samples a recording should have.
        :param buffer_size: How large the buffer of the audio stream should be.
        :param address: Address of the BME280 sensor.
        :param use_sensor: Whether to use the BME280 sensor.
        """
        self.py = py.PyAudio()
        self.stream = self.py.open(format=FORMAT,
                                   input_device_index=device,
                                   channels=CHANNELS,
                                   rate=rec_rate,
                                   input=True,
                                   frames_per_buffer=buffer_size)
        self.directory = directory
        self.threshold = threshold
        self.device = device
        self.rec_rate = rec_rate
        self.target_rate = target_rate
        self.buffer_size = buffer_size
        self.samples = samples
        self.frames = math.ceil((rec_rate * samples) / (buffer_size * target_rate))

        # Initializes I2C when required
        if use_sensor:
            i2c = busio.I2C(board.SCL, board.SDA)
            self.sensor = adafruit_bme280.Adafruit_BME280_I2C(i2c, address=address)

    def record(self):
        """
        Records as many frames as needed.

        :return: The recording in byteform.
        """
        print("Noise detected: Recording")
        rec = []
        for _ in range(0, self.frames - 1):
            # exception_on_overflow is needed for PyAudio not to crash, it does not disturb in any way
            data = self.stream.read(self.buffer_size, exception_on_overflow=False)
            rec.append(data)

        rec = b''.join(rec)
        return rec

    def write(self, recording):
        """
        Saves an audio recording as a wavfile and if applicable save additional environment values to a json file.
        :param recording: One audio recording.
        """
        out_file = datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S.000Z")
        filename_wav = os.path.join(self.directory, "{}.wav".format(out_file))
        if hasattr(self, 'sensor'):
            filename_json = os.path.join(self.directory, "{}.json".format(out_file))
            with open(filename_json, mode='w') as json_file:
                data = {}
                data["temp"] = "%0.1f C" % self.sensor.temperature
                data["humidity"] = "%0.1f %%" % self.sensor.humidity
                data["pressure"] = "%0.1f hPa" % self.sensor.pressure
                data["altitude"] = "%0.2f m" % self.sensor.altitude
                json.dump(data, json_file)
        try:
            spo.wavfile.write(filename_wav, self.target_rate, recording[:self.samples])
            print("Return to Listening")
        except:
            sys.exit(1)

    def downsample(self, rec_bytes):
        """
        Downsamples the recorded bytes to the needed rate.
        :param rec_bytes: The recording bytes in the old sample speed.
        :return: The downsampled recording.
        """
        print("Downsample")
        out = struct.unpack_from("%dh" % self.frames * self.buffer_size, rec_bytes)
        mono = np.array(out)
        scaled = mono * SHORT_NORMALIZE
        f_samples = librosa.core.resample(scaled, self.rec_rate, self.target_rate)
        i_samples = (f_samples / SHORT_NORMALIZE).astype(np.int16)
        return i_samples

    def listen(self):
        """
        Permanently listens to the stream and start recording if above a threshold.
        """
        print('Listening beginning')
        while True:
            input = self.stream.read(self.buffer_size, exception_on_overflow=False)
            rms_val = self.rms(input)
            if rms_val > self.threshold:
                recording = self.record()
                audio = self.downsample(input + recording)
                self.write(audio)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("--threshold", default=10, type=int, help="Lowest RMS needed to start recording")
    parser.add_argument("--device", default=0, type=int, help="Audio Device")
    parser.add_argument("--target_rate", default=8000, type=int, help="Samplespeed in Hz of output file")
    parser.add_argument("--rec_rate", default=44100, type=int, help="Samplespeed in Hz of Input")
    parser.add_argument("--samples", default=5000, type=int, help="Amount of Samples saved")
    parser.add_argument("--buffer_size", default=4096, type=int, help="Size of Buffer")
    parser.add_argument("--dir", default=".", type=str, help="Directory of saved Soundfiles")
    parser.add_argument("--address", default=0x76, type=int, help="Adress of BME280")
    parser.add_argument("--use_sensor", default=False, type=bool, help="Determines if sensor should be used or not")
    args = parser.parse_args()

    a = Recorder(args.dir, args.threshold, args.device, args.rec_rate, args.target_rate, args.samples, args.buffer_size,
                 args.address, args.use_sensor)

    a.listen()
