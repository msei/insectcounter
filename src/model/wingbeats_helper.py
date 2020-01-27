"""
This module contains a helper class for loading wingbeats data.

Possible future improvements:
    * add possibility to load slice of data found in directory in order to
    enable for training with all data sequentially.
    * find useful data augmentation method
"""
import os
import sys

import soundfile as sf
import numpy as np


class Wingbeats():
    """
    Helper class that can load and return wingbeats data.

    Attributes:
        _dir (String): directory of the data. the subfolders in the top level
            of this directory will be assumed to correspond to the classes
            (species) and their names that will be learned. Subsequently,
            all subfolders for each species will be crawled for samples.
        _species_dict (dict): dictionary of species, mapped indices to names.
        _training_data (np.array): array containing training samples
            (samples along first dimension)
        _training_labels (np.array): array containing training labels
        _test_data (np.array): array containing test samples
            (samples along first dimension)
        _test_labels (np.array): array containing test labels
        _augm (bool): whether data augmentation is used or not.
        _cap (int): maximal amount of samples to load per class. None if no
            restriction.
    """


    def __init__(self, dir="./", cap=None):
        """
        Constructs a Wingbeats objects that contains all the soundfile data
        found in a given directory and its subdirectories.

        Args:
            dir (String): directory of the data. the subfolders in the top level
                of this directory will be assumed to correspond to the classes
                (species) and their names that will be learned. Subsequently,
                all subfolders for each species will be crawled for samples.
            cap (int): maximal amount of samples to load per class
        """

        try:
            if not os.path.isdir(dir):
                print("\nData directory \"" + str(dir) + "\" not found.  Please try again with a valid directory path.")
                sys.exit(2)
            else:
                self._dir = dir
        except TypeError:
            print("\nData directory given with invalid data type.")
            sys.exit(2)

        self._cap = None
        if cap:
            try:
                self._cap = int(cap)
            except Exception as e:
                print(e)
                print("\nInvalid value for maximum sample number (cap)")
                sys.exit(2)

        if self._cap < 0:
            print("\nInvalid value for maximum sample number (cap). Please set a non-negative cap.")
            sys.exit(2)

        self._species_dict = dict()
        self._training_data = []
        self._training_labels = []

        self._load_data()


    def _load_data(self):
        """
        Loads the data in the given directory, randomly selects a training
        dataset and test dataset (10 percent) including labels. Able to use
        data augmentation.
        Dataset and labels are saved in separate numpy arrays.
        """

        print("\nDebug: Loading data. This may take a couple of minutes.")
        count = 0

        for si, species in enumerate(os.listdir(self._dir)):
            print("Species: " + species + ", index " + str(si))

            self._species_dict[si] = {"name": species}

            species_dir = os.walk(os.path.join(self._dir, species))

            i = 0
            for root, _, files in species_dir:
                for f in files:
                    if f.endswith('.wav'):
                        try:
                            data, samplerate = sf.read(os.path.join(root, f))
                        except RuntimeError:
                            print("Could not read .wav file: " + os.path.join(root, f))
                            sys.exit(2)

                        # list function shows much more performance than np concatenate
                        self._training_data.append(data)
                        self._training_labels.append(si)
                        i += 1
                        if self._cap and i == self._cap:
                            break
                if self._cap and i == self._cap:
                    break

            print("Done. Added " + str(len(self._training_data) - count) + " examples.")
            count = len(self._training_data)

        self._training_data = np.array(self._training_data)
        self._training_labels = np.array(self._training_labels)

        sample_length = self._training_data[0].shape[0]

        try:
            self._training_data = np.reshape(self._training_data, [-1, sample_length, 1])
        except ValueError:
            print("Error during reshaping of data. Maybe you have a .wav file in your directory that does not fit Wingbeats format?")
            sys.exit(2)

        self._training_labels = np.reshape(self._training_labels, [-1, 1])
        print("Converted data to np arrays")

        samples_n = self._training_data.shape[0]
        random_indices = np.random.choice(samples_n, samples_n // 10, replace=False)

        self._test_data = self._training_data[random_indices]
        self._test_labels = self._training_labels[random_indices]
        self._training_data = np.delete(self._training_data, random_indices, axis=0)
        self._training_labels = np.delete(self._training_labels, random_indices, axis=0)
        print("Split up into training and test data.")


    def get_species_dict(self):
        """
        Returns dictionary of species (classes).

        Returns:
            _species_dict (dict): dictionary of species, mapped indices to names.
        """
        return self._species_dict


    def get_training_data(self):
        """
        Returns training data.

        Returns:
            _training_data (np.array): array containing training samples
                (samples along first dimension)
        """
        return self._training_data


    def get_training_labels(self):
        """
        Returns training labels.

        Returns:
            _training_labels (np.array): array containing training labels
        """
        return self._training_labels


    def get_test_data(self):
        """
        Returns test data.

        Returns:
            _test_data (np.array): array containing test samples
                (samples along first dimension)
        """
        return self._test_data


    def get_test_labels(self):
        """
        Returns test labels.

        Returns:
            _test_labels (np.array): array containing test labels
        """
        return self._test_labels
