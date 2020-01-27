# InsectCounting Software Engineering Projekt Uni Saarland

Bitte das ganze README lesen, bevor mit der Installation/Ausführung begonnen wird.
Je nach Use-Case müssen nur Teile der Anleitung durchgeführt werden und verschiedene Anpassungen durchgeführt werden.

Diese Website ist Teil eines Projektes von Ecocurious zum Zählen von Insekten in unserer Heimat - ohne, dass diese dabei eingefangen werden oder sterben müssen! [**Hier**](https://ecocurious.de/projekte/insect-counts/) kannst du mehr erfahren!

Das Projekt besteht aus 4 Teilen:
1. Einer Website auf der die gezählten Insekten pro Sensor visualisiert werden und User Sensoren anlegen können.
    - Eine Testinstanz der Website ist aktuell unter https://insectcounter.zapto.org/ erreichbar (kurz nach der Abgabe wird unser Server eingestellt).
    - Eine eigene Instanz der Website ist verfügbar unter http://localhost:3000 sobald man den Server unter 2. installiert hat.
2. Einem Server der die Daten abspeichert und die Website bereitstellt (betrieben über docker-compose)
    - Aktuell läuft ein Test Server noch unter https://insectcounter.zapto.org (läuft auf einem Raspberry Pi4).
    - Wir stellen zwei `docker-compose.yml` Dateien bereit mit der ein Server auf Ubuntu 18.04 oder  Raspbian Buster aufgesetzt werden kann.
        - Dieser Server ist dann unter http://localhost:3000 verfügbar.
        - Der Benutzer muss dann mit einem Reverse Proxy den Server sicher im Internet verfügbar machen.
3. Einem Raspberry Pi4 der über einen Infrarot Sender Insekten klassifiziert und die Ergebnisse an den Server aus 2. schickt.
    - Man benötigt einen Raspberry Pi4 mit Raspbian Buster (andere Hardware und Betriebssysteme wurden nicht getestet/sind nicht untersützt).
    - Eine USB-Soundkarte (Wir benutzen: goobay 95451).
    - Einen Infrarot-Sensor angeschlossen an die USB-Soundkarte.
        - Hier müssen Infos vom Kunden ergänzt werden.
        - Zum Testen kann man auch jeglichen Audioausgang (z. B. vom Smartphone) an den Eingang der Soundkarte anschließen und Audio (Wingbeats-Recordings) abspielen.  
4. Einem neuronalen Netzwerk welches auf einem leistungsstarkem PC mit großen Wingbeats Datenmengen trainiert werden kann.
    - Das Netzwerk kann mit neuen Daten trainiert werden und erstellt einen Model-Export welcher in (3.)/auf dem Pi benutzt wird.
    - Wir stellen ein Probe Model Export zu Verfügung welches auf den Kaggle Wingbeats Daten trainiert wurde. 
    
Der normale Endnutzer kommt nur mit Punkt 1. (der Website) und wenn er am Projekt mitmachen will mit Punkt 3. (dem Raspberry) in Kontakt.
Der Betreiber des InsectCounting Projektes muss einen Server (2.) bereitstellen und mit neuen Daten ein geeignetes Model trainieren (4.) und das README, sowie Voreinstellungen für den Endnutzer anpassen.
Der Entwickler/Tester des Systems kann mit allen 4. Punkten interagieren. 

Das folgende README ist in 3 Bereiche gegliedert:
1. Für Developer/Tester die unser ganzen System lokal testen wollen.
2. Template für Endnutzer
3. Anleitung für den Kunden was er tun muss um das System zum laufen bekommen und wie er das Template für den Endnutzer updaten kann.


## Dev Version 
- Als Erstes muss der BACKEND Server erstellt werden.
    - Folge hierfür folgenden Informationen [BACKEND Installieren](p29-server/README.md#Vorraussetzungen)
- Auf der Website einen User erstellen, einen Sensor erstellen + Token herunterladen
- Aus dem Repo Model + JSON herunterladen (bzw. einfach benutzen, da das Repo für den vorherigen Schritt bereits gecloned ist)
    - Oder: [Trainingsanleitung](/src/model/README.md) um ein neues Model + JSON zu generieren
- Einen Pi (4) aufsetzen
    - Hierfür folgender [Anleitung](SETUPPI.md) folgen

## (Template) User Version von Ecocurious
- Auf der Website [website](LINK vom Kunden ersetzen) User erstellen, Sensor erstellen + Token herunterladen
- Auf der Website aktuelles Model + JSON herunterladen
- Einen PI 4 Aufsetzen
    - Hierfür folgender [Anleitung](SETUPPI.md) folgen
- Eine vollständigere Version findet sich unter `/about` auf der Webseite.
    
## Anpassungen des Kunden
- Ecocurious:
    - In den beiden .env Dateien sind einige Passwörter, Default Links, etc. die geändert werden können/bzw. müssen.

---
Favicon Lizenz:
Copyright 2019 Twitter, Inc and other contributors
Graphics licensed under CC-BY 4.0: https://creativecommons.org/licenses/by/4.0/
