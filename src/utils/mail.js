import { text } from "express";
import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async(options)=>{
    const mailGenerator = new Mailgen({
        theme:"default",
        product:{
            name:"Task Manager",
            link:"https://taskmanagelink.com"
        }
    })

    const emailtextual = mailGenerator.generatePlaintext(options.mailgenContent)
    const emailHTML = mailGenerator.generate(options.mailgenContent)

    const transporter = nodemailer.createTransport({
        host:process.env.MAILTRAP_SMTP_HOST,
        port:process.env.MAILTRAP_SMTP_PORT,
        auth:{
            user:process.env.MAILTRAP_SMTP_USER,
            pass:process.env.MAILTRAP_SMTP_PASS
        }
    })

    const mail ={
        from:"ydvrajranjan07@gmail.com",
        to:options.email,
        subject:options.subject,
        text:emailtextual,
        html:emailHTML
    }

    try {
        await transporter.sendMail(mail)
    } catch (error) {
        console.error("Email service failed silently. make sure that you have provided your MAIL_TRAP credentials in the .env file")
        console.error("error : ",error)
    }
};





const emailVerificationMailgenContent = (username, verificationUrl) => {
    return {
        body: {
            name: username,
            intro: "Welcome to our App! we'are excited to have you on board.",
            action: {
                instructions: "To verify your email please click on the following button",
                button: {
                    color: "#22BC66",
                    text: "Verify your email",
                    link: verificationUrl
                },
            },
            outro: "Need help, or have some question? just reply to this nemail,we'd love top help."
        },
    };
}


const ForgotPasswordMailgenContent = (username, PasswordResetUrl) => {
    return {
        body: {
            name: username,
            intro: "we got a request to reset the password of your account",
            action: {
                instructions: "To reset the password click on the following button or link",
                button: {
                    color: "#22BC66",
                    text: "Reset Password",
                    link: PasswordResetUrl
                },
            },
            outro: "Need help, or have some question? just reply to this nemail,we'd love top help."
        },
    };
}


export {
    emailVerificationMailgenContent,
    ForgotPasswordMailgenContent,
    sendEmail
}