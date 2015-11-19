module.exports = {

	getBackup: function(mongo) {
		self = this
		var start_date = new Date()
		var end_date = new Date()
		start_date.setDate(start_date.getDate() - 60)
		end_date.setDate(end_date.getDate() + 60)
		var startDate = this.fromDate(start_date)
		var endDate = this.fromDate(end_date)
	
		mongo.getAllMembers(function(m) {
			data = {}
			members = []
			for (var i in m) members.push (m[i].name)
			data.members = members
			data.start = parseInt(startDate)
			data.end = parseInt(endDate)
			
			mongo.getDataRange(data, function(d){ 
				self.sendMail(self.getCSV(startDate, endDate, members, d), start_date, end_date)
			})
			
		})
	},
	
	sendMail: function ( data, start_date, end_date ) {
			
		var todayDate = new Date()
		var mg = require('mailgun-js')( { apiKey:'key-cdb67e77e323d3cb148f9148e585ef10', domain: 'sandbox9c96d6eead734d33be3fb0d3b72dab70.mailgun.org' } )
		var attch = new mg.Attachment({data: new Buffer(data,'utf-8'), filename: self.dateToFilename(todayDate)})
			
		var mailOptions = {
			from: 'AL-Roster <al-ops@maf.org>',
			to: 'Test <skoonta@gmail.com>',
			subject: 'AL-Roster Backup, '+ self.dateToString(start_date) + ' to '+ self.dateToString(end_date),
			text: 'Backup created: ' + todayDate.toDateString(),
			//html: '<b>Hello</b>', // html body,
			attachment: attch
		};
		
		mg.messages().send(mailOptions, function (err, info) {
			console.log(info)
		})

	},
	
	dateToString: function (date) {
		return date.getDate() + '/' + (date.getMonth()+1) + '/' + date.getFullYear()
	},
	
	dateToFilename: function (date) {
		return date.getFullYear() + '_' + (date.getMonth() +1 ) + '_' + date.getDate() + '.csv'
	},

	getCSV: function(start, end, members, data) {
		var date = this.toDate(start)
		var end_date = this.toDate(end)
		var day = start;
		
		
		// set Names and headers in CSV
		var csv = 'DATE, '
		var csv_cols = ', '
		for ( var i = 0; i < members.length; i ++ ) {
			csv += '"' + members[i] + '", , , , ,'
			csv_cols += ' "Duty Type", "Rostered Hours", "DFT8 Duty" , "Program" , ,'
		} 
		
		csv += '\r\n' + csv_cols + '\r\n'
		
		// add row for each date in range
		while (date.toLocaleDateString() != end_date.toLocaleDateString()) {
		
			var csvLine = date.getDate() + '/' + (date.getMonth()+1) + '/' + date.getFullYear() + ', '
			
			
			for (var i = 0; i < members.length; i ++ ){
			
				var member = members[i]
				var csvString = ''
				
				if (data[member]) {
				
					for ( var e in data[member] ) {
					
						var entry = data[member][e]
						
						if ( String(entry.date) == day ) {
						
							csvString += entry['duty_type'] || '' ; csvString += ', '
							csvString += entry['roster_hours'] || ''; csvString += ', '
							csvString += entry['hours_logged'] || ''; csvString += ', '
							csvString += entry['program'] || ''; csvString += ', , '
						
						}
					
					}
				
				}
				
				// if no entry for this day csvString = empty
				if (!csvString.length) csvString = ', , , , , '
				csvLine += csvString
			}

			csv += csvLine + '\r\n'
		
			date.setDate(date.getDate() + 1 )
			day = this.fromDate(date)
		}
		return csv
		
	},
	
	toDate: function(str) {
		str = String(str)
		var date = new Date()
		date.setYear(String(str).substring(0,4))
		date.setMonth(String(str).substring(4,6))
		date.setDate(String(str).substring(6,8))
		return date
	},
	
	fromDate: function(date) {
		str = ''
		str += date.getFullYear()
		str += date.getMonth() > 9 ? date.getMonth() : '0' + date.getMonth()
		str += date.getDate() > 9 ? date.getDate() : '0' + date.getDate()
		return str
	}	
}