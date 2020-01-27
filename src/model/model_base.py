"""
This module contains a base class for a keras wingbeats model.
"""
import json
import uuid
import os
import sys

import tensorflow as tf

from tensorflow import keras
from . import wingbeats_helper as wb_helper


class Model:
    """
    Class that can construct a keras model for training on wingbeats data.

    Attributes:
        _data_dir (String): directory of the data. the subfolders in the top
            level of this directory will be assumed to correspond to the
            classes(species) and their names that will be learned.
            Subsequently, all subfolders for each species will be crawled
            for samples.
        _export_dir (String): directory for exports
        _cap (int): maximal amount of samples to load per class
        _epochs (int): amount of epochs to train for
        _wb (Wingbeats): Wingbeats instance used as data loader
        _data (np.array): array containing training samples
            (samples along first dimension)
        _labels (np.array): array containing training labels
        _test_data (np.array): array containing test samples
            (samples along first dimension)
        _test_labels (np.array): array containing test labels
        _species_dict (dict): dictionary of species, mapped indices to names
            AND with extra entry indicating model ID
        _model (keras.Sequential): keras model
    """


    def __init__(self,data_dir=".", export_dir=".", cap=None, epochs=3):
        """
        Constructs a (neural network) model object that can load data using
        wingbeats helper class, construct a network, train it and save it
        as tflite export (including a dictionary with classes and network id).

        Args:
            data_dir (String): directory of the data. the subfolders in the top
                level of this directory will be assumed to correspond to the
                classes(species) and their names that will be learned.
                Subsequently, all subfolders for each species will be crawled
                for samples.
            export_dir (String): directory for exports
            cap (int): maximal amount of samples to load per class
            epochs (int): amount of epochs to train.
        """

        # error handling
        try:
            if not os.path.isdir(data_dir):
                print("\nData directory \"" + str(data_dir) + "\" not found. Please try again with a valid directory path.")
                sys.exit(2)
            else:
                self._data_dir = data_dir
        except TypeError:
            print("\nData directory given with invalid data type.")
            sys.exit(2)


        try:
            if not os.path.isdir(export_dir):
                print("\nExport directory \"" + str(export_dir) + "\" not found. Using current working directory.")
                self._export_dir = "."
            else:
                self._export_dir = export_dir
        except TypeError:
            print("\nExport directory given with invalid data type. Using current working directory.")
            self._export_dir = "."

        try:
            self._epochs = int(epochs)
        except ValueError:
            print("\nValue for epoch number could not be parsed")
            sys.exit(2)

        if self._epochs < 1:
            print("\nInvalid value for epoch number. Please train for at least 1 epoch.")
            sys.exit(2)

        self._cap = None
        if cap:
            try:
                self._cap = int(cap)
            except ValueError:
                print("\nInvalid value for maximum sample number (cap).")
                sys.exit(2)

        if self._cap < 0:
            print("\nInvalid value for maximum sample number (cap). Please set a non-negative cap.")
            sys.exit(2)

        self._id = str(uuid.uuid1())


    def load_data(self):
        """
        Creates Wingbeats objects, uses it to get data and saves the species
        (class) dictionary including a uuid for the model in the export folder.
        Deletes Wingbeats instance afterwards.
        """
        print("Opening Wingbeats from: " + self._data_dir)

        wb = wb_helper.Wingbeats(self._data_dir, self._cap)
        self._data = wb.get_training_data()
        self._labels = wb.get_training_labels()
        self._test_data = wb.get_test_data()
        self._test_labels = wb.get_test_labels()

        self._species_dict = wb.get_species_dict()
        self._species_dict["model_id"] = self._id

        with open(os.path.join(self._export_dir,"species_"+self._id+".json"),'w') as f:
            json.dump(self._species_dict,f)

        del wb


    def build_model(self):
        """
        Builds a simple dummy keras model in _model variable and compiles it.
        """

        # don't use this model but Conv1D, it's really just a dummy
        self._model = keras.Sequential()
        self._model.add(keras.layers.Conv1D(16, kernel_size=3, strides=1, padding='same',
                                            input_shape=(5000,1), activation='relu'))
        self._model.add(keras.layers.Flatten())

        try:
            self._model.add(keras.layers.Dense(len(self._species_dict) - 1, activation='softmax'))
        except AttributeError:
            print("No species dictionary found. Please load data before building the model.")
            sys.exit(2)

        self._model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])


    def train_model(self):
        """
        Trains the model for as many epochs as given on instantiation of this
        model object. Uses 10 percent of training data as validation and batches
        of size 50.

        Then passes test data in batches of 50 through the model and gives
        corresponding output and averaged loss and accuracy over test data.
        """

        # error handling for cases in which functions were called in
        # invalid order
        try:
            self._model
        except AttributeError:
            print("\nNo model found. Please build the model before training.")
            sys.exit(2)

        try:
            self._data
            self._labels
            self._test_data
            self._test_labels
        except AttributeError:
            print("\nNo training/test data found. Please load data before training.")
            sys.exit(2)

        # try to fit model with given data
        try:
            l_categorical = keras.utils.to_categorical(self._labels)
            self._model.fit(self._data, l_categorical, batch_size=50, epochs=self._epochs, validation_split=0.1)
        except ValueError:
            print("\nError during training. Maybe you used invalid or insufficient amounts of training data/labels?")
            sys.exit(2)

        # try to test model with given data
        try:
            t_l_categorical = keras.utils.to_categorical(self._test_labels)
            _, testacc = self._model.evaluate(self._test_data, t_l_categorical, batch_size=50,verbose=0)
        except ValueError:
            print("\nError during evaluation. Maybe you used invalid or insufficient amounts of test data/labels?")
            sys.exit(2)

        print("Test accuracy: ", str(testacc))


    def export_model(self):
        """
        Saves the model in the given export folder.
        """

        try:
            converter = tf.lite.TFLiteConverter.from_keras_model(self._model)
            tflite_model = converter.convert()
        except AttributeError:
            print("\nPlease build the model before training.")
            sys.exit(2)

        with open(os.path.join(self._export_dir,"export_"+self._id+".tflite"), "wb") as f:
            f.write(tflite_model)
