var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
var editlock = false
var socket = null

window.onload = function() {
	table = document.getElementById('table')
	lookupTable = document.getElementById('lookupTable')
	
	daySelect = document.createElement('select')
	for (i in days) {
		var o = document.createElement('option')
		o.text = days[i]
		daySelect.add(o)
	}
	
	programSelect = document.createElement('select')
	var opt1 = document.createElement('option')
	var opt2 = document.createElement('option')
	opt1.text = 'MAF'
	opt2.text = 'LAYNHA'
	programSelect.add(opt1)
	programSelect.add(opt2)
	
	showSaveMember = function(e) { e.target.parentElement.parentElement.cells[4].childNodes[0].style.display = 'block' }
	showSaveLookup = function(e) { e.target.parentElement.parentElement.cells[5].childNodes[0].style.display = 'block' }

	if(connect()) {
		getMembers()
		getLookupData()
		getHolidays()
	}
	
	else fill_dummy_data()
	
}

function insertMembersInputRow() {
	var row = table.insertRow(-1)
	for (var x = 0; x < 6; x ++) row.insertCell(-1)
	fillRow(row, {'name':'', 'startday':0, 'active':true})
}

function insertLookupInputRow() {
	var row = lookupTable.insertRow(-1)
	for (var x = 0; x < 7; x ++) row.insertCell(-1)
	fillLookupRow(row, {'duty_type':'', 'roster_hours':'', 'include_rolling':true, 'include_in_week':true, 'availability': ''})
}

function fill_dummy_data() {
	var dummy_data = { 'name' : 'Mr Pilot', 'active' : false, 'startday' : 3, 'program' : 1 }
	for (var i = 0; i < 5; i ++) {
		row = table.insertRow(-1)
		for (var x = 0; x < 6; x ++) row.insertCell(-1)
		fillRow(row, dummy_data)
	}
	
	insertMembersInputRow()
	
	var dummy_lookup = {'duty_type' : 'GA8', 'roster_hours' : 10, 'include_rolling': true, 'include_in_week':true, 'availability' : .9 }
	for (var i = 0; i < 10; i ++ ) {
		row = lookupTable.insertRow(-1)
		for (var x = 0; x < 6; x ++) row.insertCell(-1)
		fillLookupRow(row, dummy_lookup)
	}
	
	insertLookupInputRow()
}

function connect() {
	
	try {
	
		if (location.href.indexOf('rhcloud') != -1 ) 
			socket = io.connect('http://node-alroster.rhcloud.com:8000');
		else socket = io.connect('192.168.1.2:3000');
		
		
	} catch (e) { return false }
	
	return true
}

function getMembers() {
	socket.emit('get_all_members')
		
	socket.on('sent_all_members', function(data) {
		for (i in data) {
			if(data[i].name.length){
				row = table.insertRow(-1)
				for (var x = 0; x < 6; x ++) row.insertCell(-1)
				fillRow(row, data[i])
			}
		}
		
		socket.on('backup', function(csv) {
			
			var element = document.createElement('a');
			element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csv));
			element.setAttribute('download', 'MAF_Roster.csv');
			
			element.style.display = 'none';
			document.body.appendChild(element);

			element.click();

			document.body.removeChild(element);
		})
		
		socket.on('sent_date', function(date) {
			console.log(date); 
			dd = date;
		})
		
		insertMembersInputRow()
	})
}

function getLookupData() {
	socket.emit('get_lookup_data')
	
	socket.on('sent_lookup_data', function(data) {
		// fields - duty_type, roster_hours, include_rolling, availability
		
		for (i in data) {
			if (data[i].duty_type) {
				row = lookupTable.insertRow(-1)
				for (var x = 0; x < 7; x ++) row.insertCell(-1)
				fillLookupRow(row, data[i])
			}
		}
		insertLookupInputRow()
	})
}

function fillRow(row, data) {
	
	row.cells[1].innerHTML = '<input type="checkbox" style="margin:0"/>'
	row.cells[1].childNodes[0].addEventListener('change', showSaveMember)
	if (data.active) row.cells[1].childNodes[0].checked = true
	
	row.cells[2].appendChild(daySelect.cloneNode(true))
	row.cells[2].childNodes[0].addEventListener('change', showSaveMember)
	row.cells[2].childNodes[0].options.selectedIndex = data.startday
	
	row.cells[3].appendChild(programSelect.cloneNode(true))
	row.cells[3].childNodes[0].addEventListener('change', showSaveMember)
	row.cells[3].childNodes[0].options.selectedIndex = data.program || 0
	
	row.cells[4].innerHTML = '<a href="#" style="display:none" onclick="return save(this.parentNode.parentNode.rowIndex - 1)">save</a>'
	row.cells[5].innerHTML = '<a href="#" onclick="return deleteMember(this.parentNode.parentNode.rowIndex -1)"> X </a>'
	
	
	if (data.name.length) row.cells[0].innerHTML = '<input type="text" placeholder = "'+data.name+'" value="'+data.name+'"/>'
	else {
		row.cells[0].innerHTML = '<input type="text" placeholder = "Enter Name"/>'
		row.cells[5].childNodes[0].style.display = 'none'
	}
	row.cells[0].childNodes[0].addEventListener('focus', showSaveMember)
}

function fillLookupRow(row, data) {
	row.cells[1].innerHTML = '<input type="text" style = "width:50px" value = "' + data.roster_hours + '"/>'
	row.cells[1].childNodes[0].addEventListener('focus', showSaveLookup)
	
	row.cells[2].innerHTML = '<input type = "checkbox" style="margin:0"/>'
	row.cells[2].childNodes[0].addEventListener('change', showSaveLookup)
	if (data.include_rolling) row.cells[2].childNodes[0].checked = true;

	row.cells[3].innerHTML = '<input type = "checkbox" style="margin:0"/>'
	row.cells[3].childNodes[0].addEventListener('change', showSaveLookup)
	if (data.include_in_week) row.cells[3].childNodes[0].checked = true;
	
	row.cells[4].innerHTML = '<input type="text" style="width:50px" value = "' + data.availability + '"/>'
	row.cells[4].childNodes[0].addEventListener('focus', showSaveLookup)
	
	row.cells[5].innerHTML = '<a href="#" style="display:none" onclick="return saveLookup(this.parentNode.parentNode.rowIndex - 1)">save</a>'
	row.cells[6].innerHTML = '<a href="#" onclick="return deleteLookup(this.parentNode.parentNode.rowIndex -1)"> X </a>'
	
	if (data.duty_type.length) row.cells[0].innerHTML = data.duty_type
	else {
		row.cells[0].innerHTML = '<input type="text" style="width:100px" placeholder = "Enter Type"/>'
		row.cells[0].childNodes[0].addEventListener('focus', showSaveLookup)
		row.cells[6].childNodes[0].style.display = 'none'
	}
}

function save(index) {
	
	var savedata = checkMemberData(index)
	
	if (savedata) {

		if (socket) socket.emit('add_member', savedata)
		
		if (index +2 == table.rows.length) { // new row
			table.rows[index+1].cells[0].innerHTML = '<input type="text" value="'+savedata.name+'"/>'
			table.rows[index+1].cells[5].childNodes[0].style.display = 'block'		
			insertMembersInputRow()
		}
		table.rows[index+1].cells[0].childNodes[0].placeholder = savedata.name
		table.rows[index+1].cells[4].childNodes[0].style.display='none'
	}
	
	return false
}	

function getCSV() {
	var start = checkDateValue(document.getElementById('exportFrom').value) || null
	var end = checkDateValue(document.getElementById('exportTo').value) || null
	if (start == null || end == null) alert('Invalid date.  Please enter a valid date - dd/mm/yy')
	
	else  {// date should be valid
		socket.emit('backup', start, end)
		console.log('REQ: CSV data',start,end)
	}
}

function checkDateValue(d) {
	if (d.length != 8) return null
	var dd = parseInt(d.substring(0,2))
	var mm = parseInt(d.substring(3,5))
	var yy = parseInt(d.substring(6,8))
	
	if (dd == null || mm == null || yy == null) return null
	if (dd > 31) return null
	if (mm > 12) return null
	mm--
	
	dd = dd > 9 ? String(dd) : '0' + dd
	mm = mm > 9 ? String(mm) : '0' + mm
	yy = String(yy += 2000)
	
	return yy + mm + dd
	
}

function checkMemberData(index) {
	var savedata = {}
	
	savedata.name = table.rows[index+1].cells[0].childNodes[0].value
	if (! /^([a-zA-Z0-9 '_-]+)$/.test(savedata.name)) {
		alert('Sorry, I can\'t pronounce that name!  Try omitting the special characters.')
		return null
	}
	
	if (savedata.name.length > 20) {
		alert('Are we writing a novel here?  Maximum of 20 characters is allowed for the name.')
		return null
	}
	
	for (var i = 0; i < table.rows.length; i ++ )
		if (table.rows[i].cells[0].innerHTML.localeCompare(savedata.name) == 0) {
			alert('Name already exists')
			return null
		}
		
	if (index +2 < table.rows.length) { // existing member
		if (table.rows[index+1].cells[0].childNodes[0].value
			!= table.rows[index+1].cells[0].childNodes[0].placeholder)
				savedata.old_name = table.rows[index+1].cells[0].childNodes[0].placeholder
	}
	
	savedata.active = table.rows[index+1].cells[1].childNodes[0].checked
	savedata.startday = table.rows[index+1].cells[2].childNodes[0].selectedIndex
	savedata.program = table.rows[index+1].cells[3].childNodes[0].selectedIndex
		
	console.log(savedata)
	return savedata
}

function deleteMember(index) {
	var r = confirm("Sure you want to delete this member? \n This action cannot be undone.")
	if (r) { 
		if (socket) {
		
			socket.emit('delete_member', {'name': table.rows[index+1].cells[0].childNodes[0].value} )
		} else {
			console.log('no connection')
		}
		table.rows[index+1].remove()
	}
	
	return false
}

function saveLookup(index) {
	var savedata = checkLookupData(index)
	
	if (savedata) {
		if (socket) socket.emit('update_lookup', savedata)
		
		if (index +2 == lookupTable.rows.length) { // new row
			lookupTable.rows[index+1].cells[0].innerHTML = savedata.duty_type
			lookupTable.rows[index+1].cells[6].childNodes[0].style.display = 'block'		
			insertLookupInputRow()
		}
		
		lookupTable.rows[index+1].cells[5].childNodes[0].style.display='none'
	}
	
	return false
}

function deleteLookup(index) {
	var r = confirm("Sure you want to delete this item? \n This action cannot be undone.")
	if (r) { 
		if (socket) socket.emit('delete_lookup', {'duty_type': lookupTable.rows[index+1].cells[0].innerHTML } )
		lookupTable.rows[index+1].remove()
	}
	
	return false
}

function checkLookupData(index) {

	
	var savedata = {}
	if (index +2 == lookupTable.rows.length) { // new item
		savedata.duty_type = lookupTable.rows[index+1].cells[0].childNodes[0].value
		if (! /^([a-zA-Z0-9 '_-]+)$/.test(savedata.duty_type)) {
			alert('Please enter a valid value for: Duty Type')
			return null;
		}
		
		if (savedata.duty_type.length > 8) {
			alert('Are we writing a novel here?  Maximum of 8 characters is allowed for duty type.')
			return null
		}
		
		for (var i = 0; i < lookupTable.rows.length; i ++ )
			if (lookupTable.rows[i].cells[0].innerHTML.localeCompare(savedata.duty_type) == 0) {
				alert('Duty type already exists')
				return null;
			}
			
	} else savedata.duty_type = lookupTable.rows[index+1].cells[0].innerHTML
	
	
	if (!lookupTable.rows[index+1].cells[1].childNodes[0].value.length) savedata.roster_hours = '';
	else {
		savedata.roster_hours = parseFloat(lookupTable.rows[index+1].cells[1].childNodes[0].value) 
		if (!savedata.roster_hours) {
			alert('Please enter a valid value for: Roster Hours')
			return null;
		}
	}
	
	savedata.include_rolling = lookupTable.rows[index+1].cells[2].childNodes[0].checked
	savedata.include_in_week = lookupTable.rows[index+1].cells[3].childNodes[0].checked
	savedata.availability = parseFloat(lookupTable.rows[index+1].cells[4].childNodes[0].value) || ''
		
//	console.log(savedata)
	return savedata
}

function getHolidays() {
	socket.emit('get_holidays')
		
	socket.on('sent_holidays', function(data) {
		for (var i in data) {
			insertHolidayRow(dateFromInt(data[i].date), data[i].occasion)
		}
	})
}

function saveHoliday() {
	
	// get and check date & ocassion
	var date = checkHolidayDate(parseMyDate(document.getElementById("holiday_date").value))
	if (date == null) return
	var occasion = checkHolidayOccasion(document.getElementById("holiday_occasion").value)

	// continue if valid values
	if (occasion != null) {
		
		//add row
		insertHolidayRow(getDateString(date), occasion)

		//save to database
		var savedata = {"date": dateToInteger(date), "occasion":occasion}
		if (socket) socket.emit('save_holiday', savedata)
		
		// clear fields
		document.getElementById("holiday_date").value = ""
		document.getElementById("holiday_occasion").value = ""
	}
}

function insertHolidayRow(date, occasion) {
	var table = document.getElementById("publicHolidays")
	row = table.insertRow(table.rows.length-1)
	for (var i = 0; i < 3; i ++) row.insertCell()
	row.cells[0].innerHTML = "<div>" + date + "</div>"
	row.cells[1].innerHTML = "<div>" + occasion + "</div"
	row.cells[2].innerHTML = '<a href="#" onclick="return deleteHoliday(this.parentNode.parentNode.rowIndex -1)"> X </a>'
}

function deleteHoliday(row) {
	var table = document.getElementById("publicHolidays")

	var date_obj = parseMyDate(table.rows[row+1].cells[0].childNodes[0].innerHTML)
	var date_int = dateToInteger(date_obj)
	socket.emit('delete_holiday', { "date": date_int })
	table.rows[row+1].remove()
	return false
}

function checkHolidayDate(date) {
	if (isNaN(date)) {
		alert("Please select a date for this holiday.")
		return null
	}
	
	return date
}

function checkHolidayOccasion(occasion) {

	if (occasion.length == 0) {
		alert('Please enter a name for this holiday.')
		return null
	}

	if (! /^([a-zA-Z0-9 '_-]+)$/.test(occasion)) {
		alert('Sorry, I can\'t pronounce that name!  Try omitting the special characters.')
		return null
	}
	
	if (occasion.length > 20) {
		alert('Are we writing a novel here?  Maximum of 20 characters is allowed for the name.')
		return null
	}
	
	return occasion
}

function dateFromInt(int_date) {
	date = new Date()
	var yy = parseInt(int_date.substring(0,4))
	var mm = parseInt(int_date.substring(4,6))
	var dd = parseInt(int_date.substring(6,8))
	
	date.setYear(yy)
	date.setMonth(mm)
	date.setDate(dd)
	
	return getDateString(date)
}

function dateToInteger(date) {
	var yy = date.getFullYear()
	var mm = date.getMonth()
	var dd = date.getDate()	
	return String(yy) + (mm < 10 ? '0' + mm : String(mm)) + (dd < 10 ? '0' + dd : String(dd))
}