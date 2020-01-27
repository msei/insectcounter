# BACKEND

In diesem File wird das BACKEND des Insect Counting Projektes beschrieben.
Das BACKEND wird über docker-compose betrieben. 
Es besteht aus dem SensorThingsAPI Implementierung GOST + Datenbank, unserer Postgres Datenbank um User und Sensoren zu verwalten, sowie einem express.js Webserver.
Aktuell ist ein Server unter https://insectcounter.zapto.org erreichbar (wird kurz nach Ende des Projektes abgestellt).

## Vorraussetzungen
Das BACKEND wurde nur auf Raspian Buster sowie Ubuntu 18.04 getestet. Andere Betriebssysteme werden nicht unterstützt könnten jedoch funktionieren.
Es muss sowohl docker als auch docker-compose auf dem PC installiert sein:
- https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-18-04
- https://www.digitalocean.com/community/tutorials/how-to-install-docker-compose-on-ubuntu-18-04

## Installieren und Starten
Wenn docker und docker-compose erfolgreich installiert sind, kann man den Server starten.
Wechsel zuerst in diesen Ordner: `$ cd p29-server`
Führe dann einen dieser beiden Befehle aus.
Unter Ubuntu 18.04: `$ docker-compose -f docker-compose-pc.yml build`, `$ docker-compose -f docker-compose-pc.yml up -d gost-db`, (warten bis die Datenbank erstellt wurde), `$ docker-compose -f docker-compose-pc.yml up -d`
Unter Raspian: `$ docker-compose build`, `$ docker-compose up -d gost-db ` (warten bis die Datenbank erstellt wurde), `$ docker-compose up -d`

## Installation Testen
Wenn es keine Fehlermeldung beim ausführen des docker-compose Befehls gab, sollte der Server nun laufen.
Falls die Fehlermeldung kam, dass dockerd nicht läuft führe `$ dockerd` aus. Falls es keine Permission gab führe die gleichen Befehle mit `sudo` aus.

Der Server sollte nun unter http://localhost:3000 erreichbar sein.
Die GOST Schnittstelle sollte unter http://localhost:8080/v1.0 erreichbar sein

## Tests laufen lassen
Um unsere Test Suite laufen zu lassen sollte der Server installiert sein und laufen. (der Docker Container)
Zusätzlich muss lokal eine neue node Version vorhanden sein und alle Abhängikeiten installiert `npm install`.
Jetzt können über `npm test` die Tests gestartet werden und über `npm run test-coverage` eine Test-Coverage angezeigt werden.
Falls Tests fehlschlagen (z.B. einem Fehler in der Verbindung) kann es zu einem fehlerhaften State der Datenbank kommen.
Am Besten die Datenbank löschen und neu erstellen mit `$node add_scripts/setup_db.js dropAllTables && node add_scripts/setup_db.js createAllTables`.
Für die Front-End Tests müssen über Selenium IDE gestartet werden (https://selenium.dev/selenium-ide/). Hierfür in der Selenium IDE `test_web_code.side` importieren und die Tests starten.

## Parameter
Im `.env`-File können verschiedene Parameter angepasst werden, bzw. sollten angepasst werden.
Man kann die Sprache des Servers einstellen.
Man kann die öffentlich sichtbare URL des Web-Servers angeben (default: http://localhost:3000).
Man kann die öffentlich sichtbare URL des GOST Servers einstellen (default: http://localhost:8080).
Man kann die Cookie Policy einstellen, wenn die öffentlich sichtbare URL unter https erreichbar ist sollte man sie auf strict stellen um csrf Angriffe zu verhindern.
Man kann und sollte die Passwörter für GOST, die Nutzer/Sensordatenbank etc. einstellen.

## Das BACKEND öffentlich bereitstellen 
Hierfür müssen einige Dinge beachtet werden.
- Die Web-Server und die GOST-Server Schnittstellen müssen über einen Reverse Proxy (z. B. Apache2) freigegeben werden.
- Man sollte die GOST Schnittstelle absichern:
    - In Apache2:
        - Füge `<Location /v1.0/>
          		<Limit POST PUT DELETE PATCH>
          			AuthType Basic
          			AuthName "GOST Writer"
          			AuthUserFile "/etc/apache2/thepwfile"
          			Require user gost
          		</Limit>
          	</Location>` and `<Location /Dashboard/>
          		<Limit POST PUT DELETE PATCH>
          			AuthType Basic
          			AuthName "GOST Writer"
          			AuthUserFile "/etc/apache2/thepwfile"
          			Require user gost
          		</Limit>
          	</Location>` zum Configurationsfile hinzu und generiere ein Passwort für den Nutzer gost mit `htpasswd`.
- Im `.env`-File müssen nun die Passwörter und URLs entsprechend angepasst werden.