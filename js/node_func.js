var connecting = true
function socketConnect() {
	/*
	if (location.href.indexOf('rhcloud') != -1 ) 
		socket = io.connect('http://node-alroster.rhcloud.com:8000');
	else socket = io.connect('192.168.1.2:3000');
	*/
	socket = io.connect(window.location.host);
		socket.emit('get_holidays')
		socket.on('sent_holidays', function(data) {
			holidays = data
			paintHolidays()
		})
		
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
			
			for (var i = 0; i < selected_members.length; i ++) {
				if (selected_members[i] == NOTES_ID) {
					addNotesColumn(data[selected_members[i]])
				} else {
					addRosterColumn(selected_members[i], data[selected_members[i]])
				}
			}
			loading.style.display = 'none'
			if (holidays != null) paintHolidays()
			pending = false
		})

		socket.on('update_cell', function (data) {
			
			console.log(data)
			if (document.getElementById(data.name)) {
					if (document.getElementById(data.date)) {
					var row = document.getElementById(data.name+'_content').childNodes[0].rows[document.getElementById(data.date).rowIndex]
					if (data.name == NOTES_ID) {
						console.log("update notes")
						if (data.property == "duty_type") row.cells[0].innerHTML = data.value || ''  // TAB A
						if (data.property == "roster_hours") row.cells[1].innerHTML = data.value || ''  // TAB B
						if (data.property == "hours_logged") row.cells[2].innerHTML = data.value || ''  // TAB C

					} else {
						row.cells[header_titles.indexOf(data.property)].innerHTML = data.value
						if (lookup[row.cells[0].innerHTML])
							row.cells[1].innerHTML = lookup[row.cells[0].innerHTML].roster_hours || ''
						else row.cells[1].innerHTML = ''
						row.cells[0].className = data.program || row.parentElement.parentElement.program
						if (!row.cells[0].innerHTML.length || row.cells[0].innerHTML == '&nbsp') row.cells[0].className = ''
						calculateTotalsLoop(row, 14)
					}
				}
			}
		})

		socket.on('sent_date_data', function(data) {

			var m_pilots = 0
			var l_pilots = 0
			for (var i = 0; i < data.length; i ++ ) {
				if(members[data[i].name]) {
					var availability = 0;
					if (lookup[data[i].duty_type]) 
						var availability = lookup[data[i].duty_type].availability || 0
					
					if (data[i].program) {
						if (data[i].program == 'maf') m_pilots += availability
						else l_pilots += availability
					} else {	
						if (members[data[i].name].program) l_pilots += availability
						else m_pilots += availability
					}
				}
			}
			pilotsAvailablePopup.innerHTML = '<b>MAF : </b>' + m_pilots + '<br /><b>LAYNHA : </b>' + l_pilots
		})		
}

function sendUpdateToSocket(cell) {	
	var data = {}
	data.value = cell.innerHTML
	data.property = header_titles[cell.cellIndex]
	data.date = dateTable.rows[cell.parentElement.rowIndex].id
	data.name = cell.parentElement.parentElement.parentElement.parentElement.id.replace('_content', '')
	//if (cell.program && cell.program != cell.parentNode.parentNode.parentNode.program)
	if (cell.program)
		data.program = cell.program
	console.log(data)
	socket.emit('update_data', data)
}

function monitorConnection() {
	if (socket.connected) setTimeout(monitorConnection, 10000)
	else alert('Connection lost. \n Any changes will not be saved. \n Try refreshing the page')
}