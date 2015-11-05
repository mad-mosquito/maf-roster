var options, pilots, scrolling;
var header_titles = ['duty_type', 'roster_hours', 'hours_logged']
	
window.onload = function() {
	socketConnect()
	content_container = document.getElementById('content_container')
	header_container = document.getElementById('header_container')
	date_container = document.getElementById('date_container')
	cell_input = document.getElementById('cell_input')
	cell_select = document.getElementById('cell_select')
	cell_select.addEventListener('click', onCellSelect)
	
	initScrollHandlers()
	initDateColumn()

}

function initSelectOptions() {
	
	for (var i in options) {
		var div = document.createElement('div')
		div.innerHTML = i
		cell_select.appendChild(div)
	}
}

function initSelectPilots() {
	console.log(getCookie())
	selected_pilots = getCookie().split(',')
	var div = document.getElementById('select_columns')
	document.getElementById('open_select_columns').addEventListener('click', function() {
		div.style.display = div.style.display == 'none' ? 'block' : 'none'
	})
	
	
	for (var i in pilots) {
		
		var check = document.createElement('input')
		var label = document.createElement('label')
		
		check.type = 'checkbox'
		check.id = i + '_checkbox'
		label.appendChild(check)
		
		label.innerHTML += '  ' + pilots[i]
		div.appendChild(label)

		if (selected_pilots.indexOf(i) != -1) label.childNodes[0].checked = true
	}
	
	var buttn = document.createElement('button')
	buttn.innerHTML = 'UPDATE'
	div.appendChild(buttn)
	buttn.addEventListener('click', updateColumns)
}

function updateColumns() {
	var columns_to_add = []
	for (var i in pilots) {
		if (document.getElementById(i + '_checkbox').checked) {
			// checkbox is checked... do we need to add this column
			if (document.getElementById(i) == null) columns_to_add.push(i)
		} else {
			// checkbox is NOT checked... do we need to remove this column
			if (document.getElementById(i) != null) removeColumn(i)
		}
	}
	
	if (columns_to_add.length) socket.emit('get_roster_data', columns_to_add)
	document.getElementById('select_columns').style.display = 'none'
	
	saveCookie()
}

function saveCookie(cols) {
	var checked_cols = []
	for (var i in pilots) if (document.getElementById(i + '_checkbox').checked) checked_cols.push(i)
	var exdays = 100
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = 'columns_displayed' + "=" + checked_cols.join() + "; " + expires;
}

function getCookie() {
    var name = 'columns_displayed='
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return "";
} 

function initScrollHandlers() {
	
	
	window.addEventListener('scroll', function(e) { 
		if (!scrolling) {
			setTimeout(updateScroll, 4)
			scrolling = true;
		}
	})
}

function updateScroll() {
	header_container.style.left = window.pageXOffset *-1 + 'px'
	date_container.style.top = window.pageYOffset *-1 + 100 + 'px'
	scrolling = false;
}

function initRosterColumn() {
	var title = document.createElement('div')
	
}