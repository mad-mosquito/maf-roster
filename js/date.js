var days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
var daysInView = 80;
var topdate, lastdate, today_id
var pilots_available_requested_date, pilot_available_timeout


function initDateColumn() {
	dateTable = document.getElementById('date_table')
	today = new Date()
	topdate = new Date(today.valueOf())
	lastdate = new Date(today.valueOf())
	
	topdate.setDate(topdate.getDate() - 35 )
	lastdate.setDate(lastdate.getDate() - 35 )
	
	
	today_id = dateToInteger(today)
	
	for (var i = 0; i < daysInView; i ++) {
		row = dateTable.insertRow(-1)
		row.insertCell(-1).innerHTML = lastdate.getDate() + ' ' + months[lastdate.getMonth()]
		row.insertCell(-1).innerHTML = days[lastdate.getDay()]
		row.cells[1].weekday = days[lastdate.getDay()]
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
	dateTable.rows[0].cells[0].style.width='70px'
	dateTable.rows[0].cells[1].style.width='100px'
	
	
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

function addRowsTop(num, scrollTop) {
	addTop.style.display = 'none'
	if (!num) num = 7
	if (!scrollTop) scrollTop = document.documentElement.scrollTop || document.body.scrollTop
	var topdate_1 = new Date(topdate.valueOf())
	lastdate.setDate(lastdate.getDate() - num)

	
	for (var i = 0; i < num; i ++) {
		topdate.setDate(topdate.getDate() - 1)
		dateTable.deleteRow(-1) // delete row from bottom
		var row = dateTable.insertRow(0)  // add row at top
		
		row.insertCell(-1).innerHTML = topdate.getDate() + ' ' + months[topdate.getMonth()]
		row.insertCell(-1).innerHTML = days[topdate.getDay()]
		row.cells[1].weekday = days[topdate.getDay()]
		row.id = dateToInteger(topdate)
		
		if (row.cells[1].innerHTML == 'Sun') row.style.background = '#a2bcd4';
		else if (row.cells[1].innerHTML == 'Sat') row.style.background = '#d2ecff';
		else if (row.cells[1].innerHTML == 'Tue') row.style.background = '#ccc';
		else if (row.cells[1].innerHTML == 'Thu') row.style.background = '#ccc';
		else row.style.background = '#fff'
		
		if (today_id == row.id) row.style.backgroundColor = '#a4e1b4'
		
		// insert rows into this members column
		
		for (var r = 0; r < content_container.childElementCount; r ++) {
			
			content_container.childNodes[r].childNodes[0].deleteRow(-1) // delete row
			var m_row = content_container.childNodes[r].childNodes[0].insertRow(0)  // add row
			
			
			if (content_container.childNodes[r].id == "Notes_content") {
				// notes
				for (var ii = 0; ii < 3; ii ++) m_row.insertCell(-1) 
				m_row.style.background = '#fff'
				m_row.className = "notes_row"
				
			
			}
			
			else {
				// member
				for (var ii = 0; ii < 5; ii ++) m_row.insertCell(-1)
				m_row.style.background = row.style.background
				if (days[members[content_container.childNodes[r].id.replace('_content', '')].startday] == row.cells[1].innerHTML)
					m_row.className = 'startday'				
			}
		}
	}
	
	// correct scroll position
	document.documentElement.scrollTop = document.body.scrollTop = scrollTop + 40 * num
	date_container.style.top = window.pageYOffset *-1 + 100 + 'px'
	
	//daysInView += num
	if (selected_members.length)
		loading.style.display = 'block'
		socket.emit('get_data_range', { 'members' : selected_members, "start":parseInt(dateToInteger(topdate)), "end":parseInt(dateToInteger(topdate_1)) })
	
	// set column width
	dateTable.rows[20].cells[0].style.width='70px'
	dateTable.rows[20].cells[1].style.width='100px'
	
}

function addRowsBottom(num, scrollTop) {
	addBottom.style.display = 'none'
	if (!scrollTop) scrollTop = document.documentElement.scrollTop || document.body.scrollTop
	if (!num) num = 7

	topdate.setDate(topdate.getDate() + num )
	
	var lastdate_1 = new Date(lastdate.valueOf())
	
	for (var i = 0; i < num; i ++) {
		
		dateTable.deleteRow(0) // remove row
		var row = dateTable.insertRow(-1) // add row
		row.insertCell(-1).innerHTML = lastdate.getDate() + ' ' + months[lastdate.getMonth()]
		row.insertCell(-1).innerHTML = days[lastdate.getDay()]
		row.cells[1].weekday = days[lastdate.getDay()]
		row.id = dateToInteger(lastdate)
		
		if (row.cells[1].innerHTML == 'Sun') row.style.background = '#a2bcd4';
		else if (row.cells[1].innerHTML == 'Sat') row.style.background = '#d2ecff';
		else if (row.cells[1].innerHTML == 'Tue') row.style.background = '#ccc';
		else if (row.cells[1].innerHTML == 'Thu') row.style.background = '#ccc';
		else row.style.background = '#fff'
		
		if (today_id == row.id) row.style.backgroundColor = '#a4e1b4'
		
		// insert rows into member columns
		for (var r = 0; r < content_container.childElementCount; r ++) {
			content_container.childNodes[r].childNodes[0].deleteRow(0) // remove row
			var m_row = content_container.childNodes[r].childNodes[0].insertRow(-1) // add row
			
			if (content_container.childNodes[r].id == "Notes_content") {
				// notes
				
				m_row.style.background = '#fff'
				m_row.className = "notes_row"
				
				for (var ii = 0; ii < 3; ii ++) {
					m_row.insertCell(-1) 
				}
			
			} else { 
				m_row.style.background = row.style.background
				
				for (var ii = 0; ii < 5; ii ++) {
					m_row.insertCell(-1)
				}
				
				if (days[members[content_container.childNodes[r].id.replace('_content', '')].startday] == row.cells[1].innerHTML) {
					m_row.className = 'startday'
				}	
			}				
		}
		
		lastdate.setDate(lastdate.getDate() + 1)
	}
	console.log(scrollTop)
	// correct scroll position
	document.documentElement.scrollTop = document.body.scrollTop = scrollTop - 40 * num
	date_container.style.top = window.pageYOffset *-1 + 100 + 'px'
	
	// set column width
	dateTable.rows[20].cells[0].style.width='70px'
	dateTable.rows[20].cells[1].style.width='100px'
	
	if (selected_members.length)
		loading.style.display = 'block'
		console.log('START:', dateToInteger(lastdate_1), 'END:', dateToInteger(lastdate))
		socket.emit('get_data_range', { 'members' : selected_members, "start":parseInt(dateToInteger(lastdate_1)), "end":parseInt(dateToInteger(lastdate)) })
}

function dateToInteger(date) {
	var yy = date.getFullYear()
	var mm = date.getMonth()
	var dd = date.getDate()	
	return String(yy) + (mm < 10 ? '0' + mm : String(mm)) + (dd < 10 ? '0' + dd : String(dd))
}
