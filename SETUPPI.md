# Raspberry PI Modul
Ein Raspberry PI 4 wird benötigt, sowie eine 16GB MicroSD Karte und ein PC mit Internetanbidung und MicroSD Kartemleser.
Einen Bildschirm, Tastatur und Maus.

## Raspberry Aufsetzen
1. Raspbian Buster with Desktop downloaden (https://www.raspberrypi.org/downloads/raspbian/)
    - SHA überprüfen: 2c4067d59acf891b7aa1683cb1918da78d76d2552c02749148d175fa7f766842
    - Z. B. mit `$ sha256sum 2019-09-26-raspbian-buster.zip`
    - Wenn die Checksumme richtig ist fortsetzen.
2. Etcher downloaden und installieren
    - Windows/Mac: https://www.balena.io/etcher/
    - Ubuntu-based Linux: https://www.omgubuntu.co.uk/2017/05/how-to-install-etcher-on-ubuntu
    - Arch-based Linux: yay -S etcher (Anstatt yay kann jeder AUR-Helper benutzt werden)
3. Eine 16GB microSD Karte am PC anschliessen
4. Etcher starten
    - In Etcher: `2019-09-26-raspbian-buster.zip` als Image auswählen, die SD-Karte als Ziel und dann im Anschluss brennen.
5. Nach erfolgreichem Brennen die SD Karte vom PC trennen und am Raspberry anschliessen.
6. Tastatur, Maus und Bildschirm an den Raspberry anschliessen und daraufhin starten.
7. Nach dem hochfahren das Popup abarbeiten um die Sprache, Tastaturbelegung etc einzustellen und sich mit einem Netzwerk verbinden.
8. I²C Schnittstelle aktivieren:
    - `$ sudo raspi-config`, dann auf 5:Interfacing, I2C, YES, FINISH klicken.
9. (Optional) SSH aktivieren:
    - Bedenke das mögliche Sicherheitsrisiko
    - `$ sudo raspi-config`, dann auf 5:Interfacing, P2: SSH, YES, FINISH klicken.
    - `$ ifconfig` umd die IP Adresse herauszufinden.
10. (Optional) Nichtbenötigte Services wie Bluetooth abstellen.
11. Den Raspberry neustarten.

## InsectCounting installieren
1. Auf dem PI ein Terminal öffnen `STRG+ALT+T` oder per SSH mit dem Pi verbinden `$ ssh pi@<PI-IP>`
2. Die Installations [.zip](https://github.com/insectcounter/insectcounter/archive/master.zip) Datei herunterladen und in einem neu angelegten Ordner entpacken.
    - `$ wget repo.zip`
    - `$ unzip repo.zip`
    - Alternativ das Repository clonen: `$ git clone https://github.com/insectcounter/insectcounter.git`
3. In den Ordner wechseln: `$ cd project29`
4. Änderungen durchführen `$ nano .env`
5. Den Installationsbefehl ausführen `$ sh setup.sh`


## Daten hinzufügen
1. Nutzer und Sensor erstellen und Token herunterladen.
2. (Optional) Neue Model.zip herunterladen.
3. Beides unter `/home/pi/project29/model` abspeichern und alte Files löschen/überschreiben.
4. Neustarten 

## Änderungen hinzufügen
1. Änderungen im `.env` File hinzufügen.
2. Neustarten oder `$ sudo systemctl restart insectcounter`
