import os
import unittest
from model import conv1d


class TestConv1d(unittest.TestCase):

    def setUp(self):
        self.samples = 200
        self.model =  conv1d.Conv1D("../../Wingbeats", ".", self.samples, 1)
        self.model.load_data()

    def testModel(self):
        self.model.build_model()

    def tearDown(self):
        speciesfile = os.path.join(".","species_"+self.model._id+".json")
        assert os.path.isfile(speciesfile), "Error creating the species file"
        assert len(self.model._test_labels) == len(os.listdir(self.model._data_dir)) * self.samples // 10, "Error loading data"
        os.remove(speciesfile)
