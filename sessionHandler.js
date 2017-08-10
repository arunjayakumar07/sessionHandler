/**
 * Created by arun on 15/6/17.
 */

// DEPENDENCY
// ioredis


// addsession
//     It works as a normail callBack function , the user id is passed as first parameter and a callback function as next parameter,
//     the call callBack will be called when the session is created and which will be having the session token


// validate session
//Tokens are retrived from the request using the token key (req.body.token) and the
// response result is passed in the request itself as sessionValue  (req.body.sessionValue )


    // removeSession
// It also takes token from request as (req.body.token)


const redis = require('ioredis');
let config = require('../../config');
var stringUtils = require('./stringOperations');


module.exports = self = {

    addSession (id, callBack =()=>{}){

        let token = stringUtils.generate_key();
        let client = new redis({
            port: config.redisPort,
            host: config.redisUrl
        });
        client.set(token, id, (error, data) => {
            if (error) {
                console.log("set error redis",error)
                callBack(false);
            } else {
                client.expire(token, config.sessionTimeout, (setExpError, setExpData) => {
                    client.disconnect();
                    if (setExpError) { console.log("session error",setExpError)
                        callBack(false)
                    }
                    else {
                        callBack(token);
                    }

                });

            }
        })

    },
    validateSession(req, res, next){
        var client = new redis({
            port: config.redisPort,
            host: config.redisUrl
        });

        var token = req.body.token;
        if(!token){
            token = req.query.token;
        }
        console.log(token,req.body,'token check');
        client.get(token, (error, data) => {
            if (error) {
                res.send({
                    success: false,
                    error: error
                })
            }
            else {
                console.log(data,'token data')
                if (data !== null) {

                    client.expire(token, config.sessionTimeout, (setExpError, setExpData) => {
                        client.disconnect();
                        if (setExpError) {
                            res.send({
                                success: false,
                                error: error
                            })
                        }
                        else {
                            req.body.sessionValue = data;
                            next();
                        }

                    });
                }
                else {
                    if(req.method === 'GET'){
                        res.send(`
                            <html>
                            <body style="text-align: center">
                            <h>Session Expired Please Login</h>
                            </body>
                            </html>
                                  `);
                        return;
                    }
                    res.status(config.errorCodeUnauthorised);
                    res.send({
                        success: false,
                        error: config.InvalidSession,
                        status:config.errorCodeUnauthorised
                    })
                }

            }
        })
    },
    removeSession(req, res, next){
        console.log(req.body)
        var client = new redis({
            port: config.redisPort,
            host: config.redisUrl
        });

        var token = req.body.token;
        if(!token){
            token = req.query.token;
        }

        client.del(token, (error, data) => {
            client.disconnect();
            if (error) {
                res.send({
                    success: false,
                    error: error
                })
            }
            else {
                next();
            }
        })
    }
};











