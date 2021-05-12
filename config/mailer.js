var nodemailer = require('nodemailer');
require('dotenv/config');

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL || 'eliusincalj@gmail.com', // generated ethereal user
        pass: process.env.PASSWORD || 'runnmbfbxqhhmujv', // generated ethereal password
    },
});

transporter.verify().then(()=>{
    console.log("Ready for send emails");
});

function sendEmail (htmlToSend, excelouput){
    try{
        transporter.sendMail({
            from: '"Concursos Guatecompras" <eliuzincal450@gmail.com>', // sender address
            to: "esincal@dxlatam.com", // list of receivers
            subject: "Concursos Guatecompras", // Subject line
            attachments: [{'filename': excelouput, 'path': __dirname + '//..//files//' +excelouput}],
            html: htmlToSend, // html body
          }, function(error, info){
              if(error){
                  console.log(error);
              }else{
                  console.log("Message sent succefull");
              }
          });
    }catch(error){
        console.log(error);
    }
}

module.exports = {
    "sendEmail" : sendEmail
}