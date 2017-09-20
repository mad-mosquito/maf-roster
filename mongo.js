module.exports = {

	initDatabase: function() {

		var MongoClient = require('mongodb').MongoClient
			, format = require('util').format;  
			
		
		var mongo_ip = process.env.OPENSHIFT_MONGODB_DB_HOST

		console.log('*****', mongo_ip)
		var mongo_port = process.env.OPENSHIFT_MONGODB_DB_PORT || 27017
		
		if (typeof mongo_ip === "undefined") {
			mongo_ip = '127.0.0.1'
			var mongo_url = 'mongodb://' + mongo_ip + ':' + mongo_port + '/roster_db'
		} else 
			var mongo_url = 'mongodb://admin:qshIrs8mFvqq@' + mongo_ip + ':' + mongo_port + '/node'
		
		MongoClient.connect(mongo_url, function(err, db) {
			
			if(err) throw err;
			
			
			collection_data = db.collection('data')
			collection_members = db.collection('members')
			collection_lookup = db.collection('lookup')
			collection_holidays = db.collection('holidays')
	
			console.log('Mongo DB connected..')
			return db;
		})
	},

	getActiveMembers: function (callback) {
		collection_members.find( { active:true } ).toArray(function(err, docs) {
			if( err ) throw err
			callback(docs)
		})
	},
	
	getAllMembers: function (callback) {
		collection_members.find( { } ).toArray(function(err, docs) {
			if( err ) throw err
			callback(docs)
		})
	},
	
	updateMember: function (data) {
		
		if (data.old_name) {
			console.log(data)
			collection_members.update( 
				{ name:data.old_name }, //match name
				data, 
				{ upsert:true }
			)
			
			//var update = { "$set" : {} }
			//update.$set['name'] = data.value
			//if (data.program) update.$set["program"] = data.program
			//collection_data.update( { name:data.name, date:parseInt(data.date) }, update, {upsert:true})
			
			collection_data.update( 
				{ name : data.old_name }, 
				{ $set: { name : data.name }  },
				{ multi : true }
			)
		
		} else {
			collection_members.update( { name:data.name }, //match name
				data, { upsert:true }
			)
		}	
	},
	
	deleteMember: function (data) {
		collection_members.remove( { name:data.name } )
		//TODO: Delete all data relating to member
	},

	getLookupData: function (callback) {
		collection_lookup.find( { } ).toArray(function(err, docs) {
			if( err ) throw err
			callback(docs)
			
		})
	},

	updateLookup: function (data) {
		collection_lookup.update( { duty_type:data.duty_type }, //match type
			data, { upsert:true }
		)
	},
	
	deleteLookup: function (data) {
		collection_lookup.remove( { duty_type:data.duty_type } )
	},
	
	getHolidays: function(callback) {
		collection_holidays.find( { } ).sort({date : 1}).toArray(function(err, docs) {
			if (err) throw err
			callback(docs)
		})
	},
	
	saveHoliday: function(data) {
		collection_holidays.update( { date: data.date },
			data, {upsert:true }
		)
	},
	
	deleteHoliday: function(data) {
		collection_holidays.remove( { date: data.date } )
	},
	
	getDataRange: function (data, callback) {
		var return_data = {}
		var return_count = 0;
		for (var i in data.members) {
		
			(function(i) {
				collection_data.find( { name:data.members[i], date: {$gte:data.start, $lte:data.end} } )
					.toArray(function(err, docs) {
						if( err ) {return_count ++;throw err}
						return_count ++
						return_data[data.members[i]] = docs
						if (return_count == data.members.length) callback(return_data)
					})
			})(i)
			
		}
	},
	
	getBackupData: function (start, end, callback) {
		console.log(start,end)
		collection_data.find( { date: { $gte:start, $lte:end } }, {_id:0} ).sort({date:1}).toArray(function(err, docs) {
			if( err ) throw err
			callback(docs)
		})
	},

	updateData: function(data) {
		var update = { "$set" : {} }
		update.$set[data.property] = data.value
		if (data.program) update.$set["program"] = data.program
		collection_data.update( { name:data.name, date:parseInt(data.date) }, update, {upsert:true})
	},
	
	getDateData: function(data, callback) {
		collection_data.find( { date:data } ).toArray(function(err, docs) {
			if( err ) throw err
			callback(docs)
		})
	},

	logData: function () {
		collection_data.find( { } ).toArray(function(err, docs) {
			if( err ) throw err
			console.log(docs)
			console.log('')
		})
	},

	logMembers: function () {
		collection_members.find( { } ).toArray(function(err, docs) {
			if( err ) throw err
			console.log(docs)
			console.log('')
		})
	},

	logLookup: function () {
		collection_lookup.find( { } ).toArray(function(err, docs) {
			if( err ) throw err
			console.log(docs)
			console.log('')
		})
	},

	closeDb: function (db) {
		db.close()
	}	

}