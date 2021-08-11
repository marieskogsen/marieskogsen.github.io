// Global objects
const api = new NRFCloudAPI("f41964799625f69d7c32ca15040b251f2b88a6e6"); // Erik
const roofId = "nrf-352656106119046"; // Roof
const thingyId = "nrf-352656106101531"; // Thingy31
const deviceId = thingyId;
let counterInterval;
let requestInterval;
let temp;
let humid;
let weight;
let index;
let b_in;
let b_out;

// Collection of update functions for different message types of nRFCloud device messages
/* Update function for the first or only data variable the appID has */
const primaryUpdateFunc = { 
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
	},
	"BEE-CNT": OUT => {
		b_out = parseInt(OUT);
	}
}

/* Update function for appIDs with two data variables */
const secondaryUpdateFunc = { 
	Thingy: TEMP => {
		var f_data = parseFloat(TEMP).toFixed(2);
		TEMP = f_data.toString();
		$('#temperature').text(TEMP);
		temp = parseFloat(TEMP);
	},
	"BEE-CNT": IN => {
		b_in = parseInt(IN);
	}
}

/* Update function for the time stamp connected to each appID */
const updateTime = {
	Thingy: TIME => {
		var f_time = parseInt(TIME);
		TIME = f_time*1000;
		var currentDate = new Date(TIME); // TIME is in seconds, need milliseconds as seed, so TIME * 1000 is passed. 
		index = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 
						currentDate.getHours(), currentDate.getMinutes());
	},
	"BM-W": TIME => {
		// console.log('time',TIME);	
		var f_time = parseInt(TIME);
		TIME = f_time*1000;
		var currentDate = new Date(TIME); // TIME is in seconds, need milliseconds as seed, so TIME * 1000 is passed. 
		index = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 
						currentDate.getHours(), currentDate.getMinutes());
	},
	"BEE-CNT": TIME => {
		var f_time = parseInt(TIME);
		TIME = f_time*1000;
		var currentDate = new Date(TIME); // TIME is in seconds, need milliseconds as seed, so TIME * 1000 is passed. 
		index = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 
						currentDate.getHours(), currentDate.getMinutes());
	}
}


function checkNRFCloudMessages(temp_data, t_chart, t_options,
							   humid_data, h_chart, h_options,
							   weight_data, w_chart, w_options,
							   beecnt_data, b_chart, b_options) {

	
	requestInterval = setInterval(async() =>{
		
		const { items } = await api.getMessages(localStorage.getItem('deviceId') || '');
		
		(items || [])
		.map(({ message }) => message)
		.slice().reverse()
		.forEach(({ appID, TEMP, HUMID, RTT, TIME, IN, OUT }) => {
			if (!primaryUpdateFunc[appID]) {
				console.log('unhandled appID', appID);
				return;
			}
			console.log('appID: ',appID);
			switch(appID) {
				case "Thingy" :
					secondaryUpdateFunc[appID](TEMP);
					primaryUpdateFunc[appID](HUMID);
					updateTime[appID](TIME);
					// update temperature chart
					temp_data.addRow([index, temp]);
					t_chart.draw(temp_data, t_options);
					// update humidity chart
					humid_data.addRow([index, humid]);
					h_chart.draw(humid_data, h_options);
					break;
				case "BM-W" :
					primaryUpdateFunc[appID](RTT);
					updateTime[appID](TIME);
					// update weight chart
					weight_data.addRow([index, weight]);
					w_chart.draw(weight_data, w_options);
					break;
				case "BEE-CNT":
					secondaryUpdateFunc[appID](IN);
					primaryUpdateFunc[appID](OUT);
					updateTime[appID](TIME);
					// update bee counter chart
					beecnt_data.addRow([index, b_in, b_out]);
					b_chart.draw(beecnt_data, b_options);
					break;
				default: 
					break;
				}
			});

	}, 5000);
}	

async function backlogBattery(){
    let test = 0;
    let battery = [];
    let time = [];
    while(test<100){
        let testStart = test;
        let now;
        if(test == 0){
            now = new Date();
        }
        else{
            let buf = parseInt(time[test-1]*1000);
            // $('#temperature').text(now);
            now = new Date(buf);
            // $('#temperature4').text(buf);
        }
        const { items } = await api.getOlderMessages(localStorage.getItem('deviceId') || '', now);
        (items || [])
        .map(({ message }) => message)
        .forEach(({ BAT, TIME}) => {
            if(BAT != null){
                $('#temperature').text(BAT);
                $('#temperature2').text(TIME);
                battery[test] = BAT;
                time[test] = TIME;
                $('#temperature3').text(battery);
                test++;
                $('#temperature4').text("data"+test);
            }   
        });
        if(testStart == test){
            return;
        }
    }
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
					 initialDate.getDate(), initialDate.getHours(), initialDate.getMinutes(), 
					 initialDate.getSeconds()), NaN]);
	
	// create humid data object with default value
	var humid_data = new google.visualization.DataTable();
	humid_data.addColumn("datetime","Time");
	humid_data.addColumn("number","Humidity");
	humid_data.addRow([new Date(initialDate.getFullYear(),initialDate.getMonth(), 
					  initialDate.getDate(), initialDate.getHours(), initialDate.getMinutes(), 
					  initialDate.getSeconds()), NaN]);
	
	// create data object for weight graph
	var weight_data = new google.visualization.DataTable();
	weight_data.addColumn("datetime","Time");
	weight_data.addColumn("number","Weight");
	weight_data.addRow([new Date(initialDate.getFullYear(),initialDate.getMonth(), 
					   initialDate.getDate(), initialDate.getHours(), initialDate.getMinutes(), 
					   initialDate.getSeconds()), NaN]);

	// create data object for beecounter graph
	var beecnt_data = new google.visualization.DataTable();
	beecnt_data.addColumn("datetime","Time");
	beecnt_data.addColumn("number","Bees in");
	beecnt_data.addColumn("number","Bees out");
	beecnt_data.addRow([new Date(initialDate.getFullYear(),initialDate.getMonth(), 
					   initialDate.getDate(), initialDate.getHours(), initialDate.getMinutes(), 
					   initialDate.getSeconds()), NaN, NaN]);
	
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
		title: "Temp (celsius)"
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
		  //max: 70
		},
		title: "Humidity (%)"
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

	  // create options for beecnt object with titles etc.
	let b_options = {
		title: "Bee counter",
		hAxis: {
		  title: "Time"
		},
		series: {
			0: {targetAxisIndex: 0, color: "#007f00"},
			1: {targetAxisIndex: 1, color: "#ee82ee"}
		  },
		vAxes: {
			// Adds titles to each axis.
			0: {title: 'Number of bees in'},
			1: {title: 'Number of bees out'}
		},		
		vAxis: {
			title: "Number of bees"
		}
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
	let b_chart = new google.visualization.LineChart(
		document.getElementById("chart_bee")
	);

	t_chart.draw(temp_data, t_options);
	w_chart.draw(weight_data, w_options);
	h_chart.draw(humid_data, h_options);
	b_chart.draw(beecnt_data, b_options);

	// Checks for messages from cloud and updates charts from messages
	checkNRFCloudMessages(temp_data, t_chart, t_options, 
					 	  humid_data, h_chart, h_options, 
						  weight_data, w_chart, w_options,
						  beecnt_data, b_chart, b_options);

}


// Main function
$(document).ready(() => {
	// Set initial values
	$('#api-key').val(localStorage.getItem('apiKey') || '');
	localStorage.setItem('deviceId', deviceId);

	$('#reboot a').click(() => {
		alert("Restart message sent to nRFCloud");
	});

	// Updates sound state; fill in what determines normal state (0%), woodpecker state (-33%) and swarming (-67%)
	setInterval(async() => {
		
		if (temp >= 30){
			$("#slider").css({
				"transform":"translateX(-33%)"
			});
		}
		else if (temp >= 30){
			$("#slider").css({
				"transform":"translateX(-67%)"
			});
		}
		else{
			$("#slider").css({
				"transform":"translateX(0%)"
			});
		}
	},5000);
});

