var scrolling;
var selected_members = []
var members = {}
var lookup = {}
var header_titles = ['duty_type', 'roster_hours', 'hours_logged']
var programs = ['maf', 'laynha']
	
window.onload = function() {
	socketConnect()
	content_container = document.getElementById('content_container')
	header_container = document.getElementById('header_container')
	date_container = document.getElementById('date_container')
	cell_input = document.getElementById('cell_input')
	cell_select = document.getElementById('cell_select')
	cell_select.addEventListener('click', onCellSelect)
	select_columns = document.getElementById('select_columns')
	addTop = document.getElementById('load_prev')
	addBottom = document.getElementById('load_next')
	loading = document.getElementById('loading')
	initScrollHandlers()
	initDateColumn()

}

function onInputKeyPress(e) {
	
	// move focus down row
	if (e.which == 13 || e.which == 40 || e.keyCode == 13 || e.keyCode == 40)
		e.target.parentNode.parentNode.nextSibling.cells[e.target.parentNode.cellIndex].click()
	
	// move focus up row
	if (e.which == 38 || e.keyCode == 38 )
		e.target.parentNode.parentNode.previousSibling.cells[e.target.parentNode.cellIndex].click()
	
	// move focus left
	if (e.which == 37 || e.keyCode == 37 )
		e.target.parentNode.previousSibling.click()
	
	// move focus right
	if (e.which == 39 || e.keyCode == 39 )
		e.target.parentNode.nextSibling.click()

	
}

function initSelectOptions(options) {
	var str = '<span class="red">&#8592;</span><span class="yellow">&#8594;</span>'
	// switch program
	options.unshift( { 'duty_type':'<span class="switch">&#8644;</span><span class="switch" style="color:red">&#8644;</span>', 'swap' : true } )
	//options.unshift( { 'duty_type':str, 'swap' : true } )
	
	// first one blank
	options.unshift( { 'duty_type':'&nbsp;'} )
	
	for (var i in options) {
		lookup[options[i].duty_type] = options[i]
		var div = document.createElement('div')
		div.innerHTML = options[i].duty_type
		div.roster_hours = options[i].roster_hours || ''
		div.swap = options[i].swap || false
		div.include_rolling = options[i].include_rolling
		cell_select.appendChild(div)
	}
}

function initSelectMembers(data) {
	
	console.log('COOKIE: ' + getCookie())
	selected_members = getCookie().split(',')
	
	var div = document.getElementById('select_columns')
	//document.getElementById('open_select_columns').addEventListener('touchstart', function() {
	//	div.style.display = div.style.display == 'none' ? 'block' : 'none'
	//})
	
	maf_pilots = document.getElementById('maf_pilots').childNodes[0]
	var laynha_pilots = document.getElementById('laynha_pilots').childNodes[0]
	
	
	for (var i in data) {
		members[data[i].name] = data[i]
		var check = document.createElement('input')
		var label = document.createElement('label')
		
		check.type = 'checkbox'
		check.id = data[i].name + '_checkbox'
		label.appendChild(check)
		
		label.innerHTML += '  ' + data[i].name
		
		if (data[i].program == 0) maf_pilots.appendChild(label)
		else laynha_pilots.appendChild(label)

		if (selected_members.indexOf(data[i].name) != -1) label.childNodes[0].checked = true
	}
	/*
	var buttn = document.createElement('button')
	buttn.innerHTML = 'Update'
	div.appendChild(buttn)
	buttn.addEventListener('click', updateColumns)*/
}

function updateColumns() {
	//selected_members = []
	var newly_selected = []
	
	for (var i in members) {
		if (document.getElementById(i + '_checkbox').checked) {
			// checkbox is checked... do we need to add this column
			if (selected_members.indexOf(i) == -1) {
				selected_members.push(i)
				newly_selected.push(i)
				}
			//if (document.getElementById(i) == null) 
		} else {
			// checkbox is NOT checked... do we need to remove this column
			if (document.getElementById(i) != null) removeColumn(i)
		}
	}
	
	if (newly_selected.length) {
		loading.style.display = 'block'
		socket.emit('get_data_range', { 'members' : newly_selected, "start":parseInt(dateToInteger(topdate)), "end":parseInt(dateToInteger(lastdate)) })
	}
	
	select_columns.style.display = 'none'
	
	
}

function saveCookie() {
	var checked_cols = []
	for (var i in members) if (document.getElementById(i + '_checkbox').checked) checked_cols.push(i)
	
	var cols = []
	for (var i = 0; i < header_container.childNodes.length; i ++)
		cols.push(header_container.childNodes[i].id)
	
	var exdays = 100
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = 'columns_displayed' + "=" + cols.join() + "; " + expires;
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
	
	if (content_container.childElementCount) {
		var scrollTop = document.documentElement.scrollTop || document.body.scrollTop
		if (scrollTop < 840 ) {
			//addRowsTop(14, scrollTop)
			addTop.style.display = 'block'
		} else addTop.style.display = 'none'
		
		if (scrollTop > 1930) {
			addBottom.style.display = 'block'
			//addRowsBottom(14)
		} else addBottom.style.display = 'none'
	}
}