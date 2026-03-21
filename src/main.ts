import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import 'dotenv/config';
import { Server } from 'node:http';
import { Socket } from 'node:net';
import { AddressInfo } from 'net';
import { AppModule } from './app.module.js';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });
    const httpServer = app.getHttpServer() as Server;
    httpServer
        .setTimeout(30_000) //kill stale/half-open/otherwise-inactive requests
        .on('error', function (error: NodeJS.ErrnoException) {
            Logger.error('Connection Error!', 'App:HttpServer');
            console.error(error);

            if (error.code === 'EADDRINUSE') {
                Logger.error(`Port already in use`, 'App:HttpServer');
                process.exit(1);
            }
        })
        .on('connection', function (socket: Socket) {
            'use strict';
            socket.setNoDelay(true);
            socket.on('timeout', function () {
                Logger.debug('Socket timeout occured', 'App:HttpServer');
            });
        })
        .on('close', function () {
            Logger.debug('Server closed, do cleanup!', 'App:HttpServer');
        });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // strip unknown properties
            forbidNonWhitelisted: true,
            transform: true, // auto-transform payloads to DTO class instances
        }),
    );

    const server = (await app.listen(
        parseInt(process.env.PORT || '3000', 10),
        process.env.HOST ?? '127.0.0.1',
    )) as Server;

    function getAddress(server: Server): AddressInfo | null {
        const addr = server.address() as AddressInfo;
        return addr && typeof addr !== 'string' ? addr : null;
    }
    const addr = getAddress(server);
    Logger.verbose(`Maternity Reservation API is bind to: ${addr?.address}:${addr?.port})`, 'App');
}

bootstrap().catch((err) => {
    console.error(err);
    process.exit(1);
});
