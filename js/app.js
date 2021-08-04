// Global objects
// const api = new NRFCloudAPI("af2cf1f0a9b60f858a98dc956ce7c98a3800857b"); // Marie
const api = new NRFCloudAPI("f41964799625f69d7c32ca15040b251f2b88a6e6"); // Erik

let counterInterval;
let requestInterval;
let temp;
let humid;
let weight;
let index;



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
		var f_time = parseInt(TIME);
		TIME = f_time*1000;
		var currentDate = new Date(TIME); // TIME is in seconds, need milliseconds as seed, so TIME * 1000 is passed. 
		index = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()+1, 
						currentDate.getHours(), currentDate.getMinutes());
	}
}


function checkNRFCloudMessages(temp_data, t_chart, t_options,
							   humid_data, h_chart, h_options,
							   weight_data, w_chart, w_options) {

	
	requestInterval = setInterval(async() =>{
		// instead of this random, you can make an ajax call for the current cpu usage or what ever data you want to display
		
		const { items } = await api.getMessages(localStorage.getItem('deviceId') || '');
		
		(items || [])
		.map(({ message }) => message)
		.slice().reverse()
		.forEach(({ appID, TEMP, HUMID, RTT, TIME }) => {
			if (!updateFunc[appID]) {
				console.log('unhandled appID', appID);
				return;
			}
			console.log('appID: ',appID);
			switch(appID) {
				case "Thingy" :
					updateTemp[appID](TEMP);
					updateFunc[appID](HUMID);
					updateTime[appID](TIME);
					// update temperature chart
					temp_data.addRow([index, temp]);
					t_chart.draw(temp_data, t_options);
					// update humidity chart
					humid_data.addRow([index, humid]);
					h_chart.draw(humid_data, h_options);
					break;
				case "BM-W" :
					updateFunc[appID](RTT);
					updateTime[appID](TIME);
					// update weight chart
					weight_data.addRow([index, weight]);
					w_chart.draw(weight_data, w_options);
					break;
				default: 
					break;
				}
			});

	}, 5000);
}	


google.charts.load("current", {
	packages: ["corechart", "line"]
});
  
// set callback function when api loaded
google.charts.setOnLoadCallback(drawChart);
  
function drawChart() {
	// create temp data object with default value
	var temp_data = new google.visualization.DataTable();
	let initialDate = new Date();
	temp_data.addColumn("datetime","Time");
	temp_data.addColumn("number","Temperature");
	temp_data.addRow([new Date(initialDate.getFullYear(),initialDate.getMonth(), 
					 initialDate.getDate()+1, initialDate.getHours(), initialDate.getMinutes(), 
					 initialDate.getSeconds()), NaN]);
	
	// create humid data object with default value
	var humid_data = new google.visualization.DataTable();
	humid_data.addColumn("datetime","Time");
	humid_data.addColumn("number","Humidity");
	humid_data.addRow([new Date(initialDate.getFullYear(),initialDate.getMonth(), 
					  initialDate.getDay()+1, initialDate.getHours(), initialDate.getMinutes(), 
					  initialDate.getSeconds()), NaN]);
	
	// create data object for weight graph
	var weight_data = new google.visualization.DataTable();
	weight_data.addColumn("datetime","Time");
	weight_data.addColumn("number","Weight");
	weight_data.addRow([new Date(initialDate.getFullYear(),initialDate.getMonth(), 
					   initialDate.getDay()+1, initialDate.getHours(), initialDate.getMinutes(), 
					   initialDate.getSeconds()), NaN]);
	
	// create options object with titles, colors, etc.
	let t_options = {
		title: "Temperature",
	  hAxis: {
		title: "Time"
	  },
	  vAxis: {
		viewWindow: {
		  max: 45,
		  min: 0
		},
		title: "Temperature"
	  }
	};
	// options for humidity plot
	let h_options = {
		title: "Humidity",
	  hAxis: {
		title: "Time"
	  },
	  vAxis: {
		viewWindow: {
		  max: 50
		},
		title: "Humidity"
	  },
	  colors: ["#a52714"]
	};
	// create options for weight object with titles etc.
	let w_options = {
		title: "Weight",
		hAxis: {
		  title: "Time"
		},
		vAxis: {
		  viewWindow: {
			max: 50
		  },
		  title: "Weight (kg)"
		},
		colors: ["#ff9a00"]
	  };

	// draw the three charts on load
	let t_chart = new google.visualization.LineChart(
	  document.getElementById("chart_temp")
	);
	let w_chart = new google.visualization.LineChart(
		document.getElementById("chart_weight")
	);
	let h_chart = new google.visualization.LineChart(
		document.getElementById("chart_hum")
	);

	t_chart.draw(temp_data, t_options);
	w_chart.draw(weight_data, w_options);
	h_chart.draw(humid_data, h_options);

	//update messages
	checkNRFCloudMessages(temp_data, t_chart, t_options, 
					 	  humid_data, h_chart, h_options, 
						  weight_data, w_chart, w_options);

}


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

