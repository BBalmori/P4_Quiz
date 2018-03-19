const { log, biglog, errorlog, colorize } = require("./out");
const readline = require('readline');
const Sequelize = require('sequelize');
const {models} = require('./model');

/**
* Muestra la ayuda.
*
* @param rl Objeto readLine usado para implementar el CLI.
*/
exports.helpCmd = rl => {
    log("Comandos:");
    log("  h|help - Muestra esta ayuda.");
    log("  list - Listar los quizzes existentes.");
    log("  show <id> - Muestra la pregunta y la respuesta el quiz indicado");
    log("  add - Añadir un nuevo quiz interactivamente");
    log("  delete <id> - Borrar el quiz indicado.");
    log("  edit <id> - Editar el quiz indicado");
    log("  test <id> - Probar el quiz indicado");
    log("  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log("  credits - Créditos.");
    log("  q|quit - Salir del programa.");
    rl.prompt();
};

//Funciones auxiliares

/**
 * Esta función devuelve una promesa que:
 * -Valida que se ha introducido un valor para el parámetro.
 * -Convierte el parámetro en un número entero.
 * Si todo va bien, la promesa se satisface y devuelve el valor de id a usar.
 *
 * @param id    Parámetro con el índice a validar
 */
const validateId = id => {
    return new Sequelize.Promise((resolve, reject) => {
        if (typeof id === "undefined") {
            reject(new Error(`Falta el parámetro <id>.`));
        } else {
            id = parseInt(id);
            if (Number.isNaN(id)) {
                reject(new Error(`El valor del parámetro <id> no es un número.`));
            } else {
                resolve(id);
            }
        }
    });
};

/**
 * Esta función devuelve una promesaque cuando se cumple, proporciona el texto introducido,
 * entoces la llamada a then que hay que hacer la promesa devuelta será:
 *      .then(answer => {...})
 * También colorea enrojo el texto de la pregunta y elimina espacios al principio y al final.
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
exports.listCmd = rl => {
    models.quiz.findAll()
        .each(quiz => {
            log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
        })
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

/**
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
 *
 * @param id   Clave del quiz a mostrar.
 * @param rl Objeto readLine usado para implementar el CLI.
 */
exports.showCmd = (rl, id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al is=${id}.`);
            }
            log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

/**
 * Añade un nuevo quiz al modelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 *
 * Hay que recordar que el funcionamiento de la funcion rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 *
 * @param rl Objeto readLine usado para implementar el CLI.
 */
exports.addCmd = rl => {
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
            log(` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog('El quiz es erróneo:');
            error.errors.forEach(({ message }) => errorlog(message));
        })
        .catch(error => {
            errorlog(error.message);
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
exports.deleteCmd = (rl, id) => {
    validateId(id)
        .then(id => models.quiz.destroy({ where: { id } }))
        .catch(error => {
            errorlog(error.message);
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
exports.editCmd = (rl, id) => {
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
            log(`Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog('El quiz es erróneo:');
            error.errors.forEach(({ message }) => errorlog(message));
        })
        .catch(error => {
            errorlog(error.message);
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
exports.testCmd = (rl, id) => {
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
                        log(`Su respuesta es correcta.`);
                        log(`${biglog('Correcta', 'green')}`);
                    } else {
                        log(`Su respuesta es incorrecta.`);
                        log(`${biglog('Incorrecto', 'red')}`);
                    }
                    return quiz;
                })
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog('El quiz es erróneo:');
            error.errors.forEach(({ message }) => errorlog(message));
        })
        .catch(error => {
          errorlog(error.message);
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
exports.playCmd = rl => {
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
                log(`No hay nada más que preguntar. `);
                log(`Fin del juego. Aciertos: ${score} `);
                biglog(score, 'magenta');
                rl.prompt();
            } else {
                playOne()
            }
        })
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
        })
    const playOne = () => {
        //if (toBeResolved.length === 0) {
        //    log(`No hay nada más que preguntar. `);
        //    log(`Fin del juego. Aciertos: ${score} `);
        //    biglog(score, 'magenta');
        //    rl.prompt();
        //} else {
            let id = Math.floor(Math.random() * (toBeResolved.length - 1));//coger un id al azar
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
                                log(`Su respuesta es correcta.`);
                                log(`${biglog('Correcta', 'green')}`);
                                playOne()
                            } else {
                                log(`Su respuesta es incorrecta.`);
                                log(`${biglog('Incorrecto', 'red')}`);
                                rl.prompt();
                            }
                            return quiz;
                        })
                })
                .catch(Sequelize.ValidationError, error => {
                    errorlog('El quiz es erróneo:');
                    error.errors.forEach(({ message }) => errorlog(message));
                })
                .catch(error => {
                    errorlog(error.message);
                })
                .then(() => {
                    rl.prompt();
                })
        //}
    }
    //playOne();
};

/**
 * Muestra el nombre del autor de la práctica.
 *
 * @param rl Objeto readLine usado para implementar el CLI.
 */
exports.creditsCmd = rl => {
    log('Autor de la práctica: ');
    log('BELEN', 'green');
    rl.prompt();
};

/**
 * Terminar el programa.
 *
 * @param rl Objeto readLine usado para implementar el CLI.
 */
exports.quitCmd = rl => {
    rl.close();
};