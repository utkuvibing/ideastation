import { execFileSync } from 'node:child_process';

const ports = [3000, 4096];
const currentPid = process.pid;

function listeningPids(port) {
  try {
    const output = execFileSync('netstat.exe', ['-ano', '-p', 'tcp'], {
      encoding: 'utf8',
      windowsHide: true,
    });
    const pids = new Set();
    for (const line of output.split(/\r?\n/)) {
      const columns = line.trim().split(/\s+/);
      if (columns.length < 5 || columns[0] !== 'TCP' || columns[3] !== 'LISTENING') continue;
      const address = columns[1];
      const addressPort = Number(address.slice(address.lastIndexOf(':') + 1));
      const pid = Number(columns[4]);
      if (addressPort === port && Number.isInteger(pid) && pid > 0 && pid !== currentPid) pids.add(pid);
    }
    return [...pids];
  } catch {
    return [];
  }
}

function wait(milliseconds) {
  const buffer = new SharedArrayBuffer(4);
  Atomics.wait(new Int32Array(buffer), 0, 0, milliseconds);
}

for (const port of ports) {
  const initialPids = listeningPids(port);
  for (const pid of initialPids) {
    try {
      execFileSync('taskkill.exe', ['/PID', String(pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });
    } catch {
      // The process may have exited between netstat and taskkill.
    }
  }
  for (let attempt = 0; attempt < 20 && listeningPids(port).length; attempt += 1) wait(100);
  const remainingPids = listeningPids(port);
  if (remainingPids.length) {
    console.error(`Port ${port} is still in use (PID ${remainingPids.join(', ')}).`);
    process.exit(1);
  }
  if (initialPids.length) console.log(`Freed port ${port}.`);
}
