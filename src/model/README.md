# Anleitung PC-Training

Diese Anleitung gibt einen Überblick darüber, wie man
- auf dem PC eine Trainingsumgebung für das Modell zur Insektenklassifizierung (mit Wingbeats) erstellt
- die Wingbeats-Daten für das Training strukturiert
- den Trainings-Code ausführt

## 1) Installation

Um den PC-Code laufen zu lassen, empfehlen wir, ein Python-Environment einzurichten, in welches die nötigen Libraries installiert werden. (Python lässt sich [hier](https://www.python.org/downloads/))
herunterladen. **Da TensorFlow aktuell nur bis Python 3.7 unterstützt wird, lade bitte Python 3.7 herunter oder informiere dich vorher über die [vorhandenen TensorFlow-Releases](https://www.tensorflow.org/install/pip).**

### 1.1) Environment erstellen
Führe im Terminal folgende Befehle aus (wenn Python 3.7 auf dem System vorhanden ist):

Linux :
```
sudo apt install python3-pip
sudo apt-get install python3-venv
python3 -m venv insectcounting
```

Windows (stelle vorher sicher, dass Python [zum Path hinzugefügt](https://geek-university.com/python/add-python-to-the-windows-path/) wurde):
```
python -m pip install --user virtualenv
python -m venv insectcounting
```

### 1.2) Environment aktivieren
Um dein Environment benutzen zu können, musst du es aktivieren. **Dieser Schritt muss immer ausgeführt werden, sobald ein neues Terminal-Fenster geöffnet wird, in dem du das Netzwerk trainieren möchtest.**
Dies geht folgendermaßen:

Linux:
`source insectcounting/bin/activate`

Windows:
`C:\Users\[Username]\insectcounting\Scripts\activate.bat`
(https://programwithus.com/learn-to-code/Pip-and-virtualenv-on-Windows/)


### 1.3) Libraries installieren

Um den Code ausführen zu können, brauchst du einige zusätzliche Python-Libraries und natürlich TensorFlow. Wechsle im Terminal mit dem aktivierten Environment (per `cd`) zu dem Ordner, in dem sich die Datei `requirements_pc.txt` befindet und gib folgendes ein:

`pip install -r requirements_pc.txt`

Die Libraries werden nun installiert - dies kann eine Weile dauern.

**Notiz für Developer**: Mit dieser requirements-Datei wird TensorFlow 2.0.0 in der CPU-Version installiert, um möglichst universelle Nutzbarkeit zu gewährleisten. Wer mit GPU trainieren möchte, sollte tensorflow `tensorflow==2.0.0` aus der Datei entfernen, und manuell tensorflow-gpu (2.0 und aufwärts) nach einer offiziellen Anleitung installieren.

## 2) Struktur der Wingbeats-Daten

Damit die Daten korrekt ausgelesen werden, müssen sie in einer bestimmten Struktur gegeben sein.

Erstelle einen Ordner für das gesamte Dataset und in diesem Ordner einen Unterordner für jede Insektenart. Zum Beispiel:

```
Wingbeats/
    - Sarcophagidae/
    - Musca Domestica/
```

`Sarcophagidae` und `Musca Domestica` wären in diesem Falle die zwei Spezies, die das Netzwerk lernt zu unterscheiden. Nun speichere in jedem dieser Unterordner die Training-Samples als einzelne .wav-Files ab. In diesem Falle ist es irrelevant, ob dies in Unterordnern geschieht und wie diese heißen.

**Wichtig:**
- Die nach den Insektenarten benannten Ordner müssen genau die Namen tragen, mit denen die Insekten später abgespeichert und auf der Website angezeigt werden sollen!
- Es dürfen **keine** .wav-Files in den Ordnern enthalten sein, mit denen nicht trainiert werden soll, da das Programm diese auslesen wird und abstürzt, wenn sie für das Training ungeeignet sind!

## 3) Code

### 3.1) Struktur ###
Um das Netzwerk zu trainieren sind folgende Dateien gegeben:

- `training_main.py` - Hauptmodul zum Trainieren.

Im Unterordner `model/`:
- `wingbeats_helper.py` - Helfermodul, um Wingbeats-Daten einzulesen und in Trainings- und Testdaten aufzuspalten
- `model_base.py` - Basis-Modul für Keras-Netzwerke, die auf Wingbeats-Daten trainieren. Hier wird alles definiert außer der aktuell benutzten Netzwerkarchitektur selbst
- `conv1d.py` - Eine Netzwerkarchitektur (convolutional network). Erbt restliche Netzwerk-Funktionalität von `model_base.py`

Eine genauere Dokumentation zu diesen Modulen ist in ihrem jeweiligen Code (auf Englisch) zu finden.

### 3.2) Training ###

Wechsle im Terminal (per `cd`) zu dem Ordner, der `training_main.py` (und den Unterodner `model/` mit den anderen eben genannten Dateien enthält).

Achte darauf, dass das in 1) erstellte Environment aktiviert ist. Dann kannst du den Code folgendermaßen ausführen:

Linux:
```
python3 training_main.py
```

Windows:
```
python training_main.py
```

Folgende Parameter sind bei der Ausführung des Codes möglich:
- `--data_dir`: Der Ordner, in dem die Trainingsdaten (strukturiert wie in 2) beschrieben) zu finden sind (z.B. `"C:/Wingbeats/"`)
- `--export_dir`: Der Ordner, in dem die Exports des Programms gespeichert werden sollen (siehe 3.3) (z.B. `export/`)
-  `--cap`: Die Anzahl von Samples, die maximal pro Spezies eingelesen werden soll (z.B. `15000`)
-  `--epochs`: Die Anzahl der Trainings-Epochen, die durchgeführt werden sollen (z.B `3`)

Mit den gegebenen Beispielen sähe der komplette Kommandozeilen-Befehl so aus:

Linux:
```
python3 training_main.py --data_dir="C:/Wingbeats/" --export_dir="export/" --cap=15000 --epochs=3
```

Windows:
```
python training_main.py --data_dir="C:/Wingbeats/" --export_dir="export/" --cap=15000 --epochs=3
```

Das Laden der Samples und Training können einige Zeit in Anspruch nehmen. 

### 3.3) Export ###

Das Trainingsmodul wird zum Ende des Trainings zwei Dateien exportiert haben:
- `export_[id].tflite` wird den .tflite-Export des fertig trainierten Modells, der dann auf dem Pi genutzt werden kann, enthalten. Es wird nach jedem Training eine neue `[id]` erstellt, damit nachvollzogen kann, welche Insekten mit welchem Modell identifiziert wurden.
- `species_[id].json` wird ein Dictionary enthalten, das jeder Spezies eine Nummer (z.B. "0" für "Sarcophagidae" und "1" für "Musca Domestica") zuweist und zusätzlich die `[id]` noch einmal abspeichert, damit diese an den Server übermittelt werden kann. 
