const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendEmailSendgrid = async (options) => {
    const mailOptions = {
        from: process.env.SENDGRID_SENDER_EMAIL,
        to: options.email,
        subject: options.subject,
        text: options.message
    };

    await sgMail.send(mailOptions);
};