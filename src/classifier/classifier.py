import os
import sys
import json
import glob
import re

import soundfile as sf
import numpy as np

from json import JSONDecodeError

try:
    import tflite_runtime.interpreter as tf
except ImportError:
    import tensorflow as tf


class ClassifierModule:
    """
    Class responsible for the classification of wingbeats recordings.
    """
    def __init__(self, dirpath, modelpath, permanent):
        """
        Constructs a classifier.

        :param dirpath: Path to the audiofiles.
        :param modelpath: Path to the .tflite model export.
        :param permanent: Whether the audio files should be permanent or not.
        (If not permanent they get deleted after classification)
        """
        # Checks the dirpath.
        if not os.path.isdir(dirpath):
            sys.exit("Der angegebene Pfad für die Dateien existiert nicht oder ist ungültig.")
        self.dirpath = dirpath
        # Checks the modelpath.
        if not os.path.isdir(modelpath):
            sys.exit("Der angegebene Pfad für das Model ist ungültig oder existiert nicht.")
        self.modelpath = modelpath

        self.permanent = permanent
        self.dict = {}
        self.model_id = ""
        self.export_id = ""
        self.read_labels()

        # Tries to load the tflite file.
        export_path = glob.glob(modelpath + "/export*.tflite")
        if not len(export_path) == 1:
            sys.exit("Mehr als ein oder kein tflite Export gefunden.")

        match = re.match(r".*/export_(.*?)\.tflite", export_path[0])
        if not match.group(1) == self.export_id:
             sys.exit("Species json und export passen nicht zusammen.")

        # Load TFLite model and allocate tensors.
        try:
            self.model = tf.Interpreter(model_path=export_path[0])
        except AttributeError:
            self.model = tf.lite.Interpreter(model_path=export_path[0])

        self.model.allocate_tensors()

        # Get input and output tensors.
        self.input_details = self.model.get_input_details()
        self.output_details = self.model.get_output_details()

        # Print an error if the tflite file could not be loaded.
        if not self.model:
            sys.exit("Es wurde kein Model gefunden.")

    def get_max_label_with_score(self, vector):
        """
        Returns the maximum label along with the model confidence score.
        :param vector: A vector containing confidences for the different possible classes.
        :return: The maximum label and the confidence score, if there was a problem returns "unknown", 0
        """
        biggest_index = np.argmax(vector)
        try:
            label, score = self.dict[str(biggest_index)], str(np.max(vector))
        except KeyError:
            return "unknown", 0
        return label['name'], score

    def classify(self, file_name):
        """
        Classifies an audiofile.
        :param file_name: The filename of a .wav wingbeats recording.
        :return: The class with the highest confidence + the confidence-
        """
        data, samplerate = sf.read(file_name)
        data = np.reshape(data, (-1, 5000, 1)).astype(np.float32)
        self.model.set_tensor(self.input_details[0]['index'], data)
        self.model.invoke()
        output = self.model.get_tensor(self.output_details[0]['index'])
        return self.get_max_label_with_score(output[0])

    def remove_from_disk(self, file_name):
        """
        Removes the file from the disk if the classifier is not permanent.
        :param file_name: Name of the file to be deleted
        """
        if type(file_name) != str:
            sys.exit("Der angegebene Filename ist ungültig.")
        print(file_name)
        # Delete the file(s) if they should be non permanent-
        if not self.permanent:
            try:
                os.remove(file_name)
                os.remove(os.path.splitext(file_name)[0] + ".json")
            # Do nothing if the files do not exist.
            except FileNotFoundError:
                pass

    def read_labels(self):
        """
        Reads the labels from a json file.
        """
        try:
            file_names = glob.glob(self.modelpath + '/species*.json')
            if len(file_names) == 0:
                raise FileNotFoundError
            if len(file_names) > 1:
                sys.exit("Mehr als ein species.json gefunden.")
            match = re.match(r".*/species_(.*?)\.json", file_names[0])
            self.export_id = match.group(1)
            with open(file_names[0]) as json_file:
                self.dict = json.load(json_file)
                self.model_id = self.dict["model_id"]
        except FileNotFoundError as f:
            print(f)
            sys.exit("Es wurde kein valides species.json gefunden.")
        except JSONDecodeError as j:
            print(j)
            sys.exit("Das angegebene species.json ist ungültig.")

    def get_additional_info(self, timestamp):
        """
        Tries to read a json file with additional information for the classification event (e.g. temperature).

        :param timestamp: The timestamp of the event.
        :return: The additional data found for the timestamp.
        """
        datfile = os.path.join(self.dirpath, timestamp + ".json")
        if os.path.isfile(datfile):
            with open(datfile, "r") as file:
                data = json.load(file)
                data["model_id"] = self.model_id
            return data
        else:
            print("No data")
            return dict(model_id=self.model_id)
