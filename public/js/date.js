var days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
var daysInView = 40;
var topdate, lastdate, today_id;


function initDateColumn() {
	dateTable = document.getElementById('date_table')
	today = new Date()
	topdate = new Date()
	lastdate = new Date()
	
	topdate.setDate(today.getDate() -7)
	lastdate.setDate(today.getDate() -7)
	
	
	today_id = '_'+today.getFullYear() +'_'+ today.getMonth() +'_'+ today.getDate()
	
	for (var i = 0; i < daysInView; i ++) {
		row = dateTable.insertRow(-1)
		row.insertCell(-1).innerHTML = lastdate.getDate() + ' ' + months[lastdate.getMonth()]
		row.insertCell(-1).innerHTML = days[lastdate.getDay()]
		row.id = '_'+lastdate.getFullYear() +'_'+ lastdate.getMonth() +'_'+ lastdate.getDate()
		
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
}
