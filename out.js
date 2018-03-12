const readline = require('readline');
const figlet = require('figlet');
const chalk = require('chalk');

/**
* Dar color a un string.
*
* @param msg    El string al que hay que dar color.
* @param color  El color con el qie pintar msg.
* @returns {string}  Devuelve el string msg con el color indicado.
*/
const colorize = (msg, color) => {
    if (typeof color !== "undefined") {
        msg = chalk.blue(msg);
    }
    return msg;
};

/**
* Dar color a un string.
*
* @param msg    El string a escribir.
* @param color  Color del texto.
*/
const log = (msg, color) => {
    console.log(colorize(msg, color));
};

/**
* Escribe un mensaje de log grande.
*
* @param msg    El string a escribir.
* @param color  Color del texto.
*/
const biglog = (msg, color) => {
    log(figlet.textSync(msg, { horizontalLayout: 'full' }), color);
};

/**
* Escribe el mensaje de error emsg.
*
* @param emsg    Texto de mensaje de error.
*/
const errorlog = (emsg) => {
    console.log(`${colorize("Error", "red")}: ${colorize(colorize(emsg, "red"), "bigYellowBright")}`);////
};

exports = module.exports = {
    colorize,
    log,
    biglog,
    errorlog
};