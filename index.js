"use strict";

const puppeteer = require("puppeteer");
const isJSON = require("is-json");
const fs = require("fs");
const transporter = require("./config/mailer");
const cron = require("node-cron");

cron.schedule("0 07 * * *", () => {
  (async () => {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    const dateouput = getDate();

    let rawdata = fs.readFileSync("wordsSearch.json");
    const wordsSearch = JSON.parse(rawdata);

    let concursos = [];

    for (let wordSearch of wordsSearch) {
    page.setDefaultNavigationTimeout(0);
      await page.goto(
        "https://www.guatecompras.gt/concursos/busquedaTexto.aspx?t=" +
          wordSearch,{
            waitUntil:'load',
            timeout:0
          }
      );

      await page.waitForSelector(".TablaFilaMix1");
      await page.waitForSelector(".TablaFilaMix2");

      concursos = await page.evaluate(
        (wordSearch, concursos) => {
          //Fechas que se muestran en la página
          const months = [
            "ene",
            "feb",
            "mar",
            "abr",
            "may",
            "jun",
            "jul",
            "ago",
            "sep",
            "oct",
            "nov",
            "dic",
          ];

          let date_ob = new Date();
          let date = ("0" + date_ob.getDate()).slice(-2);
          let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
          let year = date_ob.getFullYear();
          let dateToday = year + "-" + month + "-" + date;
          let oneDay = 1000 * 60 * 60 * 24;

          let dateYesterday = new Date(date_ob.getTime() - oneDay);
          date = ("0" + dateYesterday.getDate()).slice(-2);
          month = ("0" + (dateYesterday.getMonth() + 1)).slice(-2);
          year = dateYesterday.getFullYear();
          dateYesterday = year + "-" + month + "-" + date;

          console.log(dateToday);
          console.log(dateYesterday);

          //Se obtiene la información así, ya que las clases de las filas en los concursos son con clases diferentes.
          var elementsRow1 = document.getElementsByClassName("TablaFilaMix1");
          var elementsRow2 = document.querySelectorAll(".TablaFilaMix2");

          for (let element of elementsRow1) {
            let no_operacion = element.querySelector(
              'td div [title="NOG (Número de Operación Guatecompras)"]'
            ).innerHTML;
            let fecha_publicacion = element.querySelector(
              'td div [title="Fecha de publicación"]'
            ).innerHTML;
            let fecha_limite_oferta = element.querySelector(
              'td div [title="Fecha límite para ofertar"]'
            ).innerHTML;
            let titulo = element
              .querySelector('td div [title="Descripción del concurso"]')
              .innerHTML.replace("<br>", "")
              .replace("<b>", "")
              .replace("</b>", "");
            let estatus = element.querySelector(
              'td div [title="Estatus del concurso"]'
            ).innerHTML;
            let entidad_publica = element.querySelector(
              'td div [title="Entidad que publica"]'
            ).innerHTML;
            //Fecha convertida a formato: Y-m-d
            fecha_publicacion =
              fecha_publicacion.substring(8, 12) +
              "-" +
              (
                "0" +
                (months.indexOf(fecha_publicacion.substring(3, 6)) + 1)
              ).slice(-2) +
              "-" +
              fecha_publicacion.substring(-1, 2);
            fecha_limite_oferta =
              fecha_limite_oferta.substring(8, 12) +
              "-" +
              (
                "0" +
                (months.indexOf(fecha_limite_oferta.substring(3, 6)) + 1)
              ).slice(-2) +
              "-" +
              fecha_limite_oferta.substring(-1, 2);
            if (
              new Date(dateToday).getTime() ==
                new Date(fecha_publicacion).getTime() ||
              new Date(dateYesterday).getTime() ==
                new Date(fecha_publicacion).getTime()
            ) {
              concursos.push({
                wordSearch,
                no_operacion,
                fecha_publicacion,
                fecha_limite_oferta,
                titulo,
                estatus,
                entidad_publica
              });
            }
          }

          for (let element of elementsRow2) {
            let no_operacion = element.querySelector(
              'td div [title="NOG (Número de Operación Guatecompras)"]'
            ).innerHTML;
            let fecha_publicacion = element.querySelector(
              'td div [title="Fecha de publicación"]'
            ).innerHTML;
            let fecha_limite_oferta = element.querySelector(
              'td div [title="Fecha límite para ofertar"]'
            ).innerHTML;
            let titulo = element
              .querySelector('td div [title="Descripción del concurso"]')
              .innerHTML.replace("<br>", "")
              .replace("<b>", "")
              .replace("</b>", "");
            let estatus = element.querySelector(
              'td div [title="Estatus del concurso"]'
            ).innerHTML;
            let entidad_publica = element.querySelector(
              'td div [title="Entidad que publica"]'
            ).innerHTML;
            //Fecha convertida a formato: Y-m-d
            fecha_publicacion =
              fecha_publicacion.substring(8, 12) +
              "-" +
              (
                "0" +
                (months.indexOf(fecha_publicacion.substring(3, 6)) + 1)
              ).slice(-2) +
              "-" +
              fecha_publicacion.substring(-1, 2);
            fecha_limite_oferta =
              fecha_limite_oferta.substring(8, 12) +
              "-" +
              (
                "0" +
                (months.indexOf(fecha_limite_oferta.substring(3, 6)) + 1)
              ).slice(-2) +
              "-" +
              fecha_limite_oferta.substring(-1, 2);
            if (
              new Date(dateToday).getTime() ==
                new Date(fecha_publicacion).getTime() ||
              new Date(dateYesterday).getTime() ==
                new Date(fecha_publicacion).getTime()
            ) {
              concursos.push({
                wordSearch,
                no_operacion,
                fecha_publicacion,
                fecha_limite_oferta,
                titulo,
                estatus,
                entidad_publica,
              });
            }
          }
          return concursos;
        },
        wordSearch,
        concursos
      );
    }

    if (concursos.length > 0) {
      if (isJSON(JSON.stringify(concursos))) {
        transporter.sendEmail(concursos);
      } else {
        console.log("JSON Data is not valid");
      }
    } else {
      console.log("Sin concursos encontrados");
    }

    await browser.close();
  })();
});

var getDate = function () {
  let date_ob = new Date();
  let date = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();
  let dateToday = year + "-" + month + "-" + date;

  return dateToday;
};
