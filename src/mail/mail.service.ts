import { MailerService } from '@nestjs-modules/mailer';
import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { MailModuleOptions } from './mail.interfaces';
import { SentMessageInfo } from 'nodemailer';

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
    private readonly mailerService: MailerService,
  ) {}

  async sendVerificationEmail(to: string): Promise<SentMessageInfo> {
    return await this.mailerService.sendMail({
      to,
      from: this.options.fromEmail,
      subject: 'Police-And-Thief 테스트 이메일입니다.',
      html: '<b>추후 emial validation에 사용됩니다.</b>',
    });
  }
}
