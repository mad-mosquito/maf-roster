module.exports = {

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
	
	getMemberEntry: function(data) {
	
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