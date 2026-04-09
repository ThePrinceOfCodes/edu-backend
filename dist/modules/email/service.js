"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailManagementService = void 0;
const node_mailjet_1 = __importDefault(require("node-mailjet"));
const config_1 = __importDefault(require("../../config/config"));
const logger_1 = __importDefault(require("../logger/logger"));
const path_1 = require("path");
const fs_1 = require("fs");
class EmailManagementService {
    constructor() {
        this.sendOrganizationInvitationEmail = async (to, firstName, organizationName, token, senderName, senderAvatar) => {
            await this.sendEmail({
                to,
                templateVariables: {
                    firstName,
                    teamName: organizationName,
                    inviterName: senderName,
                    inviterAvatar: senderAvatar,
                    year: new Date().getFullYear().toString(),
                    url: `${config_1.default.clientUrl}/onboarding?token=${token}`,
                },
                template: 'organization-invite',
                subject: 'You have been invited to join ' + organizationName,
            });
        };
        this.sendProjectInvitationEmail = async (to, projectName, organizationName, token, senderName) => {
            await this.sendEmail({
                to,
                templateVariables: {
                    projectName,
                    teamName: organizationName,
                    inviterName: senderName,
                    year: new Date().getFullYear().toString(),
                    url: `${config_1.default.clientUrl}/project-invitation?token=${token}`,
                },
                template: 'project-invite',
                subject: 'You have been invited to join ' + projectName,
            });
        };
        this.sendOrganizationOnboardingEmail = async (to, organizationName, token) => {
            await this.sendEmail({
                to,
                templateVariables: {
                    organizationName,
                    year: new Date().getFullYear().toString(),
                    url: `${config_1.default.clientUrl}/onboarding?token=${token}`,
                },
                template: 'complete-onboarding-organization',
                subject: 'Complete your organization onboarding',
            });
        };
        this.sendResetPasswordEmail = async (to, token) => {
            await this.sendEmail({
                to,
                templateVariables: {
                    year: new Date().getFullYear().toString(),
                    url: `${config_1.default.clientUrl}/reset-password?token=${token}`,
                },
                template: 'reset-password',
                subject: 'Reset your password',
            });
        };
        this.sendClientIntentAcknowledgement = async (to, name, company, message) => {
            await this.sendEmail({
                to,
                templateVariables: {
                    name,
                    company: company || 'Not provided',
                    message,
                    year: new Date().getFullYear().toString(),
                },
                template: 'client-intent-acknowledgement',
                subject: 'We received your request',
            });
        };
        this.mailjet = new node_mailjet_1.default({
            apiKey: config_1.default.email.smtp.auth.user,
            apiSecret: config_1.default.email.smtp.auth.pass,
        });
    }
    async getTemplate(template, data) {
        let path = (0, path_1.join)(__dirname, 'templates/' + template + '.hbs');
        let fileExists = (0, fs_1.existsSync)(path);
        let content = '';
        if (fileExists) {
            let contents = (0, fs_1.readFileSync)(path, 'utf-8');
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
    async sendEmail({ to, template, templateVariables, subject }) {
        try {
            const contents = await this.getTemplate(template, templateVariables);
            // Override email destination for local dev
            if (config_1.default.redisBaseKey && config_1.default.redisBaseKey.includes('LOCAL')) {
                const user = to.split('@')[0];
                to = `${user}@mailinator.com`;
            }
            const info = await this.mailjet.post('send', { version: 'v3.1' }).request({
                Messages: [
                    {
                        From: {
                            Email: config_1.default.email.from,
                            Name: 'Edt',
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
            logger_1.default.info(info);
        }
        catch (error) {
            logger_1.default.error(error);
        }
    }
}
exports.emailManagementService = new EmailManagementService();
//# sourceMappingURL=service.js.map