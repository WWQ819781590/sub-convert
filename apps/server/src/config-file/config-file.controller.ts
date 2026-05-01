import { Controller, Get, Header, Query } from '@nestjs/common';
import { ConfigFileService } from './config-file.service';

@Controller('api/config')
export class ConfigFileController {
  constructor(private readonly configFileService: ConfigFileService) {}

  @Get()
  readConfig(@Query('file') file = 'config.json') {
    return this.configFileService.readJsonFile(file);
  }

  @Get('subscribe')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  convertSubscription(@Query('key') key: string) {
    return this.configFileService.convertSubscription(key);
  }
}
