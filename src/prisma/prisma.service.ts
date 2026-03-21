import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from './generated/client.js';

const aFilename = fileURLToPath(import.meta.url);
const aDirname = path.dirname(aFilename);
const projectRoot = path.resolve(aDirname, '../../..');

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        const dbUrl = process.env['DATABASE_URL'] ?? 'file:./dev.db';
        const dbPath = path.resolve(projectRoot, dbUrl.replace(/^file:/, ''));
        Logger.debug(`Resolved database ${dbPath}`, 'App:PrismaService');
        const adapter = new PrismaBetterSqlite3({ url: dbPath });
        super({ adapter });
    }

    async onModuleInit(): Promise<void> {
        await this.$connect();
    }

    async onModuleDestroy(): Promise<void> {
        await this.$disconnect();
    }
}
