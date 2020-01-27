import unittest
import os
from classifier.network import NetworkModule
import json


class TestNetwork(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.nw = NetworkModule("../savedfiles","../model/token.json","http://192.168.2.104:3000")

    def testSetupWrongPath(self):
        with self.assertRaises(SystemExit):
            nw = NetworkModule("./IDontExist","../model/token.json","http://192.168.2.104:3000")

    def testSetupNoToken(self):
        with self.assertRaises(SystemExit):
            nw = NetworkModule("../savedfiles","./notoken.json","http://192.168.2.104:3000")

    def testSetupWrongToken(self):

        dummydict = dict(test = "dummy")

        with open("wrongtoken.json", "w") as f:
            json.dump(dummydict,f)

        try:
            with self.assertRaises(SystemExit):
                nw = NetworkModule("../savedfiles","./wrongtoken.json","http://192.168.2.104:3000")
        finally:
            os.remove("wrongtoken.json")

    def testSetupWrongURL(self):
        with self.assertRaises(SystemExit):
            nw = NetworkModule("../savedfiles","./classifier/token.json","abcd")

    def testSendHTTP(self):
        self.nw.send_http("testlabel","testtime",dict(testinfo="dummy"),1.0)

    def testSaveToBacklog(self):
        open(self.nw.backlog_path,"w").close() # need dummy file

        try:
            self.nw.save_to_backlog("testlabel","testtime",dict(testinfo="dummy"),1.0)

            with open(self.nw.backlog_path, "r") as f:
                line = f.readlines()
                for l in line:
                    data = json.loads(l)
                    assert data["result"] == "testlabel", "Info (result) not saved to backlog correctly"
                    assert data["timestamp"] == "testtime", "Info (timestamp) not saved to backlog correctly"
                    assert data["parameters"]["testinfo"] == "dummy", "Info (parameters) not saved to backlog correctly"
                    assert data["score"] == 1.0, "Info (score) not saved to backlog correctly"
        finally:
            os.remove(self.nw.backlog_path)

    def testSendBacklog(self):
        open(self.nw.backlog_path,"w").close()

        self.nw.save_to_backlog("testlabel1","testtime1",dict(testinfo1="dummy"), 1.0)
        self.nw.save_to_backlog("testlabel2","testtime2",dict(testinfo2="dummy"), 2.0)
        self.nw.send_backlog()

    @classmethod
    def tearDownClass(cls):
        del cls.nw
