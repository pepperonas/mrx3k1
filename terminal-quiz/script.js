document.addEventListener('DOMContentLoaded', function () {
    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');
    const progressBar = document.getElementById('progress-bar');
    const correctCount = document.getElementById('correct-count');
    const questionCount = document.getElementById('question-count');
    const totalQuestions = document.getElementById('total-questions');

    let currentQuestionIndex = -1;
    let correctAnswers = 0;
    let quizStarted = false;

// Linux-Befehle-Quiz Fragen
    const questions = [
// man
        {
            question: "Welcher Befehl zeigt die Handbuchseiten (Manual) für andere Befehle an?",
            answer: "man",
            hint: "Kurz für 'manual' - das Handbuch",
            explanation: "Der Befehl 'man' zeigt die Dokumentation (Manual Pages) für andere Befehle an, z.B. 'man ls'."
        },
        {
            question: "Wie kann man die Handbuchseite für den Befehl 'ls' anzeigen?",
            answer: "man ls",
            hint: "Zuerst der Befehl für das Handbuch, dann der Befehl, über den du etwas lernen möchtest",
            explanation: "Mit 'man ls' öffnet man die Dokumentation zum Befehl 'ls', die alle Optionen und die Verwendung erklärt."
        },

// cd
        {
            question: "Welcher Befehl wird verwendet, um das Verzeichnis zu wechseln?",
            answer: "cd",
            hint: "Steht für 'change directory'",
            explanation: "Mit 'cd' (change directory) wechselt man in ein anderes Verzeichnis, z.B. 'cd /home'."
        },
        {
            question: "Wie wechselt man mit einem Befehl in das übergeordnete Verzeichnis?",
            answer: "cd ..",
            hint: "Der Befehl besteht aus 'cd' und einem speziellen Pfad, der nach oben zeigt",
            explanation: "Mit 'cd ..' wechselt man in das übergeordnete Verzeichnis (eine Ebene nach oben)."
        },
        {
            question: "Welcher Befehl bringt dich direkt in dein Home-Verzeichnis?",
            answer: "cd",
            acceptableAnswers: ["cd", "cd ~"],
            hint: "Der Befehl kann alleine stehen oder mit einer Tilde",
            explanation: "Der Befehl 'cd' ohne Argumente oder 'cd ~' bringt dich direkt in dein Home-Verzeichnis."
        },

// ls
        {
            question: "Welcher Befehl listet den Inhalt eines Verzeichnisses auf?",
            answer: "ls",
            hint: "Kurz für 'list'",
            explanation: "Der Befehl 'ls' (list) zeigt den Inhalt des aktuellen Verzeichnisses an."
        },
        {
            question: "Welcher Befehl zeigt alle Dateien (auch versteckte) mit Details wie Berechtigungen und Größe an?",
            answer: "ls -lisah",
            acceptableAnswers: ["ls -lisah", "ls -lisa", "ls -lisha", "ls -lsiah", "ls -lsahi", "ls -lshai", "ls -laihs", "ls -laish"],
            hint: "Es ist 'ls' mit mehreren Optionen: l (long format), i (inode), s (size), a (all), h (human readable)",
            explanation: "Der Befehl 'ls -lisah' zeigt alle Dateien inkl. versteckter Dateien (-a) im Langformat (-l) mit Inode-Nummern (-i), Größen (-s) und menschenlesbaren Größenangaben (-h)."
        },

// pwd
        {
            question: "Welcher Befehl zeigt dir den vollständigen Pfad des aktuellen Verzeichnisses?",
            answer: "pwd",
            hint: "Steht für 'print working directory'",
            explanation: "Der Befehl 'pwd' (print working directory) zeigt den vollständigen Pfad des aktuellen Verzeichnisses an."
        },

// tree
        {
            question: "Welcher Befehl zeigt die Verzeichnisstruktur grafisch als Baum an?",
            answer: "tree",
            hint: "Der Name beschreibt die Ausgabe - eine baumartige Struktur",
            explanation: "Der Befehl 'tree' zeigt die Verzeichnisstruktur grafisch als Baum an, was die Hierarchie der Dateien und Ordner verdeutlicht."
        },

// cat
        {
            question: "Welcher Befehl zeigt den Inhalt einer Textdatei direkt im Terminal an?",
            answer: "cat",
            hint: "Kurz für 'concatenate' - ursprünglich zum Verketten von Dateien gedacht",
            explanation: "Der Befehl 'cat' (concatenate) zeigt den Inhalt einer Datei an, z.B. 'cat datei.txt'."
        },
        {
            question: "Wie kann man den Inhalt mehrerer Textdateien hintereinander anzeigen?",
            answer: "cat datei1.txt datei2.txt",
            acceptableAnswers: ["cat datei1.txt datei2.txt", "cat *.txt"],
            hint: "Verwende den Befehl zum Anzeigen von Dateien mit mehreren Dateinamen",
            explanation: "Mit 'cat datei1.txt datei2.txt' werden die Inhalte beider Dateien nacheinander angezeigt."
        },

// nano
        {
            question: "Welcher einfache Texteditor ist in den meisten Linux-Distributionen vorinstalliert und ähnelt dem Windows Notepad?",
            answer: "nano",
            hint: "Der Name ist kurz und beginnt mit 'n'",
            explanation: "Nano ist ein einfacher Texteditor für die Kommandozeile, ähnlich wie Notepad in Windows."
        },
        {
            question: "Welche Tastenkombination speichert eine Datei in nano?",
            answer: "Strg+o",
            acceptableAnswers: ["Strg+o", "Ctrl+o", "^O"],
            hint: "Es ist Strg plus ein Buchstabe, der für 'output' steht",
            explanation: "In nano speichert man mit 'Strg+o' (WriteOut) die Datei."
        },
        {
            question: "Welche Tastenkombination beendet den nano-Editor?",
            answer: "Strg+x",
            acceptableAnswers: ["Strg+x", "Ctrl+x", "^X"],
            hint: "Es ist Strg plus ein Buchstabe, der für 'exit' steht",
            explanation: "Mit 'Strg+x' beendet man den nano-Editor."
        },

// cp
        {
            question: "Welcher Befehl kopiert Dateien in Linux?",
            answer: "cp",
            hint: "Kurz für 'copy'",
            explanation: "Mit 'cp' (copy) kopiert man Dateien, z.B. 'cp quelle.txt ziel.txt'."
        },
        {
            question: "Wie kopiert man ein Verzeichnis mit allen Unterverzeichnissen und Dateien?",
            answer: "cp -r",
            acceptableAnswers: ["cp -r", "cp -R", "cp --recursive"],
            hint: "Der Befehl zum Kopieren mit einer Option für 'recursive'",
            explanation: "Mit 'cp -r' (recursive) kopiert man Verzeichnisse mit allen Unterverzeichnissen und Dateien."
        },

// history
        {
            question: "Welcher Befehl zeigt die zuletzt verwendeten Befehle in der Shell an?",
            answer: "history",
            hint: "Der englische Begriff für 'Verlauf' oder 'Geschichte'",
            explanation: "Der Befehl 'history' zeigt eine Liste der zuletzt verwendeten Befehle mit Nummern an."
        },

// mv
        {
            question: "Welcher Befehl wird zum Verschieben oder Umbenennen von Dateien verwendet?",
            answer: "mv",
            hint: "Kurz für 'move'",
            explanation: "Mit 'mv' (move) verschiebt man Dateien oder benennt sie um, z.B. 'mv alt.txt neu.txt'."
        },
        {
            question: "Wie benennt man eine Datei 'alt.txt' in 'neu.txt' um?",
            answer: "mv alt.txt neu.txt",
            hint: "Verwende den Befehl zum Verschieben mit Quell- und Zieldateinamen",
            explanation: "Mit 'mv alt.txt neu.txt' wird die Datei 'alt.txt' in 'neu.txt' umbenannt."
        },

// rm
        {
            question: "Welcher Befehl löscht Dateien in Linux?",
            answer: "rm",
            hint: "Kurz für 'remove'",
            explanation: "Mit 'rm' (remove) löscht man Dateien, z.B. 'rm datei.txt'."
        },
        {
            question: "Welcher Befehl löscht ein Verzeichnis mit allen Unterverzeichnissen und Dateien?",
            answer: "rm -rf",
            acceptableAnswers: ["rm -rf", "rm -fr"],
            hint: "Der Befehl zum Löschen mit zwei Optionen: 'r' für rekursiv und 'f' für 'force'",
            explanation: "Mit 'rm -rf' löscht man Verzeichnisse rekursiv (-r) und ohne Nachfragen (-f). Vorsicht: Sehr gefährlicher Befehl!"
        },

// mkdir
        {
            question: "Welcher Befehl erstellt ein neues Verzeichnis?",
            answer: "mkdir",
            hint: "Steht für 'make directory'",
            explanation: "Mit 'mkdir' (make directory) erstellt man ein neues Verzeichnis, z.B. 'mkdir neuer_ordner'."
        },

// find
        {
            question: "Welcher Befehl wird verwendet, um Dateien im Dateisystem zu suchen?",
            answer: "find",
            hint: "Der englische Begriff für 'finden'",
            explanation: "Mit 'find' sucht man nach Dateien, z.B. 'find /home -name \"*.txt\"'."
        },
        {
            question: "Wie sucht man nach allen Dateien mit der Endung '.log' im Verzeichnis /var?",
            answer: "find /var -name \"*.log\"",
            acceptableAnswers: ["find /var -name \"*.log\"", "find /var -name *.log"],
            hint: "Verwende den Suchbefehl mit dem Startverzeichnis und der Option für den Namen",
            explanation: "Mit 'find /var -name \"*.log\"' findet man alle Log-Dateien im Verzeichnis /var und seinen Unterverzeichnissen."
        },

// sudo
        {
            question: "Welcher Befehl erlaubt es, Befehle mit Administratorrechten auszuführen?",
            answer: "sudo",
            hint: "Steht für 'superuser do'",
            explanation: "Mit 'sudo' (superuser do) führt man Befehle mit Administratorrechten aus, z.B. 'sudo apt update'."
        },

// chmod
        {
            question: "Welcher Befehl ändert die Zugriffsrechte von Dateien und Verzeichnissen?",
            answer: "chmod",
            hint: "Steht für 'change mode'",
            explanation: "Mit 'chmod' (change mode) ändert man die Zugriffsrechte von Dateien und Verzeichnissen, z.B. 'chmod 755 datei.sh'."
        },
        {
            question: "Welcher Befehl macht eine Datei für alle ausführbar?",
            answer: "chmod +x",
            acceptableAnswers: ["chmod +x", "chmod a+x"],
            hint: "Der Befehl zum Ändern von Rechten mit dem '+x' Parameter",
            explanation: "Mit 'chmod +x datei.sh' macht man eine Datei für alle Benutzer ausführbar."
        },

// chown
        {
            question: "Welcher Befehl ändert den Besitzer einer Datei?",
            answer: "chown",
            hint: "Steht für 'change owner'",
            explanation: "Mit 'chown' (change owner) ändert man den Besitzer einer Datei, z.B. 'chown benutzer:gruppe datei.txt'."
        },

// ps
        {
            question: "Welcher Befehl zeigt laufende Prozesse an?",
            answer: "ps",
            hint: "Steht für 'process status'",
            explanation: "Der Befehl 'ps' (process status) zeigt laufende Prozesse an."
        },
        {
            question: "Welcher Befehl zeigt alle laufenden Prozesse in einem benutzerfreundlichen, interaktiven Format an?",
            answer: "htop",
            acceptableAnswers: ["htop", "top"],
            hint: "Eine verbesserte Version von 'top'",
            explanation: "Der Befehl 'htop' zeigt alle laufenden Prozesse in einem benutzerfreundlichen, interaktiven Format an."
        },

// ifconfig
        {
            question: "Welcher klassische Befehl zeigt Netzwerkschnittstellen und ihre Konfiguration an?",
            answer: "ifconfig",
            hint: "Steht für 'interface configuration'",
            explanation: "Der Befehl 'ifconfig' zeigt Netzwerkschnittstellen und ihre Konfiguration an (in neueren Systemen durch 'ip addr' ersetzt)."
        },

// ping
        {
            question: "Welcher Befehl testet die Erreichbarkeit eines Hosts im Netzwerk?",
            answer: "ping",
            hint: "Benannt nach dem Geräusch eines Sonars",
            explanation: "Mit 'ping' testet man die Erreichbarkeit eines Hosts im Netzwerk, z.B. 'ping google.com'."
        },

// apt
        {
            question: "Welcher Befehl wird in Debian/Ubuntu zum Installieren von Software verwendet?",
            answer: "apt",
            acceptableAnswers: ["apt", "apt-get"],
            hint: "Steht für 'Advanced Package Tool'",
            explanation: "Mit 'apt' (Advanced Package Tool) installiert, aktualisiert und entfernt man Software in Debian/Ubuntu, z.B. 'apt install firefox'."
        },

// wget
        {
            question: "Welcher Befehl lädt Dateien aus dem Internet herunter?",
            answer: "wget",
            hint: "Steht für 'web get'",
            explanation: "Mit 'wget' lädt man Dateien aus dem Internet herunter, z.B. 'wget https://example.com/datei.zip'."
        },

// tar
        {
            question: "Welcher Befehl packt und entpackt Archive in Linux?",
            answer: "tar",
            hint: "Steht für 'tape archive'",
            explanation: "Mit 'tar' packt und entpackt man Archive, z.B. 'tar -xzf archiv.tar.gz'."
        },

// df
        {
            question: "Welcher Befehl zeigt den freien Speicherplatz auf allen gemounteten Dateisystemen an?",
            answer: "df",
            hint: "Steht für 'disk free'",
            explanation: "Der Befehl 'df' (disk free) zeigt den freien Speicherplatz auf allen gemounteten Dateisystemen an."
        },

// du
        {
            question: "Welcher Befehl zeigt die Größe von Verzeichnissen und Dateien an?",
            answer: "du",
            hint: "Steht für 'disk usage'",
            explanation: "Der Befehl 'du' (disk usage) zeigt die Größe von Verzeichnissen und Dateien an, z.B. 'du -sh /home'."
        },

// whoami
        {
            question: "Welcher Befehl zeigt den Namen des aktuell angemeldeten Benutzers an?",
            answer: "whoami",
            hint: "Eine Frage, die der Computer beantworten kann: 'Wer bin ich?'",
            explanation: "Der Befehl 'whoami' zeigt den Namen des aktuell angemeldeten Benutzers an."
        },

// uname
        {
            question: "Welcher Befehl zeigt Informationen über das Betriebssystem an?",
            answer: "uname",
            hint: "Steht für 'Unix name'",
            explanation: "Der Befehl 'uname' zeigt Informationen über das Betriebssystem an, z.B. 'uname -a' für alle Informationen."
        },

        {
            question: "Welcher Befehl wird verwendet, um bestimmte Spalten aus einer Textdatei zu extrahieren?",
            answer: "cut",
            hint: "Der Name beschreibt die Funktion - etwas 'ausschneiden'",
            explanation: "Mit 'cut' kann man bestimmte Spalten oder Felder aus einer Textdatei extrahieren, z.B. 'cut -d':' -f1 /etc/passwd'."
        },

        // su
        {
            question: "Welcher Befehl erlaubt es, den Benutzer zu wechseln?",
            answer: "su",
            hint: "Steht für 'substitute user' oder 'switch user'",
            explanation: "Mit 'su' (substitute user) wechselt man den Benutzer, z.B. 'su root' um zum Root-Benutzer zu wechseln."
        },

        // chgrp
        {
            question: "Welcher Befehl ändert die Gruppe einer Datei?",
            answer: "chgrp",
            hint: "Steht für 'change group'",
            explanation: "Mit 'chgrp' (change group) ändert man die Gruppe einer Datei, z.B. 'chgrp entwickler projekt.txt'."
        },

        // passwd
        {
            question: "Welcher Befehl wird verwendet, um das Passwort eines Benutzers zu ändern?",
            answer: "passwd",
            hint: "Abgeleitet von 'password'",
            explanation: "Mit 'passwd' ändert man das Passwort eines Benutzers, z.B. 'passwd' für das eigene oder 'sudo passwd benutzer' für andere Benutzer."
        },

        // useradd
        {
            question: "Welcher Befehl erstellt einen neuen Benutzer im System?",
            answer: "useradd",
            hint: "Der Name beschreibt die Funktion - einen Benutzer hinzufügen",
            explanation: "Mit 'useradd' erstellt man einen neuen Benutzer, z.B. 'sudo useradd -m neuerbenutzer'."
        },

        // alias
        {
            question: "Welcher Befehl erstellt Kurznamen für andere Befehle?",
            answer: "alias",
            hint: "Ein anderer Name für etwas oder jemanden",
            explanation: "Mit 'alias' erstellt man Kurznamen für andere Befehle, z.B. 'alias ll='ls -la''."
        },

        // echo
        {
            question: "Welcher Befehl gibt Text auf dem Terminal aus?",
            answer: "echo",
            hint: "Wie ein Echo, das zurückkommt",
            explanation: "Der Befehl 'echo' gibt Text auf dem Terminal aus, z.B. 'echo Hallo Welt'."
        },

        // date
        {
            question: "Welcher Befehl zeigt das aktuelle Datum und die Uhrzeit an?",
            answer: "date",
            hint: "Das englische Wort für 'Datum'",
            explanation: "Der Befehl 'date' zeigt das aktuelle Datum und die Uhrzeit an."
        },

        // lscpu
        {
            question: "Welcher Befehl zeigt detaillierte Informationen über die CPU an?",
            answer: "lscpu",
            hint: "Kombination aus 'ls' (list) und 'cpu'",
            explanation: "Der Befehl 'lscpu' zeigt detaillierte Informationen über die CPU(s) des Systems an."
        },

        // hostname
        {
            question: "Welcher Befehl zeigt den Namen des Computers im Netzwerk an?",
            answer: "hostname",
            hint: "Der Name sagt es schon - der 'Name des Hosts'",
            explanation: "Der Befehl 'hostname' zeigt den Namen des Computers im Netzwerk an oder ändert ihn."
        },

        // who
        {
            question: "Welcher Befehl zeigt an, welche Benutzer aktuell am System angemeldet sind?",
            answer: "who",
            hint: "Fragt: 'Wer ist angemeldet?'",
            explanation: "Der Befehl 'who' zeigt an, welche Benutzer aktuell am System angemeldet sind."
        },

        // finger
        {
            question: "Welcher Befehl zeigt detaillierte Informationen über Benutzer an?",
            answer: "finger",
            hint: "Wie wenn man mit dem Finger auf jemanden zeigt",
            explanation: "Der Befehl 'finger' zeigt detaillierte Informationen über Benutzer an, z.B. 'finger benutzer'."
        },

        // ufw
        {
            question: "Welcher Befehl ist eine benutzerfreundliche Schnittstelle zur Firewall-Konfiguration?",
            answer: "ufw",
            hint: "Steht für 'Uncomplicated Firewall'",
            explanation: "Der Befehl 'ufw' (Uncomplicated Firewall) ist eine benutzerfreundliche Schnittstelle zur Firewall-Konfiguration."
        },

        // iptables
        {
            question: "Welcher Befehl konfiguriert die Firewall-Regeln direkt im Linux-Kernel?",
            answer: "iptables",
            hint: "Besteht aus 'ip' und 'tables' - Tabellen für IP-Regeln",
            explanation: "Mit 'iptables' konfiguriert man die Firewall-Regeln direkt im Linux-Kernel, z.B. 'iptables -A INPUT -p tcp --dport 22 -j ACCEPT'."
        },

        // systemctl
        {
            question: "Welcher Befehl verwaltet Systemdienste in modernen Linux-Distributionen?",
            answer: "systemctl",
            hint: "Steht für 'system control'",
            explanation: "Mit 'systemctl' verwaltet man Systemdienste, z.B. 'systemctl start apache2' um den Apache-Webserver zu starten."
        },

        // curl
        {
            question: "Welcher Befehl überträgt Daten von oder zu einem Server?",
            answer: "curl",
            hint: "Steht für 'Client URL'",
            explanation: "Mit 'curl' überträgt man Daten von oder zu einem Server, z.B. 'curl https://example.com'."
        },

        // dig
        {
            question: "Welcher Befehl fragt DNS-Informationen ab?",
            answer: "dig",
            hint: "Wie 'graben' (dig) nach Informationen",
            explanation: "Mit 'dig' fragt man DNS-Informationen ab, z.B. 'dig example.com' um die IP-Adresse einer Domain zu erfahren."
        },

        // dd
        {
            question: "Welcher Befehl kopiert und konvertiert Dateien auf niedriger Ebene?",
            answer: "dd",
            hint: "Ursprünglich 'data duplicator' oder 'disk dump'",
            explanation: "Mit 'dd' kopiert und konvertiert man Dateien auf niedriger Ebene, z.B. 'dd if=/dev/sda of=backup.img'."
        },

        // kill
        {
            question: "Welcher Befehl beendet einen laufenden Prozess?",
            answer: "kill",
            hint: "Der englische Begriff für 'töten' oder 'beenden'",
            explanation: "Mit 'kill' beendet man einen laufenden Prozess, z.B. 'kill 1234' um den Prozess mit der ID 1234 zu beenden."
        },

        // arp
        {
            question: "Welcher Befehl zeigt und verwaltet die ARP-Tabelle des Systems?",
            answer: "arp",
            hint: "Steht für 'Address Resolution Protocol'",
            explanation: "Der Befehl 'arp' zeigt und verwaltet die ARP-Tabelle, die IP-Adressen zu MAC-Adressen zuordnet."
        },

        // ss
        {
            question: "Welcher moderne Befehl zeigt Netzwerkverbindungen an (Ersatz für netstat)?",
            answer: "ss",
            hint: "Steht für 'socket statistics'",
            explanation: "Der Befehl 'ss' zeigt Netzwerkverbindungen und Socket-Informationen an und ist der moderne Ersatz für netstat."
        },

        // vi/vim
        {
            question: "Welcher klassische Texteditor ist in fast jedem Unix/Linux-System verfügbar?",
            answer: "vi",
            acceptableAnswers: ["vi", "vim"],
            hint: "Steht für 'visual editor' oder 'vi improved'",
            explanation: "Vi/Vim ist ein leistungsstarker Texteditor, der in fast jedem Unix/Linux-System verfügbar ist."
        },

        // grep
        {
            question: "Welcher Befehl durchsucht Dateien nach bestimmten Textmustern?",
            answer: "grep",
            hint: "Ursprünglich ein Befehl aus dem ed-Editor: g/re/p (global/regular expression/print)",
            explanation: "Mit 'grep' durchsucht man Dateien nach Textmustern, z.B. 'grep 'Fehler' logdatei.txt'."
        },

        // sed
        {
            question: "Welcher Befehl bearbeitet Textströme und führt Transformationen durch?",
            answer: "sed",
            hint: "Steht für 'stream editor'",
            explanation: "Mit 'sed' bearbeitet man Textströme, z.B. 'sed 's/alt/neu/g' datei.txt' ersetzt alle Vorkommen von 'alt' durch 'neu'."
        },

        // awk
        {
            question: "Welcher Befehl ist eine mächtige Programmiersprache zur Textverarbeitung?",
            answer: "awk",
            hint: "Benannt nach den Initialen seiner Entwickler (Aho, Weinberger, Kernighan)",
            explanation: "AWK ist eine mächtige Programmiersprache zur Textverarbeitung, z.B. 'awk '{print $1}' datei.txt' gibt die erste Spalte aus."
        },

        // scp
        {
            question: "Welcher Befehl kopiert Dateien sicher zwischen Hosts über SSH?",
            answer: "scp",
            hint: "Steht für 'secure copy'",
            explanation: "Mit 'scp' kopiert man Dateien sicher zwischen Hosts, z.B. 'scp datei.txt benutzer@server:/ziel/'."
        },

        // rsync
        {
            question: "Welcher Befehl synchronisiert Dateien und Verzeichnisse effizient?",
            answer: "rsync",
            hint: "Steht für 'remote synchronization'",
            explanation: "Mit 'rsync' synchronisiert man Dateien und Verzeichnisse effizient, z.B. 'rsync -av quelle/ ziel/'."
        },

        // crontab
        {
            question: "Welcher Befehl verwaltet geplante Aufgaben, die regelmäßig ausgeführt werden sollen?",
            answer: "crontab",
            hint: "Von 'chronos' (Zeit) und 'table' (Tabelle)",
            explanation: "Mit 'crontab' verwaltet man geplante Aufgaben, z.B. 'crontab -e' um den Editor zu öffnen."
        },

        // gzip
        {
            question: "Welcher Befehl komprimiert Dateien im gzip-Format?",
            answer: "gzip",
            hint: "Der Name des Komprimierungsformats",
            explanation: "Mit 'gzip' komprimiert man Dateien, z.B. 'gzip datei.txt' erzeugt datei.txt.gz."
        },

        // ln
        {
            question: "Welcher Befehl erstellt Links (Verknüpfungen) zwischen Dateien?",
            answer: "ln",
            hint: "Kurz für 'link'",
            explanation: "Mit 'ln' erstellt man Links zwischen Dateien, z.B. 'ln -s ziel verknüpfung' für einen symbolischen Link."
        },

        // diff
        {
            question: "Welcher Befehl zeigt die Unterschiede zwischen zwei Dateien an?",
            answer: "diff",
            hint: "Kurz für 'difference'",
            explanation: "Mit 'diff' vergleicht man Dateien und zeigt die Unterschiede an, z.B. 'diff datei1.txt datei2.txt'."
        },

        // sort
        {
            question: "Welcher Befehl sortiert die Zeilen einer Textdatei?",
            answer: "sort",
            hint: "Der englische Begriff für 'sortieren'",
            explanation: "Mit 'sort' sortiert man die Zeilen einer Textdatei, z.B. 'sort namen.txt'."
        },

        // uniq
        {
            question: "Welcher Befehl filtert wiederholte Zeilen aus einer sortierten Datei?",
            answer: "uniq",
            hint: "Kurz für 'unique' (einzigartig)",
            explanation: "Mit 'uniq' filtert man wiederholte Zeilen aus einer sortierten Datei, z.B. 'sort datei.txt | uniq'."
        },

        // wc
        {
            question: "Welcher Befehl zählt Zeilen, Wörter und Zeichen in einer Datei?",
            answer: "wc",
            hint: "Steht für 'word count'",
            explanation: "Der Befehl 'wc' zählt Zeilen, Wörter und Zeichen in einer Datei, z.B. 'wc -l datei.txt' für die Zeilenanzahl."
        },

        // head
        {
            question: "Welcher Befehl zeigt die ersten Zeilen einer Datei an?",
            answer: "head",
            hint: "Der englische Begriff für 'Kopf' oder 'Anfang'",
            explanation: "Mit 'head' zeigt man die ersten Zeilen einer Datei an, z.B. 'head -n 10 datei.txt' für die ersten 10 Zeilen."
        },

        // tail
        {
            question: "Welcher Befehl zeigt die letzten Zeilen einer Datei an?",
            answer: "tail",
            hint: "Der englische Begriff für 'Schwanz' oder 'Ende'",
            explanation: "Mit 'tail' zeigt man die letzten Zeilen einer Datei an, z.B. 'tail -n 10 datei.txt' für die letzten 10 Zeilen."
        },

        // less
        {
            question: "Welcher Befehl zeigt den Inhalt einer Datei seitenweise an?",
            answer: "less",
            hint: "Das Gegenteil von 'more'",
            explanation: "Mit 'less' zeigt man den Inhalt einer Datei seitenweise an und kann vor- und zurückblättern, z.B. 'less datei.txt'."
        },

        // mount
        {
            question: "Welcher Befehl hängt Dateisysteme in den Verzeichnisbaum ein?",
            answer: "mount",
            hint: "Der englische Begriff für 'montieren' oder 'einhängen'",
            explanation: "Mit 'mount' hängt man Dateisysteme in den Verzeichnisbaum ein, z.B. 'mount /dev/sdb1 /mnt'."
        }
    ];

// Gesamtzahl der Fragen anzeigen
    totalQuestions.textContent = questions.length;

// Terminal-Input fokussieren
    terminalInput.focus();
    window.addEventListener('click', () => terminalInput.focus());

// Eingabe verarbeiten
    terminalInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            const input = terminalInput.value.trim();

            // Eingabe zum Terminal-Output hinzufügen
            addToTerminal(`<span class="prompt">user@linux:~$</span> ${input}`, 'message');

            // Eingabe verarbeiten
            processInput(input);

            // Input-Feld leeren
            terminalInput.value = '';
        }
    });

// Eingabe verarbeiten
    function processInput(input) {
        if (!quizStarted) {
// Befehle vor dem Quiz-Start
            switch (input.toLowerCase()) {
                case 'start':
                    startQuiz();
                    break;
                case 'help':
                    showHelp();
                    break;
                case 'clear':
                    clearTerminal();
                    break;
                case 'about':
                    showAbout();
                    break;
                default:
                    addToTerminal(`Befehl nicht gefunden: ${input}`, 'error');
                    addToTerminal('Tippe <span class="cmd">help</span> für eine Liste der verfügbaren Befehle.', 'info');
            }
        } else {
// Befehle während des Quiz
            switch (input.toLowerCase()) {
                case 'hint':
                    showHint();
                    break;
                case 'skip':
                    skipQuestion();
                    break;
                case 'exit':
                    endQuiz();
                    break;
                default:
                    // Antwort prüfen
                    checkAnswer(input);
            }
        }
    }

// Text zum Terminal-Output hinzufügen
    function addToTerminal(text, className = '') {
        const div = document.createElement('div');
        div.className = className;
        div.innerHTML = text;
        terminalOutput.appendChild(div);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

// Terminal leeren
    function clearTerminal() {
        terminalOutput.innerHTML = '';
        addToTerminal('<div class="welcome-message"><p>Tippe <span class="cmd">start</span> um zu beginnen oder <span class="cmd">help</span> für Hilfe.</p></div>');
    }

// Hilfe anzeigen
    function showHelp() {
        addToTerminal('<div class="command-output">Verfügbare Befehle:\n\n<span class="cmd">start</span> - Startet das Quiz\n<span class="cmd">help</span> - Zeigt diese Hilfe an\n<span class="cmd">clear</span> - Leert den Terminal-Bildschirm\n<span class="cmd">about</span> - Zeigt Informationen über das Quiz\n\nBefehle während des Quiz:\n\n<span class="cmd">hint</span> - Zeigt einen Hinweis zur aktuellen Frage\n<span class="cmd">skip</span> - Überspringt die aktuelle Frage\n<span class="cmd">exit</span> - Beendet das Quiz</div>', 'info');
    }

// Über das Quiz anzeigen
    function showAbout() {
        addToTerminal('<div class="command-output">Linux-Befehle-Quiz v1.0\n\nEin interaktives Quiz zum Lernen und Üben von Linux-Befehlen.\nDieses Quiz enthält ' + questions.length + ' Fragen zu grundlegenden Linux-Befehlen.\n\nViel Spaß beim Lernen!</div>', 'info');
    }

// Quiz starten
    function startQuiz() {
        if (quizStarted) return;

        quizStarted = true;
        currentQuestionIndex = -1;
        correctAnswers = 0;

// Zufällige Reihenfolge der Fragen
        shuffleQuestions();

        addToTerminal('Das Quiz beginnt! Beantworte die Fragen, indem du den entsprechenden Befehl eingibst.', 'info');
        addToTerminal('Tippe <span class="cmd">hint</span> für einen Hinweis oder <span class="cmd">skip</span> um eine Frage zu überspringen.', 'info');

// Fortschrittsanzeige zurücksetzen
        updateProgressBar();
        correctCount.textContent = '0';
        questionCount.textContent = '0';

// Erste Frage anzeigen
        nextQuestion();
    }

// Fragen mischen
    function shuffleQuestions() {
        for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]];
        }
    }

// Nächste Frage anzeigen
    function nextQuestion() {
        currentQuestionIndex++;

// Prüfen, ob das Quiz beendet ist
        if (currentQuestionIndex >= questions.length) {
            endQuiz();
            return;
        }

// Aktuelle Frage anzeigen
        const question = questions[currentQuestionIndex];
        addToTerminal(question.question, 'question');

// Fortschritt aktualisieren
        questionCount.textContent = currentQuestionIndex + 1;
        updateProgressBar();
    }

// Antwort prüfen
    function checkAnswer(input) {
        const question = questions[currentQuestionIndex];
        let isCorrect = false;

// Prüfen, ob die Antwort korrekt ist
        if (input.toLowerCase() === question.answer.toLowerCase()) {
            isCorrect = true;
        } else if (question.acceptableAnswers && question.acceptableAnswers.some(ans => input.toLowerCase() === ans.toLowerCase())) {
            isCorrect = true;
        }

        if (isCorrect) {
            addToTerminal('Richtig! ' + question.explanation, 'success');
            correctAnswers++;
            correctCount.textContent = correctAnswers;
            nextQuestion();
        } else {
            addToTerminal('Das ist nicht korrekt. Versuche es noch einmal oder tippe <span class="cmd">hint</span> für einen Hinweis.', 'error');
        }
    }

// Hinweis anzeigen
    function showHint() {
        if (currentQuestionIndex < 0 || currentQuestionIndex >= questions.length) return;

        const question = questions[currentQuestionIndex];
        addToTerminal('Hinweis: ' + question.hint, 'hint');
    }

// Frage überspringen
    function skipQuestion() {
        if (currentQuestionIndex < 0 || currentQuestionIndex >= questions.length) return;

        const question = questions[currentQuestionIndex];
        addToTerminal('Frage übersprungen. Die richtige Antwort wäre: ' + question.answer, 'info');
        addToTerminal(question.explanation, 'info');
        nextQuestion();
    }

// Quiz beenden
    function endQuiz() {
        quizStarted = false;
        currentQuestionIndex = -1;

// Ergebnis anzeigen
        const percentage = Math.round((correctAnswers / questions.length) * 100);
        let resultMessage = `Quiz beendet! Dein Ergebnis: ${correctAnswers} von ${questions.length} (${percentage}%)`;

        addToTerminal(resultMessage, 'info');

// Bewertung je nach Ergebnis
        if (percentage >= 90) {
            addToTerminal('Hervorragend! Du bist ein Linux-Profi!', 'success');
        } else if (percentage >= 70) {
            addToTerminal('Gut gemacht! Du kennst dich gut mit Linux-Befehlen aus.', 'success');
        } else if (percentage >= 50) {
            addToTerminal('Nicht schlecht, aber da ist noch Luft nach oben.', 'info');
        } else {
            addToTerminal('Du solltest noch etwas mehr üben. Starte das Quiz erneut!', 'error');
        }

        addToTerminal('Tippe <span class="cmd">start</span> um das Quiz erneut zu starten.', 'info');

// Fortschrittsanzeige zurücksetzen
        updateProgressBar(100);
    }

// Fortschrittsanzeige aktualisieren
    function updateProgressBar(percent = null) {
        if (percent === null) {
// Berechne Prozentsatz basierend auf dem aktuellen Fortschritt
            percent = (currentQuestionIndex / questions.length) * 100;
        }
        progressBar.style.width = percent + '%';
    }
});