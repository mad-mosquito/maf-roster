var connected = false
function socketConnect() {
	socket = io.connect('http://node-alroster.rhcloud.com:8000');
		
		
		socket.on('config_data', function (data) {
			
			if (!connected) {
				options = data.options
				pilots = data.pilots
				initSelectOptions()
				initSelectPilots()
				connected = true
				socket.emit('get_roster_data', selected_pilots)
				monitorConnection()
			} else {
				alert('We\'re back!!  \n\n However, the connection was interrupted.. \nSmash OK to refresh the page')
				location.reload()
			}
		})
		
		socket.on('roster_data', function (data) {
			if (JSON.stringify(data).length < 20) document.getElementById('select_columns').style.display='block'
			else for (var id in data) if(data[id]) addRosterColumn(id, data[id])
			
		})
		
		socket.on('update_cell', function (data) {
			console.log(data)
			if (document.getElementById(data.id)) {
				var row = document.getElementById(data.id+'_content').childNodes[0].rows[document.getElementById(data.date).rowIndex]
				row.cells[header_titles.indexOf(data.property)].innerHTML = data.value
				row.cells[1].innerHTML = lookupRosterHours(row.cells[0].innerHTML) || ''
				calculateTotalsLoop(row, 14)
			}
		})
}

function sendUpdateToSocket(cell) {	
	var data = {}
	data.value = cell.innerHTML
	data.property = header_titles[cell.cellIndex]
	data.date = dateTable.rows[cell.parentElement.rowIndex].id
	data.id = cell.parentElement.parentElement.parentElement.parentElement.id.replace('_content', '')
	socket.emit('update_cell', data)
}

function monitorConnection() {
	if (socket.connected) setTimeout(monitorConnection, 10000)
	else alert('Connection lost. \n Any changes will not be saved. \n Try refreshing the page')
}