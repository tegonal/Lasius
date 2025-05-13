[EN](TOS)

# Nutzungsbedingungen erfassen

Lasius ermöglicht es Betreibern dass Benutzer die Nutzungsbedingungen des Betreibers akzeptieren müssen, bevor diese Lasius nutzen können. Um diese Funktion zu aktivieren,
muss die Umgebungsvariable `LASIUS_TERMSOFSERVICE_VERSION` in der `.env` Datei mit einem Wert, bspw. einer Version oder einem Datum, versehen werden. Zudem müssen im Frontend Docker-Image unter dem Pfad `/app/public/termsofservice` HTML Dateien mit dem Inhalt der Nutzungsbedingungen bereitgestellt werden. Beispiel-Vorlagen bedingen sich im [lasius-docker-compose Repository](https://github.com/tegonal/lasius-docker-compose/tree/main/templates/termsofservice). Es wird dabei eine Vorlage je unterstützter Sprache benötigt.

Die Nutzungsbedingungen können bei Verwendung von Lasius als Docker mittels volume wie folgt eingebettet werden:
```
docker run --volume <TERM_OF_SERVICE_PATH>:/app/public/termsofservice tegonal/lasius-frontend:latest
```

# Aktualisieren der Nutzungsbedingungen
Um die Nutzungsbedingungen anzupassen und vom Benutzer erneut akzeptieren zu lassen müssen folgende Schritte vollzogen werden:

1. Neue Nutzungsbedingungen als HTML erfasse
2. Wert der Umgebungsvariable `LASIUS_TERMSOFSERVICE_VERSION` anpassen
3. Frontend neu starten

Beim nächsten Login werden den Benutzern die neuen Nutzungsbedingungen angezeigt, welche vor Verwendung akzeptiert werden müssen.

