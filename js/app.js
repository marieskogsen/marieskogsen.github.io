// Global objects
const api = new NRFCloudAPI("af2cf1f0a9b60f858a98dc956ce7c98a3800857b");
let counterInterval;
let requestInterval;
let temp;
let humid;
let index;
let fake_weight;


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
		
	},
	RSRP: data => {
		var f_data = parseFloat(data).toFixed(2);
		data = f_data.toString();
		$('#weight').text(data);
		fake_weight = parseFloat(data);
	}
}

//translate time data to same format as the index value
const updateTime = {
	TEMP: time => {
		var currentDate = new Date(time);
		index = new Date(currentDate.getFullYear(), currentDate.getMonth(), 
						currentDate.getDay()+1, currentDate.getHours(), currentDate.getMinutes(), 
						currentDate.getSeconds());
	},
	HUMID: time => {
		var currentDate = new Date(time);
		index = new Date(currentDate.getFullYear(), currentDate.getMonth(), 
						currentDate.getDay()+1, currentDate.getHours(), currentDate.getMinutes(), 
						currentDate.getSeconds());
	},
	RSRP: time => {
		var currentDate = new Date(time);
		index = new Date(currentDate.getFullYear(), currentDate.getMonth(), 
						currentDate.getDay()+1, currentDate.getHours(), currentDate.getMinutes(), 
						currentDate.getSeconds());
	}
}


function checkNRFCloudMessages(temp_data, t_chart, t_options,
							   humid_data, h_chart, h_options,
							   weight_data, w_chart, w_options) {

	// check nRFCloud messages from the device every 5 seconds
	requestInterval = setInterval(async () => {
		const { items } = await api.getMessages(localStorage.getItem('deviceId') || '');

		(items || [])
		.map(({ message }) => message)
		.slice().reverse()
		.forEach(({ appId, data, time }) => {
			if (!updateFunc[appId]) {
				console.log('unhandled appid', appId, data);
				return;
			}
			updateFunc[appId](data);
			updateTime[appId](time);
			// update temperature chart
			temp_data.addRow([index, temp]);
			t_chart.draw(temp_data, t_options);
			// update humidity chart
			humid_data.addRow([index, humid]);
			h_chart.draw(humid_data, h_options);
			// update weight chart
			weight_data.addRow([index, fake_weight]);
			w_chart.draw(weight_data, w_options);
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
					 initialDate.getDay()+1, initialDate.getHours(), initialDate.getMinutes(), 
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

	// draw the two charts on load
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
