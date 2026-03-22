import { Global, Module } from '@nestjs/common';
import { UtilityModule } from '../utility/utility.module';
import { LoggerController } from './logger.controller';
import { AppLoggerService } from './logger.service';
import { SyslogService } from './syslog.service';

@Global()
@Module({
  imports: [UtilityModule],
  providers: [AppLoggerService, SyslogService],
  controllers: [LoggerController],
  exports: [AppLoggerService, SyslogService],
})
export class AppLoggerModule {}
