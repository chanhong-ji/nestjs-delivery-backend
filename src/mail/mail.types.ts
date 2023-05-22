export type MailModuleOptions = {
    apiKey: string;
    emailDomain: string;
};

export type EmailTemplate = 'verify-email' | 'welcome';

export type EmailVar = {
    key: string;
    value: string;
};
