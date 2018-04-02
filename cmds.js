const { log, biglog, errorlog, colorize } = require("./out");
const readline = require('readline');
const Sequelize = require('sequelize');
const {models} = require('./model');

/**
* Muestra la ayuda.
*
* @param rl Objeto readLine usado para implementar el CLI.
*/
exports.helpCmd = (socket, rl) => {
    log(socket, "Comandos:");
    log(socket, "  h|help - Muestra esta ayuda.");
    log(socket, "  list - Listar los quizzes existentes.");
    log(socket, "  show <id> - Muestra la pregunta y la respuesta el quiz indicado");
    log(socket, "  add - A�adir un nuevo quiz interactivamente");
    log(socket, "  delete <id> - Borrar el quiz indicado.");
    log(socket, "  edit <id> - Editar el quiz indicado");
    log(socket, "  test <id> - Probar el quiz indicado");
    log(socket, "  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log(socket, "  credits - Cr�ditos.");
    log(socket, "  q|quit - Salir del programa.");
    rl.prompt();
};

//Funciones auxiliares

/**
 * Esta funci�n devuelve una promesa que:
 * -Valida que se ha introducido un valor para el par�metro.
 * -Convierte el par�metro en un n�mero entero.
 * Si todo va bien, la promesa se satisface y devuelve el valor de id a usar.
 *
 * @param id    Par�metro con el �ndice a validar
 */
const validateId = id => {
    return new Sequelize.Promise((resolve, reject) => {
        if (typeof id === "undefined") {
            reject(new Error(`Falta el par�metro <id>.`));
        } else {
            id = parseInt(id);
            if (Number.isNaN(id)) {
                reject(new Error(`El valor del par�metro <id> no es un n�mero.`));
            } else {
                resolve(id);
            }
        }
    });
};

/**
 * Esta funci�n devuelve una promesaque cuando se cumple, proporciona el texto introducido,
 * entoces la llamada a then que hay que hacer la promesa devuelta ser�:
 *      .then(answer => {...})
 * Tambi�n colorea enrojo el texto de la pregunta y elimina espacios al principio y al final.
 * 
 * @param rl    Objeto readline usado para implementarel CLI.
 * @param text  Pregunta que hay que hacerle al usuario.
 */
const makeQuestion = (rl, text) => {
    return new Sequelize.Promise((resolve, reject) => {
        rl.question(colorize(text, 'red'), answer => {
            resolve(answer.trim());
        });
    });
};

//Comandos

/**
 * Lista todos los quizzes existentes en el modelo.
 *
 * @param rl Objeto readLine usado para implementar el CLI.
 */
exports.listCmd = (socket, rl) => {
    models.quiz.findAll()
        .each(quiz => {
            log(socket, `[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

/**
 * Muestra el quiz indicado en el par�metro: la pregunta y la respuesta.
 *
 * @param id   Clave del quiz a mostrar.
 * @param rl Objeto readLine usado para implementar el CLI.
 */
exports.showCmd = (socket, rl, id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al is=${id}.`);
            }
            log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

/**
 * A�ade un nuevo quiz al modelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 *
 * Hay que recordar que el funcionamiento de la funcion rl.question es as�ncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacci�n con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 *
 * @param rl Objeto readLine usado para implementar el CLI.
 */
exports.addCmd = (socket, rl) => {
    makeQuestion(rl, 'Introduzca una pregunta: ')
        .then(q => {
            return makeQuestion(rl, 'Introduzca la respuesta ')
                .then(a => {
                    return { question: q, answer: a };
                });
        })
        .then(quiz => {
            return models.quiz.create(quiz);
        })
        .then(quiz => {
            log(socket, ` ${colorize('Se ha a�adido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog(socket, 'El quiz es err�neo:');
            error.errors.forEach(({ message }) => errorlog(message));
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        })
};

/**
 * Borra un quiz del modelo-
 * 
 * @param id   Clave del quiz a borrar en el modelo.
 * @param rl Objeto readLine usado para implementar el CLI.
 * 
 */
exports.deleteCmd = (socket, rl, id) => {
    validateId(id)
        .then(id => models.quiz.destroy({ where: { id } }))
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        })
};

/**
 * Edita un quiz del modelo.****************
 *
 * @param id   Clave del quiz a editar en el modelo.
 * @param rl Objeto readLine usado para implementar el CLI.
 */
exports.editCmd = (socket, rl, id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
            process.stdout.isTTY && setTimeout(() => { rl.write(quiz.question) }, 0);
            return makeQuestion(rl, 'Introduzca la pregunta: ')
                .then(q => {
                    process.stdout.isTTY && setTimeout(() => { rl.write(quiz.answer) }, 0);
                    return makeQuestion(rl, 'Introduzca la respuesta ')
                        .then(a => {
                            quiz.question = q;
                            quiz.answer = a;
                            return quiz;
                        });
                });
        })
        .then(quiz => {
        return quiz.save();
        })
        .then(quiz => {
            log(socket, `Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog(socket, 'El quiz es err�neo:');
            error.errors.forEach(({ message }) => errorlog(message));
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        })
};


/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 *
 * @param id   Clave del quiz a probar.
 * @param rl Objeto readLine usado para implementar el CLI.
 */
exports.testCmd = (socket, rl, id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
            //return new Sequelize.Promise((resolve, reject) => {
            //    rl.question(`${colorize(quiz.question, 'red')}${colorize('?', 'red')} `, answer => {
            //        resolve(answer.trim());
            //    });
            //})
            makeQuestion(rl, `${quiz.question }? `)
                .then(answer => {
                    if (answer === quiz.answer) {
                        log(socket, `Su respuesta es correcta.`);
                        log(socket, `${biglog('Correcta', 'green')}`);
                    } else {
                        log(socket, `Su respuesta es incorrecta.`);
                        log(socket, `${biglog('Incorrecto', 'red')}`);
                    }
                    return quiz;
                })
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog(socket, 'El quiz es err�neo:');
            error.errors.forEach(({ message }) => errorlog(message));
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
          rl.prompt();
        }) 
};

/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 *
 * @param rl Objeto readLine usado para implementar el CLI.
 */
exports.playCmd = (socket, rl) => {
    let score = 0; //Preguntas acertadas
    let nPreguntas = 0;
    let toBeResolved = []; 
    models.quiz.findAll()
        .then(quizzes => {
            quizzes.forEach((quiz, id) => {
                ++nPreguntas;
                //toBeResolved.lenght = nPreguntas;
                //toBeResolved.push(quiz.id);
            })

        })
        .then(() => {
            for (let i = 0; i < nPreguntas; i++) { //Relleno el array con los id de las preguntas del quiz
                toBeResolved[i] = i;
            }
            if (toBeResolved.length === 0) {
                log(socket, `No hay nada m�s que preguntar. `);
                log(socket, `Fin del juego. Aciertos: ${score} `);
                biglog(socket, score, 'magenta');
                rl.prompt();
            } else {
                playOne()
            }
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        })
    const playOne = () => {
        let id = Math.floor(Math.random() * (toBeResolved.length - 1) + 1);//coger un id al aza
        validateId(id)
                .then(id => models.quiz.findById(id))
                .then(quiz => {
                    if (!quiz) {
                        throw new Error(`No existe un quiz asociado al id=${id}.`);
                    }
                    makeQuestion(rl, `${quiz.question}? `)
                        .then(answer => {
                            if (answer === quiz.answer) {
                                score++;
                                toBeResolved.splice(id, 1);
                                log(socket, `Su respuesta es correcta.`);
                                playOne()
                            } else {
                                log(socket, `Su respuesta es incorrecta.`);
                                log(socket, `${biglog('Incorrecto', 'red')}`);
                                log(socket, `Fin del juego. Aciertos: ${score} `);
                                biglog(socket, score, 'magenta');
                                rl.prompt();
                            }
                        })
                        .catch(error => {
                            errorlog(socket, error.message);
                            rl.prompt();
                        })
                        .then(() => {
                            rl.prompt();
                        })
                })
                .catch(Sequelize.ValidationError, error => {
                    errorlog(socket, 'El quiz es err�neo:');
                    error.errors.forEach(({ message }) => errorlog(message));
                })
                .catch(error => {
                    errorlog(socket, error.message);
                })
                .then(() => {
                    rl.prompt();
                })
        //}
    }
};

/**
 * Muestra el nombre del autor de la pr�ctica.
 *
 * @param rl Objeto readLine usado para implementar el CLI.
 */
exports.creditsCmd = (socket, rl) => {
    log(socket, 'Autor de la pr�ctica: ');
    log(socket, 'BELEN', 'green');
    rl.prompt();
};

/**
 * Terminar el programa.
 *
 * @param rl Objeto readLine usado para implementar el CLI.
 */
exports.quitCmd = (socket, rl) => {
    rl.close();
    socket.end();
};