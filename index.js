const nodemailer = require('nodemailer');
const puppeteer = require('puppeteer');
const isJSON = require('is-json');
const json2xls = require('json2xls');
const bodyParser = require('body-parser');
const fs = require('fs');
const { promisify } = require('util');
const handlebars = require('handlebars');


(async()=> {
    const browser = await puppeteer.launch({headless:true});
    const page = await browser.newPage();
    const wordSearch = 'oracle';

    await page.goto('https://www.guatecompras.gt/concursos/busquedaTexto.aspx?t='+wordSearch);

    await page.waitForSelector('.TablaFilaMix1');

    
    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let dateouput = (year + "-" + month + "-" + date);

    const concursos = await page.evaluate(()=>{
        //Fechas que se muestran en la página (Preguntar como obtenerlos fuera de la función);
        const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

        //Obtener la fecha actual (Preguntar cómo obtenerlos fuera de la función);
        let date_ob = new Date();
        let date = ("0" + date_ob.getDate()).slice(-2);
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        let year = date_ob.getFullYear();
        let dateWithFormat = (year + "-" + month + "-" + date);

        const elementsRow1 = document.querySelectorAll('.TablaFilaMix1');
        const elementsRow2 = document.querySelectorAll('.TablaFilaMix2');
        const elements1 = [];
        const elements2 = [];

        for(let element of elementsRow1){
            let no_operacion = element.querySelector('td div [title="NOG (Número de Operación Guatecompras)"]').innerHTML;
            let fecha_publicacion = element.querySelector('td div [title="Fecha de publicación"]').innerHTML;
            let fecha_limite_oferta = element.querySelector('td div [title="Fecha límite para ofertar"]').innerHTML;
            let titulo = element.querySelector('td div [title="Descripción del concurso"]').innerHTML.replace('<br>', '').replace('<b>', '').replace('</b>', '');
            let estatus = element.querySelector('td div [title="Estatus del concurso"]').innerHTML;
            //Fecha convertida a formato: Y-m-d
            fecha_publicacion = fecha_publicacion.substring(8, 12) + '-' + ('0'+(months.indexOf(fecha_publicacion.substring(3,6))+1)).slice(-2) + '-' + fecha_publicacion.substring(-1,2);
            fecha_limite_oferta = fecha_limite_oferta.substring(8, 12) + '-' + ('0'+(months.indexOf(fecha_limite_oferta.substring(3,6))+1)).slice(-2) + '-' + fecha_limite_oferta.substring(-1,2);
            if(new Date(dateWithFormat).getTime() == new Date(fecha_publicacion).getTime()){
                elements1.push({no_operacion, fecha_publicacion, fecha_limite_oferta, titulo, estatus});
            }
        }

        for(let element of elementsRow2){
            let no_operacion = element.querySelector('td div [title="NOG (Número de Operación Guatecompras)"]').innerHTML;
            let fecha_publicacion = element.querySelector('td div [title="Fecha de publicación"]').innerHTML;
            let fecha_limite_oferta = element.querySelector('td div [title="Fecha límite para ofertar"]').innerHTML;
            let titulo = element.querySelector('td div [title="Descripción del concurso"]').innerHTML.replace('<br>', '').replace('<b>', '').replace('</b>', '');
            let estatus = element.querySelector('td div [title="Estatus del concurso"]').innerHTML;
            //Fecha convertida a formato: Y-m-d
            fecha_publicacion = fecha_publicacion.substring(8, 12) + '-' + ('0'+(months.indexOf(fecha_publicacion.substring(3,6))+1)).slice(-2) + '-' + fecha_publicacion.substring(-1,2);
            fecha_limite_oferta = fecha_limite_oferta.substring(8, 12) + '-' + ('0'+(months.indexOf(fecha_limite_oferta.substring(3,6))+1)).slice(-2) + '-' + fecha_limite_oferta.substring(-1,2);
            if(new Date(dateWithFormat).getTime() == new Date(date).getTime()){
                elements2.push({no_operacion, fecha_publicacion, fecha_limite_oferta, titulo, estatus});
            }
        }
        
        const elements = elements1.concat(elements2);
        return elements;
    });

    console.log(concursos);
    var excelouput = "Concursos GuateCompras "+dateouput+".xlsx";
    if(concursos.length > 0){
        if(isJSON(JSON.stringify(concursos))){
            var xls = json2xls(concursos);
            fs.writeFileSync("./files/"+excelouput, xls, 'binary');

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


            const readFile = promisify(fs.readFile);
            let html = await readFile('./src/mail.html', 'utf8');
            let template = handlebars.compile(html);
            let data = {
                excelName: "./files/"+excelouput
            };
            let htmlToSend = template(data);

            try{
                transporter.sendMail({
                    from: '"Concursos Guatecompras" <eliuzincal450@gmail.com>', // sender address
                    to: "esincal@dxlatam.com", // list of receivers
                    subject: "Concursos Guatecompras", // Subject line
                    attachments: [{'filename': excelouput, 'path': __dirname + "/files/"+excelouput}],
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
            
        }else{
            console.log("JSON Data is not valid")
        }
    }

    await browser.close();
})();