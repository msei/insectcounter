import unittest
import soundfile as sf
import os
from classifier import classifier
import json
import glob
import re

class TestClassifier(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.cm = classifier.ClassifierModule("../savedfiles", "../model/", False)

    def testWrongPath(self):
        with self.assertRaises(SystemExit):
            self.cm = classifier.ClassifierModule("./IDontExist","../model/", True)

    def testWrongModelPath(self):
        with self.assertRaises(SystemExit):
            self.cm = classifier.ClassifierModule(".","./IDontExist", True)

    def testModelNotInPath(self):
        with self.assertRaises(SystemExit):
            self.cm = classifier.ClassifierModule(".","..", True)

    def testGetMaxLabelValid(self):
        validvec = [0.2,0.5,0.3]
        file_names = glob.glob(self.cm.modelpath + '/species*.json')
        match = re.match(r".*/species(\w+).json", file_names[0])
        with open(file_names[0]) as json_file:
            species_dict = json.load(json_file)

        assert self.cm.get_max_label_with_score(validvec)[0] == species_dict["1"]["name"], "Returned wrong label for valid input"

    def testGetMaxLabelInvalid(self):
        invalidvec = [0.1, 0.1, 0.1, 0.1, 0.6]
        assert self.cm.get_max_label_with_score(invalidvec)[0] == "unknown", "Returned wrong label for invalid input, should be unknown"

    def testClassify(self):
        classification = self.cm.classify("testfile.wav")
        assert not classification == "unknown", "No classification returned for valid sample"

    def testRemoveFromDisk(self):
        testname = "../savedfiles/dummy"

        with open(testname+'.txt', "w") as f:
            f.write("dummy")

        with open(testname+'.json', "w") as f:
            f.write("dummy")

        self.cm.remove_from_disk(testname+".txt")

        assert not os.path.isfile(testname+".txt"), "File was not deleted"
        assert not os.path.isfile(testname+".json"), "Json corresponding to file was not deleted"


    def testRemoveFromDiskInvalidFile(self):
        self.cm.remove_from_disk("dummy")

    def testRemoveFromDiskInvalidFileNameType(self):
        with self.assertRaises(SystemExit):
            self.cm.remove_from_disk(42)

    def testGetAdditionalInfoNoFile(self):
        timestamp = "dummy"
        data = self.cm.get_additional_info(timestamp)
        assert len(data) == 1, "Returned data but no file."

    def testGetAdditionalInfo(self):
        timestamp = "dummy"

        dummydict = dict(otherinfo = "dummy")

        with open("../savedfiles/"+timestamp+".json", "w") as f:
            json.dump(dummydict,f)

        data = self.cm.get_additional_info(timestamp)

        os.remove("../savedfiles/"+timestamp+".json")

        assert data["otherinfo"] == "dummy", "CSV data (other info) not read properly"
        assert "model_id" in data, "CSV data (model id) not read properly"


    @classmethod
    def tearDownClass(cls):
        del cls.cm
