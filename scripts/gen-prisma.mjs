import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptFile = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptFile);
const projectRoot = path.resolve(scriptDir, '..');

const prismaClientFile = path.resolve(projectRoot, 'src/prisma/generated/client.js');
const prismaSchemaFile = path.resolve(projectRoot, 'src/prisma/schema.prisma');

function runOrExit(command, args) {
    const result = spawnSync(command, args, {
        stdio: 'inherit',
        cwd: projectRoot,
    });

    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

if (!existsSync(prismaClientFile)) {
    console.log('[prisma] generated client missing, running prisma generate...');
    runOrExit('npx', ['prisma', 'generate', '--schema', prismaSchemaFile]);
}

console.log('[prisma] syncing database schema...');
runOrExit('npx', ['prisma', 'db', 'push', '--schema', prismaSchemaFile]);
