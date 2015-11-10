var days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
var daysInView = 40;
var topdate, lastdate, today_id
var pilots_available_requested_date, pilot_available_timeout


function initDateColumn() {
	dateTable = document.getElementById('date_table')
	today = new Date()
	topdate = new Date()
	lastdate = new Date()
	
	topdate.setDate(today.getDate() -7)
	lastdate.setDate(today.getDate() -7)
	
	
	today_id = dateToInteger(today)
	
	for (var i = 0; i < daysInView; i ++) {
		row = dateTable.insertRow(-1)
		row.insertCell(-1).innerHTML = lastdate.getDate() + ' ' + months[lastdate.getMonth()]
		row.insertCell(-1).innerHTML = days[lastdate.getDay()]
		row.id = dateToInteger(lastdate)
		
		if (row.cells[1].innerHTML == 'Sun') row.style.background = '#a2bcd4';
		else if (row.cells[1].innerHTML == 'Sat') row.style.background = '#d2ecff';
		else if (row.cells[1].innerHTML == 'Tue') row.style.background = '#ccc';
		else if (row.cells[1].innerHTML == 'Thu') row.style.background = '#ccc';
		else row.style.background = '#fff'
		
		if (today_id == row.id) row.style.backgroundColor = '#a4e1b4'
		lastdate.setDate(lastdate.getDate() + 1)
	}
	
	// set column width
	dateTable.rows[0].cells[0].style.width='80px'
	dateTable.rows[0].cells[1].style.width='50px'
	
	
	// listener for pilots available popup
	pilotsAvailablePopup = document.getElementById('pilots_available_popup')
	dateTable.addEventListener('click', function(e) {
		if (pilots_available_requested_date == parseInt(e.target.parentNode.id)) 
			pilotsAvailablePopup.click()
		else {
			pilots_available_requested_date = parseInt(e.target.parentNode.id)
			e.target.parentNode.appendChild(pilotsAvailablePopup)
			pilotsAvailablePopup.innerHTML = 'loading....'
			pilotsAvailablePopup.style.display = 'block'		
			socket.emit('get_date_data', pilots_available_requested_date)
			clearTimeout(pilot_available_timeout)
			pilot_available_timeout = setTimeout(function() {pilotsAvailablePopup.click()}, 5000)
		}
	})
	
	pilotsAvailablePopup.addEventListener('click', function(e) {
		pilotsAvailablePopup.style.display = 'none'
		pilots_available_requested_date = 0
		e.stopPropagation()
	})
}

function dateToInteger(date) {
	var yy = date.getFullYear()
	var mm = date.getMonth()
	var dd = date.getDate()	
	return String(yy) + (mm < 10 ? '0' + mm : String(mm)) + (dd < 10 ? '0' + dd : String(dd))
}
