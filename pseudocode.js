/* global virgilio, schema */
//--- GOAL ---
//The goal of this release is to take a step back with virgilio-http and let
//restify and bluebird do more of the heavy lifting, while still promoting the
//seperation of virgilio-http way of working.
//As a result, we expect the module to become less complex and easier to use.

//--- EXAMPLES ---
//This is a proposal for the new virgilio-http api in examples.
//Each example illustrates a specific feature. Features can be mixed.

//`virgilio.foo` is an action.
virgilio.defineAction$('foo', function() {});

// --- create an endpoint with defaults ---
//`virgilio.foo` gets called with [ <params.fooId>, <req.body> ]
//The result of virgilio.foo is returned with a 200 status code.
virgilio.foo.post('/foo/:fooId');

// --- create an endpoint with custom transformer ---
//The old `transform`, `respond` and `error` are replaced with one function.
//Advantages:
//  1. More flexibility (example: respond functions that need req object).
//  2. Easier to use because similar to normal request handlers. Less to know.
//Instead of a `next` callback, the returned promise triggers the next mw.
virgilio.foo
    .post('/foo/:fooId')
    .transform(function(req, res) {
        var id = req.params.id;
        return this.execute$(id, req.body)
            .then(function(result) {
                res.send(200, result);
            })
            .catch(virgilio.NotFoundError, function() {
                res.send(404);
            });
    });

// --- create an endpoint with middlewares ---
//`.addHandler` is an alias for `.transform`.
//A `.transform` called without arguments calls the default transform.
var mw = virgilio.http.middlewares;
virgilio.foo
    .post('/foo/:fooId')
    .addHandler(mw.validate(schema))
    .transform()    //Question: perhaps call this one `.execute`?
    .addHandler(mw.ie8Transform());

// --- create endpoints in a traditional way ---
//This is usefull specifically when calling multiple actions in a route.
virgilio.http
    .post('/foo/:fooId')
    .addHandler(function(req, res) {
        var virgilio = this;
        return virgilio.customAuth(req.headers.auth)
            .then(function(result) {
                if (result) {
                    return;
                }
                res.send(401);
                return false;   //Don't execute more handlers.
            });
    })
    .addHandler(function(req, res) {
        var virgilio = this;
        var id = req.params.id;
        return virgilio.execute$(id, req.body)
            .then(function(result) {
                res.send(200, result);
            });
    });

// --- register middlewares ---
//Restify's default plugins can be found on `virgilio.http.middlewares`.
//This object can be extended with custom middlewares.
var mw = virgilio.http.middlewares;
virgilio.http
    .use(mw.bodyParser());