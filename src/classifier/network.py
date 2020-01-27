import sys
import json
import requests

import os.path
from urllib.parse import urlparse
from json import JSONDecodeError


def check_url(url):
    """
    Checks if a given url is a valid url.

    :param url: A string describing an url.
    :return: True if the url is valid, false otherwise.
    """
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except ValueError:
        return False


class NetworkModule:
    """
    The network module class. Responsible for sending data to the insect counter server.
    """
    def __init__(self, dirpath, tokenfile, server_url):
        """
        Creates a network module instance.

        :param dirpath: Path where the backlog data should be saved.
        :param tokenfile: Name of the tokenfile.json needed to authenticate with the server.
        :param server_url: Address of the server whom to send the data to.
        """
        # Get the path for the backlog file.
        if not os.path.isdir(dirpath):
            sys.exit("Der angegebene Pfad für die Dateien existiert nicht oder ist ungültig.")
        self.backlog_path = os.path.join(dirpath, "backlog.json")
        # Try to read the tokenfile
        try:
            with open(tokenfile) as json_file:
                try:
                    self.bearer = json.load(json_file)["token"]
                except KeyError:
                    sys.exit("Kein Eintrag für den Token im Tokenfile gefunden.")
        except FileNotFoundError as f:
            print(f)
            sys.exit("Es wurde kein Tokenfile gefunden.")
        except JSONDecodeError as j:
            print(j)
            sys.exit("Das angegebende Tokenfile ist ungütlig.")
        print(self.bearer)
        # Try to check the server url
        self.url = str(server_url) + "/sensor"
        if not check_url(self.url):
            sys.exit("Invalide URL: " + self.url)

    def send_http(self, label, timestamp, info, score):
        """
        Sends the data to the server using http(s).

        :param label: Label/result of the classification.
        :param timestamp: Timestamp of the event.
        :param info: Additional parameters about the recording (e.g. temperature, etc.)
        :param score: Model confidence of the classification.
        """
        print(label, timestamp, info, score)

        info["model_conf"] = score

        headers = {
                   "Authorization": "Bearer " + self.bearer}
        body = {"result": label,
                "timestamp": timestamp,
                "parameters": info,
                }
        # Try to send the data to the specified server.
        try:
            response = requests.post(self.url, json=body, headers=headers)
            print(response.text)
            response.raise_for_status()
        # Save the data if the request did not work (e.g. timeout).
        except Exception as e:
            print("Fehler beim Senden: ", e)
            self.save_to_backlog(label, timestamp, info, score)
        # If the request was successful send the backlog.
        else:
            self.send_backlog()

    def save_to_backlog(self, label, timestamp, info, score):
        """
        Saves unsuccessful requests in a json backlog.

        :param label: Label/result of the classification.
        :param timestamp: Timestamp of the event.
        :param info: Additional parameters about the recording (e.g. temperature, etc.)
        :param score: Model confidence of the classification.
        """
        with open(self.backlog_path, "a+") as file:
            json.dump({"result": label, "timestamp": timestamp, "parameters": info, "score": score}, file)
            file.write("\n")

    def send_backlog(self):
        """
        Tries to send the complete backlog.
        """
        # Only send the backlog if it exists.
        if os.path.isfile(self.backlog_path) and not os.stat(self.backlog_path).st_size == 0:
            with open(self.backlog_path, "r") as file:
                backlog = file.readlines()
            # Remove the backlog.
            os.remove(self.backlog_path)
            # Tries to send every line in the backlog. If it fails, it gets written to the backlog again.
            for line in backlog:
                data = json.loads(line)
                self.send_http(data["result"], data["timestamp"], data["parameters"], data["score"])
