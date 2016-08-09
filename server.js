#!/bin/env node
//  OpenShift sample Node application
//  Log files @  $OPENSHIFT_LOG_DIR
var express = require('express');
var fs      = require('fs');
var mongo = require('./mongo')
var backup = require('./backup')
var db = mongo.initDatabase()


//backup.initNodeMailer(mongo)
scheduleBackup()

//setTimeout(function(){backup.getBackup(mongo)},5000)

function scheduleBackup() {
	var d = new Date()
	var hh = d.getUTCHours()
	var delay = 0
	if (hh < 18) delay = 18 - hh
	else delay = 42 - hh
	console.log('Backup scheduled for ' + delay + ' hours from now.')
	delay = delay * 1000 * 60 * 60
	setTimeout(function() {
		backup.getBackup(mongo)
		scheduleBackup()
	}, delay)
}

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
            //self.ipaddress = "192.168.1.106";
			self.ipaddress = "192.168.1.2";
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
			if (user === 'pilot' && pass === 'mafna') return true
			else if (user === 'laynha' && pass === 'laynha') return true
			else return false
		});


		// use static server
		self.app.use('/', auth)
		self.app.use('/', express.static(__dirname + '/', { maxAge: 86400000 })); // cache one-day
		self.app.use(express.bodyParser());
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
			
			socket.on('get_holidays', function() {
				mongo.getHolidays(function(d) { socket.emit('sent_holidays', d) } )
			})
			
			socket.on('save_holiday', function(data) {
				mongo.saveHoliday(data)
			})
			
			socket.on('delete_holiday', function(data) {
				mongo.deleteHoliday(data)
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
				}
				
			})
			
			socket.on('get_date_data', function(data) { // return all data from a single date
				mongo.getDateData(data, function(d) { socket.emit('sent_date_data', d )} )
			})
			
			socket.on('backup', function(startDate, endDate) {
				mongo.getAllMembers(function(m) {
					data = {}
					members = []
					for (var i in m) members.push (m[i].name)
					data.members = members
					data.start = parseInt(startDate)
					data.end = parseInt(endDate)
					
					mongo.getDataRange(data, function(d){ 
						socket.emit('backup', backup.getCSV(startDate, endDate, members, d))
					})
					
				})
			})
			
			socket.on('backup_now', function(){backup.getBackup(mongo)});
			
			socket.on('get_date', function() {
				socket.emit('sent_date', new Date())
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

