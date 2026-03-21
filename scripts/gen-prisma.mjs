import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const prismaClientFile = path.resolve('src/prisma/generated/client.js');

if (!existsSync(prismaClientFile)) {
    console.log('[prisma] generated client missing, running prisma generate...');

    const result = spawnSync('npx', ['prisma', 'generate', '--schema=src/prisma/schema.prisma'], {
        stdio: 'inherit',
    });

    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}
