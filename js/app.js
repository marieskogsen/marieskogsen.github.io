// Global objects
const api = new NRFCloudAPI("af2cf1f0a9b60f858a98dc956ce7c98a3800857b");
const deviceId = "352656106106472";
let counterInterval;
let requestInterval;
let temp;
let humid;
let index;
console.log(index);

// Collection of update functions for different message types of nRFCloud device messages
const updateFunc = {
	TEMP: data => {
		var f_data = parseFloat(data).toFixed(2);
		data = f_data.toString();
		$('#temperature').text(data);
		temp = parseFloat(data);
	},
	HUMID: data => {
		var f_data = parseFloat(data).toFixed(3);
		data = f_data.toString();
		$('#humidity').text(data);
		humid = parseFloat(data);
		
	}
}

//translate time data to same format as the index value
const updateTime = {
	TEMP: time => {
		var currentDate = new Date(time);
		index = [currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds(), currentDate.getMilliseconds()];
	},
	HUMID: time => {
		var currentDate = new Date(time);
		console.log(time*1000);
		console.log(currentDate);
		index = [currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds(), currentDate.getMilliseconds()];
		console.log(index);

	}
}

function checkNRFCloudMessages() {

	// check nRFCloud messages from the device every 5 seconds
	requestInterval = setInterval(async () => {
		const { items } = await api.getMessages(localStorage.getItem('deviceId') || '');

		(items || [])
		.map(({ message }) => message)
		.forEach(({ appId, data, time }) => {
			if (!updateFunc[appId]) {
				console.log('unhandled appid', appId, data);
				return;
			}
			updateFunc[appId](data);
			updateTime[appId](time);
			
		});
	}, 5000);
}



//new chart
function drawLast24Hours(){
		// function that is run one time when the website is loaded; will draw stored data
		// from the last 24 hours where the last stored data is initialized as current time.
}
/*
// load current chart package
google.charts.load("current", {
	packages: ["corechart", "line"]
  });
  
  // set callback function when api loaded
  google.charts.setOnLoadCallback(drawChart);

  function drawChart() {
	// create data object with default value
	var new_data = new google.visualization.DataTable();
	let initialDate = new Date();
	new_data.addColumn("timeofday","Time");
	new_data.addColumn("number","Temperature");
	new_data.addRow([[initialDate.getHours(),initialDate.getMinutes(),0,0], 0.0]);
	// create options object with titles, colors, etc.
	let options = {
	  title: "Temperature",
	  hAxis: {
		title: "Time"
	  },
	  vAxis: {
		title: "Celsius"
	  }
	};
	// draw chart on load
	let chart = new google.visualization.LineChart(
	  document.getElementById("chart_div")
	);
	chart.draw(new_data, options);


	let currentDate = new Date();
	let index = [currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds(), currentDate.getMilliseconds()];
	setInterval(async() =>{
 	// instead of this random, you can make an ajax call for the current cpu usage or what ever data you want to display
 	
	const { items } = await api.getMessages(localStorage.getItem('deviceId') || '');

	(items || [])
	.map(({ message }) => message)
	.forEach(({ appId, data }) => {
		if (!updateFunc[appId]) {
			console.log('unhandled appid', appId, data);
			return;
		}
		updateFunc[appId](data);
	});

 	new_data.addRow([index, temp]);
 	chart.draw(new_data, options);
	 // update current time index
	currentDate = new Date();
  	index = [currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds(), currentDate.getMilliseconds()];
	}, 5000);

  }
*/
//new chart

google.charts.load("current", {
	packages: ["corechart", "line"]
  });
  
  // set callback function when api loaded
  google.charts.setOnLoadCallback(drawChart);

  function drawChart() {
	// create data object with default value
	var new_data = new google.visualization.DataTable();
	let initialDate = new Date();
	new_data.addColumn("timeofday","Time");
	new_data.addColumn("number","Temperature");
	new_data.addColumn("number","Humidity");
	new_data.addRow([[initialDate.getHours()-2,initialDate.getMinutes(),0,0], 0.0, 0.0]);

	// create options object with titles, colors, etc.
	let options = {
	  title: "Temperature and Humidity",
	  hAxis: {
		title: "Time"
	  },
	  curveType: "function",
	  series: {
		0: {targetAxisIndex: 0},
		1: {targetAxisIndex: 1}
	  },
	  vAxes: {
		// Adds titles to each axis.
		0: {title: 'Temps (Celsius)'},
		1: {title: 'Humdidity (%)'}
	  },
	  vAxis: {
		viewWindow: {
		  max: 50
		}
	  }
	};

	// draw chart on load
	let chart = new google.visualization.LineChart(
	  document.getElementById("chart_hum")
	);
	chart.draw(new_data, options);
	
	setInterval(async() =>{
 	// instead of this random, you can make an ajax call for the current cpu usage or what ever data you want to display
 	
		const { items } = await api.getMessages(localStorage.getItem('deviceId') || '');

		(items || [])
		.map(({ message }) => message)
		.forEach(({ appId, data, time }) => {
			if (!updateFunc[appId]) {
				console.log('unhandled appid', appId, data);
				return;
			}
			updateFunc[appId](data);
			updateTime[appId](time);
		});
		new_data.addRow([index, temp, humid]);
		chart.draw(new_data, options);
	 // update current time index
	/*currentDate = new Date();
  	index = [currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds(), currentDate.getMilliseconds()];
	*/
	}, 5000);

  }

  //end new chart



// Main function
$(document).ready(() => {
	// Set initial values
	$('#api-key').val(localStorage.getItem('apiKey') || '');
	

	$('#api-key').on('input', () => {
		api.accessToken = $('#api-key').val().trim();
		localStorage.setItem('apiKey', api.accessToken);
		loadDeviceNames();
	});
	checkNRFCloudMessages();
	});
