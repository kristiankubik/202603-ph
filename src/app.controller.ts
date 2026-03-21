import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { Public } from './decorators/public-route.decorator.js';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Public()
    @Get()
    getHello() {
        // return this.appService.getHello();
        return {};
    }

    @Get('me')
    getLoggedUser() {
        return {};
    }
}
