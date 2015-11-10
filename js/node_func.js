var connecting = true
function socketConnect() {
	if (location.href.indexOf('rhcloud') != -1 ) 
		socket = io.connect('http://node-alroster.rhcloud.com:8000');
	else socket = io.connect('localhost:8080');
		
		socket.emit('get_lookup_data')
		socket.on('sent_lookup_data', function(data) {
			if (connecting) {
				initSelectOptions(data)
				socket.emit('get_active_members')
			}
		})
		
		socket.on('sent_active_members', function(data) {
			if (connecting) {
				initSelectMembers(data)
				if (selected_members.length)
					socket.emit('get_data_range', { 'members' : selected_members, "start":parseInt(dateToInteger(topdate)), "end":parseInt(dateToInteger(lastdate)) })
			}
		})
		
		socket.on('sent_data_range', function(data) {
			console.log(data)			
			for (var i = 0; i < selected_members.length; i ++) {
				addRosterColumn(selected_members[i], data[selected_members[i]])
			}
		})

		socket.on('update_cell', function (data) {
			console.log('UPDATE CELL: ' + data)
			if (document.getElementById(data.name)) {
				var row = document.getElementById(data.name+'_content').childNodes[0].rows[document.getElementById(data.date).rowIndex]
				row.cells[header_titles.indexOf(data.property)].innerHTML = data.value
				row.cells[1].innerHTML = lookup[row.cells[0].innerHTML] || ''
				calculateTotalsLoop(row, 14)
			}
		})

		socket.on('sent_date_data', function(data) {
			var m_pilots = 0
			var l_pilots = 0
			for (var i = 0; i < data.length; i ++ ) {
				var availability = 0;
				if (lookup[data[i].duty_type]) 
					var availability = lookup[data[i].duty_type].availability || 0
				if (members[data[i].name].program) l_pilots += availability
				else m_pilots += availability
			}
			pilotsAvailablePopup.innerHTML = '<b>MAF : </b>' + m_pilots + '<br /><b>LAYNHA : </b>' + l_pilots
			//console.log('MAF:',m_pilots,'LAYNHA:',l_pilots)
		})		
}

function sendUpdateToSocket(cell) {	
	var data = {}
	data.value = cell.innerHTML
	data.property = header_titles[cell.cellIndex]
	data.date = dateTable.rows[cell.parentElement.rowIndex].id
	data.name = cell.parentElement.parentElement.parentElement.parentElement.id.replace('_content', '')
	console.log(data)
	socket.emit('update_data', data)
}

function monitorConnection() {
	if (socket.connected) setTimeout(monitorConnection, 10000)
	else alert('Connection lost. \n Any changes will not be saved. \n Try refreshing the page')
}