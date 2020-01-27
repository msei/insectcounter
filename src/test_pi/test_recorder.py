import unittest
import soundfile as sf
import os
import numpy as np
import datetime
from recording import recorder

class TestRecorder(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.rec = recorder.Recorder(directory="../savedfiles", threshold=10, device=2, rec_rate=44100,
            target_rate=8000, samples=5000, buffer_size=4096, address=0x76, use_sensor=True)

    def testRecord(self):
        recording = self.rec.record()

    def testWrite(self):
        recording = [0,0,0,0]
        self.rec.write(np.array(recording))

        foundwav = False
        foundjson = False

        # not an optimal way of finding out if files have been written but best
        # I could come up with. looks for csv/wav with timestamp in filename
        # within the same hour
        folder_contents = os.listdir(self.rec.directory)
        filename_start = datetime.datetime.now().strftime("%Y-%m-%dT%H")

        for f in folder_contents:

            if f[0:len(filename_start)] == filename_start:
                if f[-4:] == ".wav":
                    foundwav = True
                    os.remove(os.path.join(self.rec.directory,f))
                elif f[-5:] == ".json":
                    foundjson = True
                    os.remove(os.path.join(self.rec.directory,f))

        assert foundwav == True, "written wav not found"
        assert foundjson == True, "written json not found"

    def testWriteWrongData(self):
        recording = "dummy"
        with self.assertRaises(SystemExit):
            self.rec.write(recording)

    def testRMS(self):
        recording = [0,0,0,0]
        rms = self.rec.rms(bytes(recording))
        assert rms == 0, "RMS returns wrong value. Should be 0."

    def testRMSWrongData(self):
        recording = "dummy"
        with self.assertRaises(SystemExit):
            self.rec.rms(recording)

    @classmethod
    def tearDownClass(cls):
         del cls.rec
