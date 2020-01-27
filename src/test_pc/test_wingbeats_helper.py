import unittest
import os
from model import wingbeats_helper


class TestWingbeatsHelper(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Create a Wingbeats Dataset instance
        cls.samples = 200
        cls.wb = wingbeats_helper.Wingbeats("../../Wingbeats/", cls.samples)

    def testGetSpeciesDict(self):
        assert len(self.wb.get_species_dict()) == len(os.listdir(self.wb._dir)), "Incorrect number of classes"

    def testGetTestData(self):
        # Correct length of test data
        assert len(self.wb.get_test_data()) == len(os.listdir(self.wb._dir)) * self.samples//10, "incorrect amount of test data loaded"

    def testGetTestLabels(self):
        # Correct length of training data
        assert len(self.wb.get_test_labels()) == len(os.listdir(self.wb._dir)) * self.samples//10, "incorrect amount of test data loaded"

    def testGetTrainingData(self):
        # Correct length of training data
        assert len(self.wb.get_training_data()) == len(os.listdir(self.wb._dir)) * ((self.samples//10)*9), "incorrect amount of test data loaded"

    def testGetTrainingLabels(self):
        # Correct length of training labels
        assert len(self.wb.get_training_labels()) == len(os.listdir(self.wb._dir)) * ((self.samples//10)*9), "incorrect amount of test data loaded"

    def testInvalidDataDir(self):
        with self.assertRaises(SystemExit):
            wb = wingbeats_helper.Wingbeats(123, self.samples)

    def testInvalidCap(self):
        with self.assertRaises(SystemExit):
            wb = wingbeats_helper.Wingbeats("../../Wingbeats/", "shhf")
