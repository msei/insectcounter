import unittest
from model import model_base
import os


class TestModel(unittest.TestCase):

    def setUp(self):
        self.samples = 200
        self.model = model_base.Model("../../Wingbeats", ".", self.samples, 1)

    def testInvalidDataDirModel(self):
        with self.assertRaises(SystemExit):
            model_base.Model(123, ".", self.samples, 1)

    def testInvalidDataDirExport(self):
        model = model_base.Model("../../Wingbeats", 123, self.samples, 1)
        assert model._export_dir == ".", "Invalid default Data dir set"

    def testInvalidCap(self):
        with self.assertRaises(SystemExit):
            model_base.Model("../../Wingbeats", ".", "abc", 1)

    def testInvalidEpoch(self):
        with self.assertRaises(SystemExit):
            model = model_base.Model("../../Wingbeats", ".", self.samples, "abc")

    def testLoadData(self):
        self.model.load_data()
        speciesfile = os.path.join(".","species_"+self.model._id+".json")
        assert os.path.isfile(speciesfile), "Error creating the species file"
        assert len(self.model._test_labels) == len(os.listdir(self.model._data_dir)) * self.samples // 10, "Error loading data"
        os.remove(speciesfile)

    def testBuildModel(self):
        self.model.load_data()
        self.model.build_model()
        speciesfile = os.path.join(".","species_"+self.model._id+".json")
        assert os.path.isfile(speciesfile), "Error creating the species file"
        assert len(self.model._test_labels) == len(os.listdir(self.model._data_dir)) * self.samples // 10, "Error loading data"
        os.remove(speciesfile)

    def testTrainModelInvalid(self):
        # not calling load_data
        with self.assertRaises(SystemExit):
            self.model.train_model()

    def testTrainModelInvalid2(self):
        self.model.load_data()
        speciesfile = os.path.join(".","species_"+self.model._id+".json")
        assert os.path.isfile(speciesfile), "Error creating the species file"
        assert len(self.model._test_labels) == len(os.listdir(self.model._data_dir)) * self.samples // 10, "Error loading data"
        os.remove(speciesfile)
        # not calling build_model
        with self.assertRaises(SystemExit):
            self.model.train_model()

    def testTrainModel(self):
        self.model.load_data()
        self.model.build_model()
        self.model.train_model()
        speciesfile = os.path.join(".","species_"+self.model._id+".json")
        assert os.path.isfile(speciesfile), "Error creating the species file"
        assert len(self.model._test_labels) == len(os.listdir(self.model._data_dir)) * self.samples // 10, "Error loading data"
        os.remove(speciesfile)

    def testExportModelInvalid(self):
        with self.assertRaises(SystemExit):
            self.model.export_model()

    def testExportModel(self):
        self.model.load_data()
        self.model.build_model()
        self.model.export_model()

        exportfile = os.path.join(".","export_"+self.model._id+".tflite")
        assert os.path.isfile(exportfile), "Error creating the export file"
        os.remove(exportfile)
        speciesfile = os.path.join(".","species_"+self.model._id+".json")
        assert os.path.isfile(speciesfile), "Error creating the species file"
        assert len(self.model._test_labels) == len(os.listdir(self.model._data_dir)) * self.samples // 10, "Error loading data"
        os.remove(speciesfile)
