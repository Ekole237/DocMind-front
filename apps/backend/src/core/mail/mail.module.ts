import { MAIL_SERVICE } from '#auth/domain/services/mail.service';
import { MailServiceImplementation } from '#auth/infrastructure/services/mail.service.implementation';
import { Module } from '@nestjs/common';

@Module({
  providers: [{ provide: MAIL_SERVICE, useClass: MailServiceImplementation }],
  exports: [MAIL_SERVICE],
})
export class MailModule {}
