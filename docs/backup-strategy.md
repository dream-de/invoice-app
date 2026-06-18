# Backup Strategy

## Verzeichnisstruktur

- `backups/system/manual`: manuelle Sicherungen.
- `backups/system/database`: Datenbank-Dumps.
- `backups/system/files`: Datei- und Upload-Sicherungen.

## Backup

Vor produktionsnahen Eingriffen wird ein Backup-Ordner mit Git-Status, Git-Diff, Quellcode-Snapshot und Datenbank-Dump erstellt. Der letzte bekannte Backup-Ordner wird ueber `backups/phase20-production-ready-latest.txt` referenziert.

## Restore

1. Anwendung stoppen.
2. Quellcode-Snapshot oder Git-Diff aus dem Backup pruefen.
3. Datenbank aus dem passenden Dump wiederherstellen.
4. Anwendung neu starten.
5. `/api/health` und `/dashboard-v2/system-status` pruefen.

## Aufbewahrung

Phase 20 implementiert keine automatische Loeschlogik. Retention wird organisatorisch oder ueber externe Backup-Jobs gesteuert.
