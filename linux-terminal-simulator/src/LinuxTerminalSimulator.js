// LinuxTerminalSimulator.js
import React, {useEffect, useRef, useState} from 'react';
import './LinuxTerminalSimulator.css';

const LinuxTerminalSimulator = () => {
    const [input, setInput] = useState('');
    const [commandHistory, setCommandHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [output, setOutput] = useState([
        {type: 'info', text: 'Last login: Wed Mar 26 11:09:08 on ttys004'},
        {type: 'prompt', text: 'martin@MacBookPro ~ % '}
    ]);
    const inputRef = useRef(null);
    const terminalRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [output]);

    const commandExamples = {
        ls: {
            command: 'ls -la',
            output: [
                'total 88',
                'drwxr-xr-x  18 martin  staff   576 Mar 26 10:22 .',
                'drwxr-xr-x   6 martin  staff   192 Mar 25 17:33 ..',
                '-rw-r--r--   1 martin  staff  8196 Mar 26 09:15 .bash_history',
                'drwx------   4 martin  staff   128 Mar 25 21:34 .config',
                'drwxr-xr-x   3 martin  staff    96 Mar 20 08:45 .local',
                'drwxr-xr-x   4 martin  staff   128 Mar 19 12:01 .npm',
                'drwxr-xr-x   4 martin  staff   128 Mar 18 15:22 .ssh',
                'drwxr-xr-x   5 martin  staff   160 Mar 19 16:33 .vscode',
                'drwxr-xr-x   3 martin  staff    96 Mar 21 10:11 .zsh',
                '-rw-------   1 martin  staff  5204 Mar 26 11:09 .zsh_history',
                '-rw-r--r--   1 martin  staff   460 Mar 18 09:27 .zshrc',
                'drwxr-xr-x   4 martin  staff   128 Mar 19 14:55 Desktop',
                'drwxr-xr-x  10 martin  staff   320 Mar 26 09:33 Documents',
                'drwxr-xr-x  16 martin  staff   512 Mar 25 18:45 Downloads',
                'drwxr-xr-x  76 martin  staff  2432 Mar 22 07:58 Projects'
            ]
        },
        grep: {
            command: 'grep -r "systemctl" /etc/systemd/',
            output: [
                '/etc/systemd/system.conf:# See systemctl.log-level=help for details',
                '/etc/systemd/system.conf:# See systemctl.log-target=help for details',
                '/etc/systemd/system.conf:# See systemctl.log-color=help for details',
                '/etc/systemd/system.conf:# See systemctl.log-time=help for details'
            ]
        },
        find: {
            command: 'find ~/Documents -name "*.pdf" -type f -size +1M',
            output: [
                '/Users/martin/Documents/Rechnung_2024-03.pdf',
                '/Users/martin/Documents/Linux_Advanced_Guide.pdf',
                '/Users/martin/Documents/Steuer/Jahresabrechnung_2023.pdf'
            ]
        },
        ps: {
            command: 'ps aux | grep node',
            output: [
                'martin   2853  0.0  0.2  4258404  33224 s002  S+   10:42AM   0:00.73 node server.js',
                'martin   3521  2.1  1.3  5726544 213192 s004  S+   10:57AM   0:12.95 node /usr/local/bin/npm start',
                'martin   3529  0.0  0.9  5461428 149688 s004  S+   10:57AM   0:08.52 node /Users/martin/Projects/webapp/node_modules/.bin/react-scripts start',
                'martin   3954  0.0  0.0  4268596    716 s003  S+   11:08AM   0:00.00 grep node'
            ]
        },
        df: {
            command: 'df -h',
            output: [
                'Filesystem      Size   Used  Avail Capacity    iused    ifree %iused  Mounted on',
                '/dev/disk1s1   466Gi  382Gi   80Gi    83%  14526143 9223372 61%   /',
                'devfs          334Ki  334Ki    0Bi   100%      1157        0 100%   /dev',
                '/dev/disk1s4   466Gi  3.0Gi   80Gi     4%         5 9223372  0%    /private/var/vm',
                'map auto_home    0Bi    0Bi    0Bi   100%         0        0 100%   /System/Volumes/Data/home',
                '/dev/disk1s3   466Gi  895Mi   80Gi     2%        33 9223372  0%    /Volumes/Recovery'
            ]
        },
        netstat: {
            command: 'netstat -tuln',
            output: [
                'Active Internet connections (only servers)',
                'Proto Recv-Q Send-Q Local Address           Foreign Address         State',
                'tcp        0      0 127.0.0.1:3000          0.0.0.0:*               LISTEN',
                'tcp        0      0 127.0.0.1:27017         0.0.0.0:*               LISTEN',
                'tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN',
                'tcp6       0      0 ::1:3000                :::*                    LISTEN',
                'tcp6       0      0 :::80                   :::*                    LISTEN',
                'tcp6       0      0 :::22                   :::*                    LISTEN',
                'udp        0      0 0.0.0.0:68              0.0.0.0:*'
            ]
        },
        ip: {
            command: 'ip addr show',
            output: [
                '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000',
                '    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00',
                '    inet 127.0.0.1/8 scope host lo',
                '       valid_lft forever preferred_lft forever',
                '    inet6 ::1/128 scope host ',
                '       valid_lft forever preferred_lft forever',
                '2: en0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000',
                '    link/ether 8c:85:90:52:61:04 brd ff:ff:ff:ff:ff:ff',
                '    inet 192.168.1.105/24 brd 192.168.1.255 scope global dynamic noprefixroute en0',
                '       valid_lft 86386sec preferred_lft 86386sec',
                '    inet6 fe80::8c85:90ff:fe52:6104/64 scope link ',
                '       valid_lft forever preferred_lft forever'
            ]
        },
        systemctl: {
            command: 'systemctl status nginx',
            output: [
                '● nginx.service - A high performance web server and a reverse proxy server',
                '   Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)',
                '   Active: active (running) since Wed 2025-03-26 08:45:12 CET; 2h 24min ago',
                '     Docs: man:nginx(8)',
                '  Process: 1234 ExecStartPre=/usr/sbin/nginx -t -q -g daemon on; master_process on; (code=exited, status=0/SUCCESS)',
                '  Process: 1235 ExecStart=/usr/sbin/nginx -g daemon on; master_process on; (code=exited, status=0/SUCCESS)',
                ' Main PID: 1236 (nginx)',
                '    Tasks: 3 (limit: 4915)',
                '   Memory: 3.0M',
                '   CGroup: /system.slice/nginx.service',
                '           ├─1236 nginx: master process /usr/sbin/nginx -g daemon on; master_process on;',
                '           ├─1237 nginx: worker process',
                '           └─1238 nginx: worker process'
            ]
        },
        journalctl: {
            command: 'journalctl -u nginx -f',
            output: [
                '-- Logs begin at Mon 2025-03-24 09:21:46 CET. --',
                'Mar 26 08:45:12 hostname systemd[1]: Starting A high performance web server and a reverse proxy server...',
                'Mar 26 08:45:12 hostname systemd[1]: Started A high performance web server and a reverse proxy server.',
                'Mar 26 10:12:34 hostname nginx[1236]: 192.168.1.25 - - [26/Mar/2025:10:12:34 +0100] "GET / HTTP/1.1" 200 612 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"',
                'Mar 26 10:15:22 hostname nginx[1236]: 192.168.1.25 - - [26/Mar/2025:10:15:22 +0100] "GET /style.css HTTP/1.1" 200 1245 "http://example.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"',
                'Mar 26 11:08:45 hostname nginx[1236]: 192.168.1.30 - - [26/Mar/2025:11:08:45 +0100] "POST /api/login HTTP/1.1" 401 52 "http://example.com/login" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"'
            ]
        },
        tar: {
            command: 'tar -czvf backup.tar.gz Documents/',
            output: [
                'Documents/',
                'Documents/notes.txt',
                'Documents/project_plan.md',
                'Documents/Rechnung_2024-03.pdf',
                'Documents/Linux_Advanced_Guide.pdf',
                'Documents/Steuer/',
                'Documents/Steuer/Jahresabrechnung_2023.pdf',
                'Documents/Steuer/Belege/',
                'Documents/Steuer/Belege/Januar.pdf',
                'Documents/Steuer/Belege/Februar.pdf',
                'Documents/Steuer/Belege/März.pdf'
            ]
        },
        rsync: {
            command: 'rsync -avz --progress ~/Documents/ backup-server:/backup/martin/',
            output: [
                'sending incremental file list',
                'Documents/',
                '          0 100%    0.00kB/s    0:00:00 (xfr#1, to-chk=10/11)',
                'Documents/notes.txt',
                '        243 100%  237.30kB/s    0:00:00 (xfr#2, to-chk=9/11)',
                'Documents/project_plan.md',
                '       1,024 100%    0.98MB/s    0:00:00 (xfr#3, to-chk=8/11)',
                'Documents/Rechnung_2024-03.pdf',
                '   1,245,184 100%   58.14MB/s    0:00:00 (xfr#4, to-chk=7/11)',
                'Documents/Linux_Advanced_Guide.pdf',
                '   5,872,640 100%   85.27MB/s    0:00:00 (xfr#5, to-chk=6/11)',
                '',
                'sent 7,142,315 bytes  received 138 bytes  4,761,635.33 bytes/sec',
                'total size is 7,139,091  speedup is 1.00'
            ]
        },
        cd: {
            command: 'cd ~/Projects/webapp',
            output: [
                '# No output is produced when successfully changing directories'
            ]
        },
        pwd: {
            command: 'pwd',
            output: [
                '/Users/martin/Projects/webapp'
            ]
        },
        mkdir: {
            command: 'mkdir -p Projects/new-app/src',
            output: [
                '# No output is produced when successfully creating directories'
            ]
        },
        rm: {
            command: 'rm -rf old-project/',
            output: [
                '# No output is produced when successfully removing files or directories'
            ]
        },
        cp: {
            command: 'cp -r ~/Projects/webapp/src ~/Projects/backup/',
            output: [
                '# No output is produced when successfully copying files or directories'
            ]
        },
        mv: {
            command: 'mv old-name.txt new-name.txt',
            output: [
                '# No output is produced when successfully moving or renaming files'
            ]
        },
        touch: {
            command: 'touch index.html',
            output: [
                '# No output is produced when successfully creating an empty file or updating timestamp'
            ]
        },
        cat: {
            command: 'cat /etc/hosts',
            output: [
                '127.0.0.1       localhost',
                '::1             localhost',
                '127.0.1.1       martin-laptop',
                '',
                '# Development servers',
                '192.168.1.50    dev-server',
                '192.168.1.51    staging-server',
                '192.168.1.52    database'
            ]
        },
        head: {
            command: 'head -n 5 /var/log/syslog',
            output: [
                'Mar 26 08:00:01 martin-laptop CRON[1234]: (root) CMD (/usr/sbin/logrotate /etc/logrotate.conf)',
                'Mar 26 08:00:01 martin-laptop CRON[1235]: (martin) CMD (/home/martin/scripts/daily-backup.sh)',
                'Mar 26 08:05:32 martin-laptop kernel: [12345.678901] wlan0: authenticated',
                'Mar 26 08:05:32 martin-laptop kernel: [12345.679012] wlan0: associated',
                'Mar 26 08:10:05 martin-laptop systemd[1]: Starting Daily apt upgrade and clean activities...'
            ]
        },
        tail: {
            command: 'tail -f /var/log/nginx/access.log',
            output: [
                '192.168.1.25 - - [26/Mar/2025:11:20:34 +0100] "GET / HTTP/1.1" 200 612 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"',
                '192.168.1.25 - - [26/Mar/2025:11:20:36 +0100] "GET /style.css HTTP/1.1" 200 1245 "http://example.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"',
                '192.168.1.30 - - [26/Mar/2025:11:21:45 +0100] "POST /api/login HTTP/1.1" 200 52 "http://example.com/login" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"',
                '192.168.1.30 - - [26/Mar/2025:11:21:48 +0100] "GET /dashboard HTTP/1.1" 200 8542 "http://example.com/login" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"',
                '192.168.1.105 - - [26/Mar/2025:11:22:10 +0100] "GET /api/stats HTTP/1.1" 200 1823 "http://example.com/dashboard" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"'
            ]
        },
        chmod: {
            command: 'chmod -R 755 ~/Projects/webapp/scripts/',
            output: [
                '# No output is produced when successfully changing permissions'
            ]
        },
        chown: {
            command: 'chown -R martin:developers ~/Projects/shared/',
            output: [
                '# No output is produced when successfully changing ownership'
            ]
        },
        sudo: {
            command: 'sudo apt update',
            output: [
                'Hit:1 http://de.archive.ubuntu.com/ubuntu jammy InRelease',
                'Get:2 http://de.archive.ubuntu.com/ubuntu jammy-updates InRelease [119 kB]',
                'Get:3 http://de.archive.ubuntu.com/ubuntu jammy-backports InRelease [108 kB]',
                'Get:4 http://security.ubuntu.com/ubuntu jammy-security InRelease [110 kB]',
                'Get:5 http://de.archive.ubuntu.com/ubuntu jammy-updates/main amd64 Packages [1,134 kB]',
                'Fetched 1,471 kB in 2s (735 kB/s)',
                'Reading package lists... Done',
                'Building dependency tree... Done',
                'Reading state information... Done',
                '12 packages can be upgraded. Run \'apt list --upgradable\' to see them.'
            ]
        },
        top: {
            command: 'top',
            output: [
                'top - 11:30:25 up 3:45, 2 users, load average: 0.52, 0.58, 0.59',
                'Tasks: 256 total,   1 running, 255 sleeping,   0 stopped,   0 zombie',
                '%Cpu(s):  3.5 us,  1.2 sy,  0.0 ni, 94.8 id,  0.3 wa,  0.0 hi,  0.2 si,  0.0 st',
                'MiB Mem :  15872.8 total,   6540.2 free,   5246.3 used,   4086.3 buff/cache',
                'MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   9548.2 avail Mem',
                '',
                '  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND',
                ' 3521 martin    20   0 5726544 213192  28464 S   2.0   1.3   0:12.95 node',
                ' 1236 root      20   0  142344   3984   2788 S   0.3   0.0   0:00.45 nginx',
                ' 1852 martin    20   0 4258404  33224  15680 S   0.3   0.2   0:01.23 node',
                ' 1004 root      20   0  314016   9744   8624 S   0.0   0.1   0:00.89 systemd-journal',
                ' 1236 root      20   0   14216   9744   4512 S   0.0   0.1   0:01.22 sshd'
            ]
        },
        kill: {
            command: 'kill -9 3521',
            output: [
                '# No output is produced when successfully sending a signal to a process'
            ]
        },
        du: {
            command: 'du -h --max-depth=1 ~/Projects',
            output: [
                '45M     /Users/martin/Projects/website',
                '128M    /Users/martin/Projects/webapp',
                '236K    /Users/martin/Projects/scripts',
                '1.2G    /Users/martin/Projects/docker-images',
                '4.8G    /Users/martin/Projects/videos',
                '89M     /Users/martin/Projects/backend-api',
                '6.2G    /Users/martin/Projects'
            ]
        },
        wget: {
            command: 'wget https://example.com/sample-data.zip',
            output: [
                '--2025-03-26 11:35:42--  https://example.com/sample-data.zip',
                'Resolving example.com (example.com)... 93.184.216.34, 2606:2800:220:1:248:1893:25c8:1946',
                'Connecting to example.com (example.com)|93.184.216.34|:443... connected.',
                'HTTP request sent, awaiting response... 200 OK',
                'Length: 1458032 (1.4M) [application/zip]',
                'Saving to: \'sample-data.zip\'',
                '',
                'sample-data.zip     100%[===================>]   1.39M  1.15MB/s    in 1.2s',
                '',
                '2025-03-26 11:35:44 (1.15 MB/s) - \'sample-data.zip\' saved [1458032/1458032]'
            ]
        },
        curl: {
            command: 'curl -X POST -H "Content-Type: application/json" -d \'{"username":"martin","password":"secret"}\' https://api.example.com/login',
            output: [
                '{',
                '  "status": "success",',
                '  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoibWFydGluIiwiaWF0IjoxNzExNTMwNTQ0LCJleHAiOjE3MTE1MzQxNDR9",',
                '  "user": {',
                '    "id": 12345,',
                '    "username": "martin",',
                '    "email": "martin@example.com",',
                '    "role": "developer"',
                '  }',
                '}'
            ]
        },
        ping: {
            command: 'ping -c 4 google.com',
            output: [
                'PING google.com (142.250.186.78) 56(84) bytes of data.',
                '64 bytes from fra16s49-in-f14.1e100.net (142.250.186.78): icmp_seq=1 ttl=118 time=14.8 ms',
                '64 bytes from fra16s49-in-f14.1e100.net (142.250.186.78): icmp_seq=2 ttl=118 time=15.2 ms',
                '64 bytes from fra16s49-in-f14.1e100.net (142.250.186.78): icmp_seq=3 ttl=118 time=14.5 ms',
                '64 bytes from fra16s49-in-f14.1e100.net (142.250.186.78): icmp_seq=4 ttl=118 time=14.9 ms',
                '',
                '--- google.com ping statistics ---',
                '4 packets transmitted, 4 received, 0% packet loss, time 3004ms',
                'rtt min/avg/max/mdev = 14.481/14.853/15.211/0.267 ms'
            ]
        },
        uname: {
            command: 'uname -a',
            output: [
                'Linux martin-laptop 5.15.0-89-generic #99-Ubuntu SMP Mon Feb 26 21:37:17 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux'
            ]
        },
        who: {
            command: 'who',
            output: [
                'martin   tty1         2025-03-26 08:30 (:0)',
                'martin   pts/0        2025-03-26 09:15 (:0)',
                'martin   pts/1        2025-03-26 10:42 (192.168.1.102)'
            ]
        },
        whoami: {
            command: 'whoami',
            output: [
                'martin'
            ]
        },
        history: {
            command: 'history',
            output: [
                '  997  cd ~/Projects/webapp',
                '  998  npm install',
                '  999  npm start',
                ' 1000  git pull origin main',
                ' 1001  git status',
                ' 1002  vim src/App.js',
                ' 1003  git add src/App.js',
                ' 1004  git commit -m "Fix navigation bug"',
                ' 1005  git push origin feature/nav-fix',
                ' 1006  npm test',
                ' 1007  docker-compose up -d',
                ' 1008  curl localhost:3000/api/health',
                ' 1009  tail -f logs/app.log',
                ' 1010  ps aux | grep node',
                ' 1011  history'
            ]
        },
        date: {
            command: 'date',
            output: [
                'Wed Mar 26 11:42:15 CET 2025'
            ]
        },
        crontab: {
            command: 'crontab -l',
            output: [
                '# Run daily backup at 1 AM',
                '0 1 * * * /home/martin/scripts/backup.sh',
                '',
                '# Check for updates every 4 hours',
                '0 */4 * * * /home/martin/scripts/check-updates.sh',
                '',
                '# Clean temp files every Sunday at 2 AM',
                '0 2 * * 0 /home/martin/scripts/clean-temp.sh',
                '',
                '# Restart application server at midnight',
                '0 0 * * * /home/martin/scripts/restart-app.sh'
            ]
        },
        apt: {
            command: 'apt list --upgradable',
            output: [
                'Listing... Done',
                'firefox/jammy-security 124.0+build1-0ubuntu0.22.04.1 amd64 [upgradable from: 123.0.1+build1-0ubuntu0.22.04.1]',
                'libssl3/jammy-security 3.0.2-0ubuntu1.12 amd64 [upgradable from: 3.0.2-0ubuntu1.11]',
                'nodejs/jammy 18.19.1-1nodesource1 amd64 [upgradable from: 18.19.0-1nodesource1]',
                'python3-cryptography/jammy-security 3.4.8-1ubuntu2.2 amd64 [upgradable from: 3.4.8-1ubuntu2.1]',
                'snapd/jammy-updates 2.64.2+22.04 amd64 [upgradable from: 2.64.1+22.04]'
            ]
        },
        useradd: {
            command: 'sudo useradd -m -s /bin/bash newuser',
            output: [
                '# No output is produced when successfully creating a user'
            ]
        },
        passwd: {
            command: 'sudo passwd newuser',
            output: [
                'New password: ',
                'Retype new password: ',
                'passwd: password updated successfully'
            ]
        },
        ln: {
            command: 'ln -s /usr/bin/python3 ~/bin/python',
            output: [
                '# No output is produced when successfully creating a symbolic link'
            ]
        },
        alias: {
            command: 'alias ll="ls -la"',
            output: [
                '# No output is produced when successfully creating an alias'
            ]
        },
        wc: {
            command: 'wc -l ~/Projects/webapp/src/**/*.js',
            output: [
                '   45 /Users/martin/Projects/webapp/src/App.js',
                '  102 /Users/martin/Projects/webapp/src/index.js',
                '   78 /Users/martin/Projects/webapp/src/components/Header.js',
                '  156 /Users/martin/Projects/webapp/src/components/Dashboard.js',
                '   89 /Users/martin/Projects/webapp/src/components/Footer.js',
                '  212 /Users/martin/Projects/webapp/src/utils/api.js',
                '   67 /Users/martin/Projects/webapp/src/utils/helpers.js',
                '  749 total'
            ]
        },
        sort: {
            command: 'sort -k2 -n data.txt',
            output: [
                'apple 12',
                'banana 15',
                'cherry 18',
                'date 23',
                'elderberry 45',
                'fig 52',
                'grape 67',
                'honeydew 89'
            ]
        },
        uniq: {
            command: 'sort logs.txt | uniq -c',
            output: [
                '      3 ERROR: Connection timed out',
                '      1 ERROR: Database connection failed',
                '     12 INFO: Request processed successfully',
                '      5 INFO: User logged in',
                '      4 WARNING: High memory usage detected',
                '      2 WARNING: Slow query execution'
            ]
        },
        diff: {
            command: 'diff -u file1.txt file2.txt',
            output: [
                '--- file1.txt  2025-03-26 11:50:20.000000000 +0100',
                '+++ file2.txt  2025-03-26 11:52:34.000000000 +0100',
                '@@ -1,7 +1,7 @@',
                ' # Configuration File',
                ' ',
                '-SERVER_URL=http://localhost:3000',
                '+SERVER_URL=https://api.example.com',
                ' DEBUG=false',
                ' LOG_LEVEL=info',
                '-MAX_CONNECTIONS=100',
                '+MAX_CONNECTIONS=200',
                ' TIMEOUT=30'
            ]
        },
        awk: {
            command: 'awk \'{print $1 " -> " $3}\' access.log',
            output: [
                '192.168.1.25 -> [26/Mar/2025:11:20:34',
                '192.168.1.25 -> [26/Mar/2025:11:20:36',
                '192.168.1.30 -> [26/Mar/2025:11:21:45',
                '192.168.1.30 -> [26/Mar/2025:11:21:48',
                '192.168.1.105 -> [26/Mar/2025:11:22:10'
            ]
        },
        sed: {
            command: 'sed -i \'s/localhost/example.com/g\' config.txt',
            output: [
                '# No output is produced when successfully modifying files with sed'
            ]
        },
        htop: {
            command: 'htop',
            output: [
                '  1[|||||                                                                 5.0%]   Tasks: 132, 364 thr; 1 running',
                '  2[|||                                                                   3.0%]   Load average: 0.52 0.58 0.59',
                '  3[||                                                                    2.0%]   Uptime: 03:45:34',
                '  4[||||                                                                  4.0%]',
                '  Mem[||||||||||||||||||||||||||||||                            6.23G/15.5G]',
                '  Swp[                                                           0K/2.00G]',
                '',
                '  PID USER     PRI  NI  VIRT   RES   SHR S CPU% MEM%   TIME+  Command',
                ' 3521 martin    20   0 5.46G  208M  27M S  2.0  1.3  0:12.95 node /usr/local/bin/npm start',
                ' 1236 root      20   0  142M  3.9M 2.7M S  0.3  0.0  0:00.45 nginx: master process',
                ' 1852 martin    20   0 4.06G 32.4M 15.3M S  0.3  0.2  0:01.23 node server.js',
                ' 1004 root      20   0  314M  9.5M 8.4M S  0.0  0.1  0:00.89 /lib/systemd/systemd-journald',
                ' 1236 root      20   0 14.2M  9.5M 4.4M S  0.0  0.1  0:01.22 sshd: martin [priv]',
                '  987 root      20   0 25.8M  8.2M 7.0M S  0.0  0.0  0:00.32 /lib/systemd/systemd-logind'
            ]
        },
        iptables: {
            command: 'sudo iptables -L',
            output: [
                'Chain INPUT (policy ACCEPT)',
                'target     prot opt source               destination',
                'ACCEPT     all  --  anywhere             anywhere             state RELATED,ESTABLISHED',
                'ACCEPT     icmp --  anywhere             anywhere',
                'ACCEPT     all  --  anywhere             anywhere',
                'ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:ssh',
                'ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:http',
                'ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:https',
                'DROP       all  --  anywhere             anywhere',
                '',
                'Chain FORWARD (policy ACCEPT)',
                'target     prot opt source               destination',
                '',
                'Chain OUTPUT (policy ACCEPT)',
                'target     prot opt source               destination'
            ]
        }
    };

    const handleCommand = (cmd) => {
        const commandParts = cmd.trim().split(' ');
        const mainCommand = commandParts[0];

        // Add to history and display the command
        setCommandHistory([...commandHistory, cmd]);

        // Create entry for command
        const newOutput = [
            ...output,
            {type: 'command', text: cmd}
        ];

        // Find example to show
        let commandOutput = [];

        // Check if this is one of our example commands
        if (mainCommand in commandExamples) {
            const example = commandExamples[mainCommand];

            // If the input command exactly matches an example, or we have no exact match, use this example
            if (cmd === example.command ||
                !Object.values(commandExamples).some(ex => ex.command === cmd)) {
                commandOutput = example.output;
            }
        }

        // Add output lines
        commandOutput.forEach(line => {
            newOutput.push({type: 'output', text: line});
        });

        // Add new prompt
        newOutput.push({type: 'prompt', text: 'martin@MacBookPro ~ % '});

        setOutput(newOutput);
        setInput('');
        setHistoryIndex(-1);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (input.trim()) {
                handleCommand(input);
            } else {
                // Just add a new prompt for empty input
                setOutput([
                    ...output,
                    {type: 'command', text: ''},
                    {type: 'prompt', text: 'martin@MacBookPro ~ % '}
                ]);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length > 0) {
                const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
                setHistoryIndex(newIndex);
                setInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setInput('');
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            // Simple tab completion could be added here
        }
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    const handleTerminalClick = () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    return (
        <div className="terminal-container">
            <div className="terminal-window">
                {/* Terminal header */}
                <div className="terminal-header">
                    <div className="terminal-buttons">
                        <div className="terminal-button red"></div>
                        <div className="terminal-button yellow"></div>
                        <div className="terminal-button green"></div>
                    </div>
                    <div className="terminal-title">
                        📁 martin — -zsh — 80×24
                    </div>
                </div>

                {/* Terminal content */}
                <div
                    ref={terminalRef}
                    className="terminal-content"
                    onClick={handleTerminalClick}
                >
                    {output.map((line, index) => (
                        <div key={index} className="terminal-line">
                            {line.type === 'prompt' && (
                                <span className="prompt-text">{line.text}</span>
                            )}
                            {line.type === 'command' && (
                                <span className="command-text">{line.text}</span>
                            )}
                            {line.type === 'output' && (
                                <span className="output-text">{line.text}</span>
                            )}
                            {line.type === 'info' && (
                                <span className="info-text">{line.text}</span>
                            )}
                            {line.type === 'prompt' && (
                                <span className="input-container">
                  {index === output.length - 1 && (
                      <span className="input-wrapper">
                      <input
                          ref={inputRef}
                          type="text"
                          value={input}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          className="terminal-input"
                          autoFocus
                      />
                      <span className="invisible">{input}</span>
                    </span>
                  )}
                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="suggestion-container">
                <h2 className="suggestion-title">Vorschläge zum Ausprobieren:</h2>
                <ul className="suggestion-list">
                    {Object.values(commandExamples).map((example, index) => (
                        <li key={index} className="suggestion-item">
                            <code className="command-code">{example.command}</code>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default LinuxTerminalSimulator;