
import Mailjet from 'node-mailjet';
import config from '../../config/config';
import logger from '../logger/logger';
import { Message } from './email.interfaces';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';


class EmailManagementService {
    private mailjet: Mailjet;
    constructor() {
        this.mailjet = new Mailjet({
            apiKey: config.email.smtp.auth.user,
            apiSecret: config.email.smtp.auth.pass,
        });
    }

    private async getTemplate(template: string, data: any): Promise<string> {
        let path = join(__dirname, 'templates/' + template + '.hbs');
        let fileExists = existsSync(path);
        let content = '';
        if (fileExists) {
            let contents = readFileSync(path, 'utf-8');
            for (var i in data) {
                var x = '{{' + i + '}}';
                while (contents.indexOf(x) > -1) {
                    // @ts-ignore
                    contents = contents.replace(x, data[i]);
                }
            }
            content = contents;
        }
        return content;
    }

    public async sendEmail({ to, template, templateVariables, subject }: Message): Promise<void> {
        try {
            const contents = await this.getTemplate(template, templateVariables);
            // Override email destination for local dev
            if (config.redisBaseKey && config.redisBaseKey.includes('LOCAL')) {
                const user = to.split('@')[0];
                to = `${user}@mailinator.com`;
            }
            const info = await this.mailjet.post('send', { version: 'v3.1' }).request({
                Messages: [
                    {
                        From: {
                            Email: config.email.from,
                            Name: 'Trackup',
                        },
                        To: [
                            {
                                Email: to,
                            },
                        ],
                        HTMLPart: contents,
                        Subject: subject,
                    },
                ],
            });
            logger.info(info);
        } catch (error) {
            logger.error(error);
        }
    }

    public sendOrganizationInvitationEmail = async (
        to: string,
        firstName: string,
        organizationName: string,
        token: string,
        senderName: string,
        senderAvatar: string
    ): Promise<void> => {
        await this.sendEmail({
            to,
            templateVariables: {
                firstName,
                teamName: organizationName,
                inviterName: senderName,
                inviterAvatar: senderAvatar,
                year: new Date().getFullYear().toString(),
                url: `${config.clientUrl}/onboarding?token=${token}`,
            },
            template: 'organization-invite',
            subject: 'You have been invited to join ' + organizationName,
        });
    }

    public sendProjectInvitationEmail = async (
        to: string,
        projectName: string,
        organizationName: string,
        token: string,
        senderName: string,
    ): Promise<void> => {
        await this.sendEmail({
            to,
            templateVariables: {
                projectName,
                teamName: organizationName,
                inviterName: senderName,
                year: new Date().getFullYear().toString(),
                url: `${config.clientUrl}/project-invitation?token=${token}`,
            },
            template: 'project-invite',
            subject: 'You have been invited to join ' + projectName,
        });
    }

    public sendOrganizationOnboardingEmail = async (
        to: string,
        organizationName: string,
        token: string
    ): Promise<void> => {
        await this.sendEmail({
            to,
            templateVariables: {
                organizationName,
                year: new Date().getFullYear().toString(),
                url: `${config.clientUrl}/onboarding?token=${token}`,
            },
            template: 'complete-onboarding-organization',
            subject: 'Complete your organization onboarding',
        });
    }

    public sendResetPasswordEmail = async (
        to: string,
        token: string,
    ): Promise<void> => {
        await this.sendEmail({
            to,
            templateVariables: {
                year: new Date().getFullYear().toString(),
                url: `${config.clientUrl}/reset-password?token=${token}`,
            },
            template: 'reset-password',
            subject: 'Reset your password',
        });
    }
}

export const emailManagementService = new EmailManagementService();