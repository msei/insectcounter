import unittest
import listener
from argparse import Namespace
from multiprocessing import Process
import time

class TestZIntegrationPi(unittest.TestCase):

    def testZIntegration(self):
        """
        Integration test for Pi (Listener-classifier and recorder)
        Will not run fully during coverage testing.

        listener.py is tested manually as well, steps include:
        1. play valid file
        2. play noise
        3. close server connection and play file
        5. open up server connection again and play file
        """

        lisargs = Namespace(dirpath="../savedfiles",
                        modelpath="../model",
                        tokenfile="../model/token.json",
                        permanent=False,
                        server_url="http://192.168.2.104:3000",
                        threshold=10,
                        device=2,
                        target_rate=8000,
                        rec_rate=44100,
                        samples=5000,
                        buffer_size=4096,
                        address=0x76,
                        use_sensor=False
                        )

        try:
            listener.main(lisargs)
        except OSError:
            "Expected test error caught."
