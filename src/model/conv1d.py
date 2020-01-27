"""
This module contains a convolutional network class for a keras
wingbeats model.
"""

from . import model_base
from tensorflow import keras


class Conv1D(model_base.Model):
    """
    Class that inherits from model base class and constructs the keras model
    as a Conv1D model similar to the one given on kaggle.

    Attributes:
        See model base class.
    """

    def build_model(self):
        """
        Builds a multi-layer convolutional keras model and compiles it.
        """

        self._model = keras.Sequential()
        self._model.add(keras.layers.BatchNormalization())

        self._model.add(keras.layers.Conv1D(16, kernel_size=3, strides=1, padding='same', input_shape=(5000,1)))
        self._model.add(keras.layers.BatchNormalization())
        self._model.add(keras.layers.Activation('relu'))
        self._model.add(keras.layers.MaxPool1D(pool_size=2,strides=2))

        self._model.add(keras.layers.Conv1D(32, kernel_size=3, strides=1, padding='same'))
        self._model.add(keras.layers.BatchNormalization())
        self._model.add(keras.layers.Activation('relu'))
        self._model.add(keras.layers.MaxPool1D(pool_size=2,strides=2))

        self._model.add(keras.layers.Conv1D(64, kernel_size=3, strides=1, padding='same'))
        self._model.add(keras.layers.BatchNormalization())
        self._model.add(keras.layers.Activation('relu'))
        self._model.add(keras.layers.MaxPool1D(pool_size=2,strides=2))

        self._model.add(keras.layers.Conv1D(128, kernel_size=3, strides=1, padding='same'))
        self._model.add(keras.layers.BatchNormalization())
        self._model.add(keras.layers.Activation('relu'))
        self._model.add(keras.layers.MaxPool1D(pool_size=2,strides=2))

        self._model.add(keras.layers.Conv1D(256, kernel_size=3, strides=1, padding='same'))
        self._model.add(keras.layers.BatchNormalization())
        self._model.add(keras.layers.Activation('relu'))
        self._model.add(keras.layers.MaxPool1D(pool_size=2,strides=2))

        self._model.add(keras.layers.Conv1D(512, kernel_size=3, strides=1, padding='same'))
        self._model.add(keras.layers.BatchNormalization())
        self._model.add(keras.layers.Activation('relu'))
        self._model.add(keras.layers.MaxPool1D(pool_size=2,strides=2))

        self._model.add(keras.layers.GlobalAveragePooling1D())

        self._model.add(keras.layers.Dropout(0.5))

        self._model.add(keras.layers.Flatten())

        try:
            self._model.add(keras.layers.Dense(len(self._species_dict) - 1, activation='softmax'))
        except NameError:
            print("No species dictionary found. Please load data before building the model.")
            sys.exit(2)

        print("Using " + str(len(self._species_dict) - 1) + " classes.")
        self._model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
