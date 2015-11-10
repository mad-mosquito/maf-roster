module.exports = {

	initDatabase: function() {

		var MongoClient = require('mongodb').MongoClient
			, format = require('util').format;  
			
		
		var mongo_ip = process.env.OPENSHIFT_MONGODB_DB_HOST
		var mongo_port = process.env.OPENSHIFT_MONGODB_DB_PORT || 27017
		
		if (typeof mongo_ip === "undefined") mongo_ip = '127.0.0.1'
		//var mongo_url = 'mongodb://' + mongo_ip + ':' + mongo_port + '/roster_db'
		var mongo_url = 'mongodb://admin:qshIrs8mFvqq@' + mongo_ip + ':' + mongo_port + '/node'
		console.log(mongo_url)
		MongoClient.connect(mongo_url, function(err, db) {
			
			if(err) throw err;
			
			
			collection_data = db.collection('data')
			collection_members = db.collection('members')
			collection_lookup = db.collection('lookup')
	
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
		console.log(typeof(callback))
		collection_members.find( { } ).toArray(function(err, docs) {
			if( err ) throw err
			callback(docs)
		})
	},
	
	updateMember: function (data) {
		collection_members.update( { name:data.name }, //match name
			data, { upsert:true }
		)
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

	updateData: function(data) {
		collection_data.update( { name:data.name, date:parseInt(data.date) }, 
		{ $set:
			{
			[data.property] : data.value
			}
		}, {upsert:true})
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