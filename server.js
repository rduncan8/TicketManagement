//Reed Duncan

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var mysql = require('mysql');
var db = mysql.createConnection({
	host: 'localhost',
	user: 'rduncan',
});

db.connect(function(err){
	if(err) console.log(err);
	console.log('db connected');
});

var newHtml = '<form id="form" name="form" action="">';
newHtml += '<h2>First Name:  <input name="firstName" id="firstName" autocomplete="off" required/></h2>';
newHtml += '<h2>Last Name:  <input name="lastName" id="lastName" autocomplete="off" required /></h2>';
newHtml += '<h2>Phone Number:  (';
newHtml += '<input name="phoneNumber1" id="phoneNumber1" autocomplete="off" size="3" placeholder="xxx" required />)-';
newHtml += '<input name="phoneNumber2" id="phoneNumber2" autocomplete="off" size="3" placeholder="xxx" required />-';
newHtml += '<input name="phoneNumber3" id="phoneNumber3" autocomplete="off" size="4" placeholder="xxxx" required /></h2>';
newHtml += '<h2>Ticket Number:  <input name="ticketNumber" id="ticketNumber" autocomplete="off" required /></h2>';
newHtml += '<h2>Today\'s Date:  ';
newHtml += '<input name="month" id="month" autocomplete="off" size="3" placeholder="mm" required />/';
newHtml += '<input name="day" id="day" autocomplete="off" size="3" placeholder="dd" required />/';
newHtml += '<input name="year" id="year" autocomplete="off" size="4" placeholder="yyyy" required /></h2>';
newHtml += '<h2>Note:<br /><textarea id="notes" rows="8" cols="100"></textarea></h2>';
newHtml += '<div class="submit" id="submit"><h2>Submit</h2></div></form>';

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
	db.query('USE myProject');
	console.log('a user connected');
	getTickets();
	io.emit('set new', newHtml);

	socket.on('disconnect', function(){
		console.log('a user disconnected');
	});

	function getTickets(){
		db.query('SELECT id, ticketNumber, firstName, lastName FROM service', function(err, res, cols){
			if(err) throw err;
			var html = '<div class="record" id="new"><h2>New Ticket</h2><h3> </h3></div>';
			for(var i = 0; i < res.length; i++)
				html += '<div class="record" id="'+res[i].id+'"><h2>'+res[i].firstName+' '+res[i].lastName+'</h2>'+'<h3>Ticket: '+res[i].ticketNumber+'</h3></div>';
			io.emit('set tickets', html);
		});
	}

	socket.on('get record', function(id){
		var html = '';
		if(id != 'new'){
			db.query('SELECT * FROM service WHERE id = ' + id + ';', function(err, res, cols){
			for(var i = 0; i < res.length; i++){
				html += '<h2>Name: '+res[i].firstName+' '+res[i].lastName+'</h2>';
				var number = res[i].phoneNumber;
				var num1 = number.slice(0, 3);
				var num2 = number.slice(3, 6);
				var num3 = number.slice(6, 10);
				html += '<h2>Phone Number: ('+num1+')-'+num2+'-'+num3+'</h2>';
				html += '<h2>Ticket: '+res[i].ticketNumber+'</h2>';
				html += '<h2>Date : '+res[i].date+'</h2>';
				if(res[i].note != 'NULL')
					html += '<h2>Notes: '+res[i].note+'</h2>';
				else
					html += '<h2>Notes: </h2>';
				html += '<div class="delete" id="'+res[i].id+'"><h2>Delete</h2></div>';
			}
			io.emit('set record', html);
			});
		}else{
			io.emit('set new', newHtml);
		}
	});

	socket.on('new record', function(dict){
		if(dict['note'] == '')
			dict['note'] = 'NULL';
		var values = 'NULL, "' + dict['firstName'] + '", "' + dict['lastName'] + '", "' + dict['phoneNumber'] + '", "' + dict['ticketNumber'] + '", "' + dict['date'] + '", "' + dict['note'] + '"';
		var query = 'INSERT INTO service (id, firstName, lastName, phoneNumber, ticketNumber, date, note) VALUES (' + values + ');';
		db.query(query, function(err){
			if(err) throw err;
		});
		getTickets();
	});

	socket.on('delete record', function(id){
		var query = 'DELETE FROM service WHERE id = ' + id + ';';
		db.query(query, function(err){
			if(err) throw err;
		});
		getTickets();
		io.emit('set new', newHtml);
	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});