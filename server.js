#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');
var mongo = require('./mongo')
var db = mongo.initDatabase()
//console.log(db)




/**
 *  Define the sample application.
 */
var SampleApp = function() {

    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 3000;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            //self.ipaddress = "127.0.0.1";
            self.ipaddress = "192.168.1.106";
        };
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
		console.log('Closing database...')
		//mongo.closeDb(db);
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
		
		
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = { };

        self.routes['/asciimo'] = function(req, res) {
            var link = "http://i.imgur.com/kmbjB.png";
            res.send("<html><body><img src='" + link + "'></body></html>");
        };

        self.routes['/'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('index.html') );
        };
		
		self.routes['/*'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('/*') );
        };
    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        //self.createRoutes();
        self.app = express.createServer();

        //Add handlers for the app (from the routes).
        //for (var r in self.routes) {
        //    self.app.get(r, self.routes[r]);
        //}
		
		// New call to compress content
		self.app.use(express.compress());
		
		var auth = express.basicAuth(function(user,pass) {
			return 'pilot' === user && 'mafna' === pass;
		});


		// use static server
		self.app.use('/', auth)
		self.app.use('/', express.static(__dirname + '/', { maxAge: 86400000 })); // cache one-day
		//self.app.use(express.static(__dirname + '/'));
		
		//self.auth = express.basicAuth('test', 'admin');
		//self.app.use(express.basicAuth('pilot', 'mafna'));
		
		//self.app.get('/', function(req, res) {
		//	res.send(__dirname/index.html)
		//})

    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };
	
	self.setupSocket = function() {
		//self.io = require('socket.io')//.listen(self.app.listen(self.port))
		
		self.io.sockets.on('connection', function (socket) {
			console.log('connection')
			
			//socket.emit('config_data', data )	
	
			socket.on('get_roster_data', function(data) {
				var roster_data_portion = {}
				for (var i in data) {
					// join 'room' for each roster column
					socket.join(data[i])
					console.log('Joined: ' + data[i])
					roster_data_portion[data[i]] = roster_data[data[i]] || null
				}
				socket.emit('roster_data', roster_data_portion)
			})
			
			socket.on('leave_room', function(room) {
				console.log('Unsubcribed: ', room)
				socket.leave(room)
			})

			socket.on('get_all_members', function(){
				mongo.getAllMembers(function(d) { socket.emit('sent_all_members', d ) } )
			})			
			
			socket.on('get_active_members', function(){
				mongo.getActiveMembers(function(d) { socket.emit('sent_active_members', d ) } )
			})
			
			socket.on('add_member', function(data){
				console.log('Updated Member: ' + data.name)
				mongo.updateMember(data)
			})
			
			socket.on('delete_member', function(data) {
				mongo.deleteMember(data)
			})
			
			socket.on('get_lookup_data', function() {
				mongo.getLookupData(function(d) { socket.emit('sent_lookup_data', d ) } )
			})
			
			socket.on('update_lookup', function(data) {
				mongo.updateLookup(data)
			})
			
			socket.on('delete_lookup', function(data) {
				mongo.deleteLookup(data)
			})
			
			socket.on('update_data', function(data) {
				mongo.updateData(data)
				
				// send update to peers
				socket.to(data.name).emit('update_cell', data)
			})
			
			socket.on('get_data_range', function(data) {
				mongo.getDataRange(data, function(d){ socket.emit( 'sent_data_range', d ) } )
				// join rooms
				for (var n in data.members) {
					socket.join(data.members[n])
					console.log('Joined: ' + data.members[n])
				}
			})
			
			socket.on('get_date_data', function(data) { // return all data from a single date
				mongo.getDateData(data, function(d) { socket.emit('sent_date_data', d )} )
			})
		})
	}


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
		self.io = require('socket.io').listen(self.app.listen(self.port, self.ipaddress));
		
		/*
		self.io = require('socket.io').listen(self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        }));
		*/
		self.setupSocket();
    };

};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize();
zapp.start();

/*  TEMP DATA  */
var pilots = {"Top_Gun": "Top Gun", "Santa_Claus":"Santa Claus", "Bob_Marley":"Bob Marley", "John_Wayne":"John Wayne","R2D2":"R2D2", "Oscar_the_Grouch":"Oscar"}
var options = { "&nbsp;":"","GA8":10, "C206":10, "C210":10, "OFFICE":6, "LEAVE":8, "SICK":8 }
var data = {"pilots":pilots, "options":options}


var roster_data = {
	"Des_Vautier" : {
		"name":"Des Vautier",
		"startday":"Mon",
		"_2015_9_29":{"duty_type":"GA8","roster_hours":6.5, "hours_logged":5.5},
		"_2015_9_27":{"duty_type":"GA8","roster_hours":7.7, "hours_logged":8},
		"_2015_9_30":{"duty_type":"GA8","roster_hours":10, "hours_logged":8},
		"_2015_9_31":{"duty_type":"GA8","roster_hours":10, "hours_logged":8},
		"_2015_10_3":{"duty_type":"GA8","roster_hours":10},
		"_2015_10_4":{"duty_type":"GA8","roster_hours":10}
	},
	
	"Top_Gun" : {
		"name":"Top Gun",
		"startday":"Tue",
		"_2015_10_6":{"duty_type":"GA8","hours_logged":8},
		"_2015_10_7":{"duty_type":"GA8","hours_logged":8},
		"_2015_10_8":{"duty_type":"GA8","hours_logged":8},
		"_2015_10_9":{"duty_type":"GA8"},
		"_2015_10_10":{"duty_type":"GA8"}
	},
	
	"Santa_Claus" : {
		"name":"Santa Claus",
		"startday":"Wed",
		"_2015_10_6":{"duty_type":"GA8","hours_logged":8},
		"_2015_10_7":{"duty_type":"GA8","hours_logged":8},
		"_2015_10_8":{"duty_type":"GA8","hours_logged":8},
		"_2015_10_9":{"duty_type":"GA8","hours_logged":8},
		"_2015_10_10":{"duty_type":"GA8","hours_logged":8}
	},
	
	"Bob_Marley" : {
		"name":"Bob Marley",
		"startday":"Thu",
		"_2015_10_6":{"duty_type":"GA8","hours_logged":8},
		"_2015_10_7":{"duty_type":"GA8","hours_logged":8},
		"_2015_10_8":{"duty_type":"GA8","hours_logged":8},
		"_2015_10_9":{"duty_type":"GA8","hours_logged":8},
		"_2015_10_10":{"duty_type":"GA8","hours_logged":8}
	},
	
	"John_Wayne" : {
		"name":"John Wayne",
		"startday":"Fri",
		"_2015_10_6":{"duty_type":"GA8","hours_logged":8},
		"_2015_10_7":{"duty_type":"GA8","hours_logged":8},
		"_2015_10_8":{"duty_type":"GA8","hours_logged":8},
		"_2015_10_9":{"duty_type":"GA8","hours_logged":8},
		"_2015_10_10":{"duty_type":"GA8","hours_logged":8}
	},
	
	"R2D2" : {
		"name":"R2D2",
		"startday":"Sat",
		"_2015_10_6":{"duty_type":"GA8","hours_logged":8},
		"_2015_10_7":{"duty_type":"GA8","hours_logged":8},
		"_2015_10_8":{"duty_type":"GA8","hours_logged":8},
		"_2015_10_9":{"duty_type":"GA8","hours_logged":8},
		"_2015_10_10":{"duty_type":"GA8","hours_logged":8}
	},
	
	"Oscar_the_Grouch" : {
		"name":"Oscar the Grouch",
		"startday":"Sun",
		"_2015_10_6":{"duty_type":"GA8","hours_logged":8},
		"_2015_10_7":{"duty_type":"GA8","hours_logged":8},
		"_2015_10_8":{"duty_type":"GA8","hours_logged":8},
		"_2015_10_9":{"duty_type":"GA8","hours_logged":8},
		"_2015_10_10":{"duty_type":"GA8","hours_logged":8}
	},
}

