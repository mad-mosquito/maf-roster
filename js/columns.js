function addRosterColumn(name, data) {

	if (!members[name]) return
	
	// header
	var header = createDiv(null, 'header', null, null)
	header_container.appendChild(header)
	header.id = name
	
	m_right = function(){
		a1 = this.parentElement
		a2 = document.getElementById(this.parentElement.id + '_content')
		
		if (a1.nextElementSibling){
			b1 = a1.nextElementSibling
			b2 = a2.nextElementSibling
			readySetSwapsies(4,3)			
		}
	}		
	
	m_left = function(){
		b1 = this.parentElement
		b2 = document.getElementById(this.parentElement.id + '_content')
		if (b1.previousElementSibling){
			
			a1 = b1.previousElementSibling
			a2 = b2.previousElementSibling
			readySetSwapsies(3,4)
		}
	}

	remove = function() { removeColumn(this.parentElement.id) }
			
	header.appendChild(createDiv(name,'name', null, null))
	header.appendChild(createDiv('X','button', null, remove))
	header.appendChild(createDiv('>','button', null, m_right))
	header.appendChild(createDiv('<','button', null, m_left))
	var h_table = document.createElement('table')
	var row = h_table.insertRow(-1)
	
	row.insertCell(-1).innerHTML = 'DUTY TYPE'
	row.insertCell(-1).innerHTML = 'ROSTER HOURS'
	row.insertCell(-1).innerHTML = 'DFT8 DUTY'
	row.insertCell(-1).innerHTML = 'WEEK TOTAL'
	row.insertCell(-1).innerHTML = 'ROLLING 90'
	header.appendChild(h_table)
	
	
	// content
	
	var content = createDiv(null, 'content', null, null)
	content_container.appendChild(content)
	content.id = name + '_content'
	var c_table = document.createElement('table')
	c_table.addEventListener('click', onTableClick)
	content.appendChild(c_table)
	
	// insert rows into this members column
	for (var i = 0; i < daysInView; i ++) {
		var row = c_table.insertRow(-1)
		for (var ii = 0; ii < 5; ii ++) row.insertCell(-1)
		
		if (days[members[name].startday] == dateTable.rows[i].cells[1].innerHTML)
		row.className = 'startday'
		
		
		if (dateTable.rows[i].cells[1].innerHTML == 'Sun') row.style.background = '#a2bcd4';
		else if (dateTable.rows[i].cells[1].innerHTML == 'Sat') row.style.background = '#d2ecff';
		else if (dateTable.rows[i].cells[1].innerHTML == 'Tue') row.style.background = '#ccc';
		else if (dateTable.rows[i].cells[1].innerHTML == 'Thu') row.style.background = '#ccc';
		else row.style.background = '#fff'
		
		if (dateTable.rows[i].id == today_id) row.style.backgroundColor = '#a4e1b4'
	}
			
	// populate the data we received
	for ( var i = 0; i < data.length; i ++ ) {
		var index = document.getElementById(String(data[i].date)).rowIndex
		c_table.rows[index].cells[0].innerHTML = data[i].duty_type || ''
		if (data[i].duty_type) c_table.rows[index].cells[1].innerHTML = data[i].roster_hours || lookup[data[i].duty_type]['roster_hours'] || ''
		c_table.rows[index].cells[2].innerHTML = data[i].hours_logged || ''
	}	
	
	calculateTotalsLoop(c_table.rows[0], daysInView)

	// adjust width to avoid wrap
	header_container.style.width = header_container.childElementCount * 270 + 'px'
	content_container.style.width = content_container.childElementCount * 270 + 'px'
	
	saveCookie()
}

function removeColumn(id) {
	document.getElementById(id + '_checkbox').checked = false
	document.getElementById(id + '_content').remove()
	document.getElementById(id).remove()
	saveCookie()
}

function calculateTotalsLoop(row, num) {
	if (row.rowIndex + num > daysInView) num = daysInView - row.rowIndex
	console.log('CALC ROWS: ', num)
	for (var i = 0; i < num; i ++) calculateTotals(row.parentElement.rows[row.rowIndex + i])
}

function calculateTotals(row) {
	var rowIndex = row.rowIndex
	var table = row.parentElement
	var duty_type = lookup[row.cells[0].innerHTML] || null

	var todays_hours = parseFloat(row.cells[2].innerHTML) || parseFloat(row.cells[1].innerHTML) || 0
	if (row.className == 'startday' || rowIndex == 0) row.cells[3].innerHTML = parseFloat(row.cells[2].innerHTML) || row.cells[1].innerHTML || ''
	
	else {
		var prev = parseFloat(row.previousSibling.cells[3].innerHTML) || 0
		
		if (prev + todays_hours > 0) row.cells[3].innerHTML = prev + todays_hours
		else row.cells[3].innerHTML = ''
	}
	
	row.cells[3].style.color = parseFloat(row.cells[3].innerHTML) > 40 ? 'red' : 'black'
	
	// calculate rolling 90
	todays_hours = parseFloat(row.cells[2].innerHTML) || 0 // set to logged hours
	if (todays_hours == 0 && duty_type && duty_type['include_rolling'])
		todays_hours = parseFloat(row.cells[1].innerHTML) || 0 // set to rostered hours
		row.cells[4].added_today = todays_hours  // store what we added to R90 total this day
		
	
	
	if ( rowIndex > 0 ) {
		// add yesterdays rolling 90
		todays_hours += parseFloat(row.previousSibling.cells[4].innerHTML) || 0
		
		// subtract the hours from 14 days ago
		if (rowIndex >= 14) todays_hours -= table.rows[rowIndex-14].cells[4].added_today
	}
	
	if ( todays_hours > 0 ) row.cells[4].innerHTML = todays_hours
	
	else row.cells[4].innerHTML = ''
	
	row.cells[4].style.color = todays_hours > 90 ? 'red' : 'black'
}

function onCellSelect(evt) {
	var cell = evt.target.parentNode.parentNode
	cell.innerHTML = evt.target.innerHTML
	sendUpdateToSocket(cell)
	cell.style.border = ''
	var row = cell.parentElement
	row.cells[1].innerHTML = lookup[cell.innerHTML]['roster_hours']
	calculateTotalsLoop(row, 14)
}

function onTableClick(evt) {

	// update changes to DFT8 duty || rostered hours
	if (cell_input.style.display == 'block') {
		cell_input.style.display = 'none'
		var cell = cell_input.parentElement
		var row = cell.parentElement
		cell.style.border = ''
		cell.innerHTML = parseFloat(cell_input.value) || ''
		sendUpdateToSocket(cell)
		calculateTotalsLoop(row, 14)
	}
	
	// update changes to duty type
	if (cell_select.style.display == 'block') {
		cell_select.style.display = 'none'
		if (cell_select.parentElement) cell_select.parentElement.style.border = ''
		return true;
	}
	
	if (evt.target.cellIndex == 2 || evt.target.cellIndex == 1) {// DFT8 duty || rostered Hours
		cell_input.placeholder = evt.target.innerHTML
		cell_input.value = evt.target.innerHTML
		evt.target.innerHTML = ''
		evt.target.appendChild(cell_input)
		cell_input.style.display = 'block'	
		cell_input.parentElement.style.border = "3px solid orange"
		cell_input.setSelectionRange(0,cell_input.value.length)
		cell_input.focus()
	}
	
	if (evt.target.cellIndex == 0) { // Duty Type
		evt.target.appendChild(cell_select)
		cell_select.style.display = 'block'
		cell_select.parentElement.style.border = "3px solid orange"
	}
}


function readySetSwapsies(i,ii) {
	a1.style.position = 'relative'
	a2.style.position = 'relative'
	b1.style.position = 'relative'
	b2.style.position = 'relative'
	a1.style.left = '0px'
	a2.style.left = '0px'
	b1.style.left = '0px'
	b2.style.left = '0px'
						
	x_step = i // amount of steps in animation
	y_step = ii
	incr_x = parseInt((b1.offsetLeft - a1.offsetLeft) / x_step ) // distance to move in each step
	incr_y = parseInt((b1.offsetLeft - a1.offsetLeft) / y_step ) // distance to move in each step
	
	setTimeout(swapsies, 0)
}

function swapsies() {
	if (x_step > 0 && y_step > 0) {
		
		if (x_step > y_step || x_step == y_step) {
			a1.style.left = parseInt(a1.style.left) + incr_x + 'px'
			a2.style.left = parseInt(a2.style.left) + incr_x + 'px'
			x_step --
		}
		
		else if (y_step > x_step || x_step == y_step) {
			b1.style.left = parseInt(b1.style.left) - incr_y + 'px'
			b2.style.left = parseInt(b2.style.left) - incr_y + 'px'
			y_step --
		}
		
		setTimeout(swapsies,40)
			
	}
	
	else {
		b1.parentElement.insertBefore(b1,a1)
		b2.parentElement.insertBefore(b2,a2)
		b1.style.display = ''
		b2.style.display = ''
		a1.style.display = ''
		a2.style.display = ''
		a1.style.left = ''
		a2.style.left = ''
		b1.style.left = ''
		b2.style.left = ''
		saveCookie()
	}
}


function createDiv(innerHTML, className, ID, eventListener) {
	var newDiv = document.createElement('div')
	if (innerHTML) newDiv.innerHTML = innerHTML
	if (className) newDiv.className = className
	if (ID) newDiv.id = id
	if (eventListener) newDiv.addEventListener('click', eventListener)
	return newDiv
}