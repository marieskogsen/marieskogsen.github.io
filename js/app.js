// Global objects
// const api = new NRFCloudAPI("af2cf1f0a9b60f858a98dc956ce7c98a3800857b"); // Marie
const api = new NRFCloudAPI("f41964799625f69d7c32ca15040b251f2b88a6e6"); // Erik
const deviceId = "352656106106472";
let counterInterval;
let requestInterval;
let temp;
let humid;
let weight;
let index;
console.log(index);

// Collection of update functions for different message types of nRFCloud device messages
const updateFunc = {
	Thingy: HUMID => {
		var f_data = parseFloat(HUMID).toFixed(2);
		HUMID = f_data.toString();
		$('#humidity').text(HUMID);
		humid = parseFloat(HUMID);
	},
	"BM-W": RTT => {
		console.log('weight: ',RTT)
		var f_data = parseFloat(RTT).toFixed(2);
		RTT = f_data.toString();
		$('#weight').text(RTT);
		weight = parseFloat(RTT);
	}
}

const updateTemp = {
	Thingy: TEMP => {
		var f_data = parseFloat(TEMP).toFixed(2);
		TEMP = f_data.toString();
		$('#temperature').text(TEMP);
		temp = parseFloat(TEMP);
	}
}

const updateTime = {
	Thingy: TIME => {
		var f_time = parseInt(TIME);
		TIME = f_time*1000;
		var currentDate = new Date(TIME); // TIME is in seconds, need milliseconds as seed, so TIME * 1000 is passed. 
		index = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()+1, 
						currentDate.getHours(), currentDate.getMinutes());
	},
	"BM-W": TIME => {
		// console.log('time',TIME);	
		// var f_time = parseInt(TIME);
		TIME = TIME*1000;
		var currentDate = new Date(TIME*1000); // TIME is in seconds, need milliseconds as seed, so TIME * 1000 is passed. 
		index = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()+1, 
						currentDate.getHours(), currentDate.getMinutes());
	}
}

function checkNRFCloudMessages(new_data, chart, options) {
	
	requestInterval = setInterval(async() =>{
		// instead of this random, you can make an ajax call for the current cpu usage or what ever data you want to display
		
		const { items } = await api.getMessages(localStorage.getItem('deviceId') || '');
		
		(items || [])
		.map(({ message }) => message)
		.forEach(({ appID, TIME, TEMP, RTT, HUMID}) => {
			if (!updateFunc[appID]) {
				console.log('unhandled appID', appID);
				return;
			}
			console.log('appID: ',appID);
			switch(appID) {
				case "Thingy" :
					updateTemp[appID](TEMP);
					updateFunc[appID](HUMID);
					break;
					case "BM-W" :
						updateFunc[appID](RTT);
						break;
					}
					updateTime[appID](TIME);
					
				});
				new_data.addRow([index, temp, humid]);
				chart.draw(new_data, options);
			}, 5000);
}	
//new chart
function drawLast24Hours(){
		// function that is run one time when the website is loaded; will draw stored data
		// from the last 24 hours where the last stored data is initialized as current time.
}

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
	new_data.addColumn("datetime","Time");
	new_data.addColumn("number","Temperature");
	new_data.addColumn("number","Humidity");
	new_data.addRow([new Date(initialDate.getFullYear(),initialDate.getMonth(), initialDate.getDay()+1, initialDate.getHours(), initialDate.getMinutes()), NaN, NaN]);

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
		1: {title: 'Humidity (%)'}
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
	checkNRFCloudMessages(new_data, chart, options);

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
	});
