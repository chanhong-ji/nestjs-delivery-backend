export default () => ({
    database: {
        host: process.env.HOST,
        port: parseInt(process.env.PORT, 10) || 5432,
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        name: process.env.DATABASE_NAME,
        url: process.env.DATABASE_URL,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: parseInt(process.env.JWT_EXPIRESIN) || 60,
    },
    mailgun: {
        apiKey: process.env.MAILGUN_API_KEY,
        domainName: process.env.MAILGUN_DOMAIN_NAME,
    },
    test: {
        testEmail1: process.env.TEST_EMAIL_1,
        testEmail2: process.env.TEST_EMAIL_2,
    },
    service: {
        url: process.env.SERVICE_URL,
        port: parseInt(process.env.SERVICE_PORT) || 4000,
    },
    aws: {
        accessKey: process.env.AWS_ACCESS_KEY,
        secretKey: process.env.AWS_SECRET_KEY,
    },
});
