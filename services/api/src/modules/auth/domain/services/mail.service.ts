export const MAIL_SERVICE = Symbol('MailService');

export interface MailService {
  sendMagicLink(email: string, activateUrl: string): Promise<void>;
  sendGuestInvitation(
    email: string,
    firstName: string,
    activateUrl: string,
    expiresAt: Date,
  ): Promise<void>;
}
