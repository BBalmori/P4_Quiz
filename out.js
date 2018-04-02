const readline = require('readline');
const figlet = require('figlet');
const chalk = require('chalk');
const net = require("net");

/**
* Dar color a un string.
*
* @param msg    El string al que hay que dar color.
* @param color  El color con el qie pintar msg.
* @returns {string}  Devuelve el string msg con el color indicado.
*/
const colorize = (msg, color) => {
    if (typeof color !== "undefined") {
        if (color === 'green') { msg = chalk.green(msg) }
        if (color === 'blue') { msg = chalk.blue(msg) }
        if (color === 'magenta') { msg = chalk.magenta(msg) }
        if (color === 'yellow') { msg = chalk.yellow(msg) }
        if (color === 'red') { msg = chalk.red(msg) }
    }
    return msg;
};

/**
* Dar color a un string.
*
* @param msg    El string a escribir.
* @param color  Color del texto.
*/
const log = (socket, msg, color) => {
    socket.write(colorize(msg, color) + "\n");
};

/**
* Escribe un mensaje de log grande.
*
* @param msg    El string a escribir.
* @param color  Color del texto.
*/
const biglog = (socket, msg, color) => {
    log(socket, figlet.textSync(msg, { horizontalLayout: 'full' }), color);
};

/**
* Escribe el mensaje de error emsg.
*
* @param emsg    Texto de mensaje de error.
*/
const errorlog = (socket, emsg) => {
    socket.write(`${colorize("Error", "red")}: ${colorize(colorize(emsg, "red"), "bigYellowBright")}\n`);////
};

exports = module.exports = {
    colorize,
    log,
    biglog,
    errorlog
};