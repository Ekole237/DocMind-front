import { MailService } from '#auth/domain/services/mail.service';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import * as QRCode from 'qrcode';
import { Resend } from 'resend';

const MAGIC_LINK_SUBJECT = 'Votre lien de connexion — Assistant RH';
const GUEST_INVITATION_SUBJECT = 'Votre accès temporaire — Assistant RH';
const MAGIC_LINK_EXPIRATION_MINUTES = 15;

function parseBoolean(raw: string | undefined): boolean {
  if (!raw) {
    return false;
  }
  return ['1', 'true', 'yes', 'y', 'on'].includes(raw.trim().toLowerCase());
}

function normalizeBaseUrl(rawUrl: string): string {
  return rawUrl.trim().replace(/\/+$/, '');
}

function redact(text: string, secrets: string[]): string {
  if (!text) {
    return text;
  }

  return secrets
    .filter((secret) => secret && secret.length > 0)
    .reduce((acc, secret) => acc.split(secret).join('[REDACTED]'), text);
}

@Injectable()
export class MailServiceImplementation implements MailService, OnModuleInit {
  private readonly _logger = new Logger(MailServiceImplementation.name);

  private _appPublicUrl: string | null = null;
  private _mailFrom: string | null = null;

  private _resend: Resend | null = null;
  private _smtpTransporter: Transporter | null = null;

  constructor(private readonly _configService: ConfigService) {}

  onModuleInit(): void {
    const nodeEnv =
      this._configService.get<string>('NODE_ENV') ?? 'development';
    const isProd = nodeEnv === 'production';

    const appPublicUrlRaw = this._configService
      .get<string>('APP_PUBLIC_URL')
      ?.trim();
    const mailFromRaw = this._configService.get<string>('MAIL_FROM')?.trim();

    this._appPublicUrl = appPublicUrlRaw
      ? normalizeBaseUrl(appPublicUrlRaw)
      : null;
    this._mailFrom = mailFromRaw ?? null;

    const resendApiKey = this._configService
      .get<string>('RESEND_API_KEY')
      ?.trim();
    if (resendApiKey) {
      this._resend = new Resend(resendApiKey);
    }

    const smtpHost = this._configService.get<string>('SMTP_HOST')?.trim();
    const smtpPortRaw = this._configService.get<string>('SMTP_PORT')?.trim();

    if (smtpHost && smtpPortRaw) {
      const smtpPort = Number.parseInt(smtpPortRaw, 10);
      if (Number.isNaN(smtpPort) || smtpPort <= 0) {
        if (isProd) {
          throw new Error(
            '[Mail] Invalid SMTP_PORT (must be a positive integer).',
          );
        }
        this._logger.warn(
          '[Mail] Invalid SMTP_PORT (must be a positive integer). SMTP fallback disabled.',
        );
      } else {
        const smtpSecure = parseBoolean(
          this._configService.get<string>('SMTP_SECURE'),
        );
        const smtpUser = this._configService.get<string>('SMTP_USER')?.trim();
        const smtpPass = this._configService.get<string>('SMTP_PASS')?.trim();

        this._smtpTransporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth:
            smtpUser && smtpPass
              ? { user: smtpUser, pass: smtpPass }
              : undefined,
        });
      }
    }

    const hasTransport = Boolean(this._resend || this._smtpTransporter);
    const hasMandatoryConfig = Boolean(this._appPublicUrl && this._mailFrom);

    if (isProd) {
      const missing: string[] = [];

      if (!this._appPublicUrl) {
        missing.push('APP_PUBLIC_URL');
      }
      if (!this._mailFrom) {
        missing.push('MAIL_FROM');
      }
      if (!hasTransport) {
        missing.push('RESEND_API_KEY or SMTP_HOST/SMTP_PORT');
      }

      if (missing.length > 0) {
        throw new Error(
          `[Mail] Missing required configuration in production: ${missing.join(', ')}`,
        );
      }
      return;
    }

    if (!hasTransport) {
      this._logger.warn(
        '[Mail] No mail transport configured (RESEND_API_KEY or SMTP_HOST/SMTP_PORT missing). Emails are disabled.',
      );
    }
    if (!hasMandatoryConfig) {
      this._logger.warn(
        '[Mail] Missing APP_PUBLIC_URL or MAIL_FROM. Emails are disabled.',
      );
    }
  }

  async sendMagicLink(email: string, activateUrl: string): Promise<void> {
    if (!this._mailFrom) {
      return;
    }

    const text = [
      'Bonjour,',
      '',
      `Voici votre lien de connexion pour Assistant RH :`,
      activateUrl,
      '',
      `Ce lien expire dans ${MAGIC_LINK_EXPIRATION_MINUTES} minutes.`,
      `Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.`,
      '',
      '— Assistant RH',
      '',
    ].join('\n');

    const html = [
      '<p>Bonjour,</p>',
      '<p>Voici votre lien de connexion pour <strong>Assistant RH</strong> :</p>',
      `<p><a href="${activateUrl}">${activateUrl}</a></p>`,
      `<p>Ce lien expire dans ${MAGIC_LINK_EXPIRATION_MINUTES} minutes.</p>`,
      `<p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>`,
      '<p>— Assistant RH</p>',
    ].join('\n');

    const transportName = this._resend
      ? 'resend'
      : this._smtpTransporter
        ? 'smtp'
        : 'none';

    try {
      if (this._resend) {
        await this._resend.emails.send({
          from: this._mailFrom,
          to: email,
          subject: MAGIC_LINK_SUBJECT,
          text,
          html,
        });
        return;
      }

      if (this._smtpTransporter) {
        await this._smtpTransporter.sendMail({
          from: this._mailFrom,
          to: email,
          subject: MAGIC_LINK_SUBJECT,
          text,
          html,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const safeMessage = redact(message, [email, activateUrl]);

      this._logger.error(
        `[Mail] Failed to send magic link email via ${transportName}: ${safeMessage}`,
      );
    }
  }

  async sendGuestInvitation(
    email: string,
    firstName: string,
    activateUrl: string,
    expiresAt: Date,
  ): Promise<void> {
    if (!this._mailFrom) {
      return;
    }

    const expiresAtFormatted = expiresAt.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    let qrCodeDataUrl = '';
    try {
      qrCodeDataUrl = await QRCode.toDataURL(activateUrl, { width: 200 });
    } catch {
      this._logger.warn(
        '[Mail] Failed to generate QR code — sending without it.',
      );
    }

    const text = [
      `Bonjour ${firstName},`,
      '',
      "Votre accès temporaire à l'Assistant RH a été renouvelé.",
      '',
      "Voici votre lien d'activation (usage unique) :",
      activateUrl,
      '',
      `Cet accès expire le ${expiresAtFormatted}.`,
      'Si vous avez des difficultés, contactez votre administrateur.',
      '',
      '— Assistant RH',
    ].join('\n');

    const qrCodeImg = qrCodeDataUrl
      ? `<p style="margin-top:16px"><img src="${qrCodeDataUrl}" alt="QR Code d'activation" width="200" height="200" /></p>`
      : '';

    const html = [
      `<p>Bonjour <strong>${firstName}</strong>,</p>`,
      "<p>Votre accès temporaire à l'<strong>Assistant RH</strong> a été renouvelé.</p>",
      "<p>Voici votre lien d'activation (usage unique) :</p>",
      `<p><a href="${activateUrl}">${activateUrl}</a></p>`,
      qrCodeImg,
      `<p>Cet accès expire le <strong>${expiresAtFormatted}</strong>.</p>`,
      '<p>Si vous avez des difficultés, contactez votre administrateur.</p>',
      '<p>— Assistant RH</p>',
    ].join('\n');

    const transportName = this._resend
      ? 'resend'
      : this._smtpTransporter
        ? 'smtp'
        : 'none';

    try {
      if (this._resend) {
        await this._resend.emails.send({
          from: this._mailFrom,
          to: email,
          subject: GUEST_INVITATION_SUBJECT,
          text,
          html,
        });
        return;
      }

      if (this._smtpTransporter) {
        await this._smtpTransporter.sendMail({
          from: this._mailFrom,
          to: email,
          subject: GUEST_INVITATION_SUBJECT,
          text,
          html,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const safeMessage = redact(message, [email, activateUrl]);
      this._logger.error(
        `[Mail] Failed to send guest invitation email via ${transportName}: ${safeMessage}`,
      );
    }
  }
}
