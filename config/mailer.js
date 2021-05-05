var nodemailer = require('nodemailer');

// create reusable transporter object using the default SMTP transport
async function main() {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: 'eliusincalj@gmail.com', // generated ethereal user
            pass: 'runnmbfbxqhhmujv', // generated ethereal password
        },
    });

    transporter.verify().then(()=>{
        console.log("Ready for send emails");
    });
}