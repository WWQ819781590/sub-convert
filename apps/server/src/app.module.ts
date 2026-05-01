import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigFileModule } from './config-file/config-file.module';

@Module({
  imports: [ConfigFileModule],
  controllers: [AppController],
})
export class AppModule {}
