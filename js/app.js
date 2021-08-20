// Global objects
const api = getApiKey();
let deviceId = getDeviceId(2);
let counterInterval;
let requestInterval;
let temp;
let temp_arr = [];
let humid;
let humid_arr = [];
let weight;
let index;
let b_in;
let b_out;
let battery = [];
const battery_max = 4200;
const battery_min = 3380;

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
	"BM-W": TEMP => {
		var f_data = parseFloat(TEMP).toFixed(2);
		TEMP = f_data.toString();
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
		let temp_counter = 0, humid_counter = 0; 
		(items || [])
		.map(({ message }) => message)
		.slice().reverse()
		.forEach(({ appID, TEMP, HUMID, RTT, NAME, TIME, IN, OUT, BAT, BTRY }) => {
			if (!primaryUpdateFunc[appID]) {
				battery[3] = ((BAT - battery_min) / (battery_max - battery_min)*100);
				if (battery[3] < 100){
					$('#battery-th91').text(battery[3].toFixed(0)+"%");
				} else {
					$('#battery-th91').text("100 %");
					battery[3] = 100;
				}
				// console.log('unhandled appID', appID);
				return;
			}
			switch(appID) {
				case "Thingy" :
					updateTime[appID](TIME);
					if (NAME == "Hive1"){
						secondaryUpdateFunc[appID](TEMP);
						primaryUpdateFunc[appID](HUMID);
						battery[1] = parseInt(BTRY);
						$('#battery-h1').text(battery[1]+"%");
						temp_arr[0] = temp;
						humid_arr[0] = humid;
						temp_counter++;
						humid_counter++;
					} 
					if (NAME == "Hive2") {					
						secondaryUpdateFunc[appID](TEMP);
						primaryUpdateFunc[appID](HUMID);
						battery[2] = parseInt(BTRY);
						$('#battery-h2 ').text(battery[2]+"%");
						temp_arr[1] = temp;
						humid_arr[1] = humid;
						temp_counter++;
						humid_counter++;
					}
					break;
				case "BM-W" :
					primaryUpdateFunc[appID](RTT);
					secondaryUpdateFunc[appID](TEMP);
					temp_arr[2] = temp;
					temp_counter++;
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

				if (temp_counter == 3){
					// update temperature chart
					temp_data.addRow([index, temp_arr[0], temp_arr[1], temp_arr[2]]);
					t_chart.draw(temp_data, t_options);
					temp_counter = 0;
				}

				if (humid_counter == 2){
					// update humidity chart
					humid_data.addRow([index, humid_arr[0], humid_arr[1]]);
					h_chart.draw(humid_data, h_options);
					humid_counter = 0;
				}
			});

	}, 5000);
}	

async function backlogWeight(weight_data, w_chart, w_options, backlog_start, backlog_end){
    let stamp = 0;
    let time = [];
	let weight_arr = [];
	let m_secondsAday = 86400000;
	let now = new Date();
	let end_time = new Date(now.getTime() - parseInt(backlog_end*m_secondsAday));
	let start_time = new Date(now.getTime() - parseInt(backlog_start*m_secondsAday));
	let start_epoch = start_time.getTime();
    while(start_epoch <= (now.getTime())){
        if(stamp > 0) {
            let buf = parseInt(time[stamp-1]*1000);
            end_time = new Date(buf);
        }
        const { items } = await api.getOlderMessages(/* localStorage.getItem('deviceId') || */ '', end_time, (backlog_start*m_secondsAday));
        (items || [])
        .map(({ message }) => message)
        .forEach(({ RTT, TIME}) => {
			if(RTT != null){
				weight_arr[stamp] = RTT; 
                time[stamp] = TIME;
                stamp++; 
            }   
        });
        if(start_epoch > (end_time.getTime())){
			for (var i = stamp; i >= 0; i--){
				primaryUpdateFunc["BM-W"](weight_arr[i]);
				updateTime["BM-W"](time[i]);
				weight_data.addRow([index,weight]);
			}
			w_chart.draw(weight_data, w_options);
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
	temp_data.addColumn("number","Hive 1");
	temp_data.addColumn("number","Hive 2");
	temp_data.addColumn("number","Outside(BM-W)");
	temp_data.addRow([new Date(initialDate.getFullYear(),initialDate.getMonth(), 
					 initialDate.getDate(), initialDate.getHours(), initialDate.getMinutes(), 
					 initialDate.getSeconds()), NaN, NaN, NaN]);
	
	// create humid data object with default value
	var humid_data = new google.visualization.DataTable();
	humid_data.addColumn("datetime","Time");
	humid_data.addColumn("number","Hive 1");
	humid_data.addColumn("number","Hive 2");
	humid_data.addRow([new Date(initialDate.getFullYear(),initialDate.getMonth(), 
					  initialDate.getDate(), initialDate.getHours(), initialDate.getMinutes(), 
					  initialDate.getSeconds()), NaN, NaN]);
	
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
		title: "Temp (celsius)"
	  },
	  colors: ["#1300bb","#a52714", "#008000"]
	};
	// options for humidity plot
	let h_options = {
		title: "Humidity",
	  hAxis: {
		title: "Time"
	  },
	  vAxis: {
		title: "Humidity (%)"
	  },
	  colors: ["#047377","#de9000"]
	};
	// create options for weight object with titles etc.
	let w_options = {
		title: "Weight",
		hAxis: {
		  title: "Time"
		},
		vAxis: {
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
		vAxis: {
			title: "Number of bees"
		},
		colors: ["#007f00","#ee82ee"]
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

	let starttime,endtime;
	/* max and min values in comments are for valid interval. Values found by trial and error */
	/* interval for oldest data */
	starttime = 15; // max 14.12
	endtime = 11.5; // min 10.5 (thrsday 14:00)
	backlogWeight(weight_data, w_chart, w_options, starttime, endtime);
	/* interval for newest data */
	starttime = 9; // max 8.85
	endtime = 0;
	backlogWeight(weight_data, w_chart, w_options, starttime, endtime);
	setTimeout(checkNRFCloudMessages(temp_data, t_chart, t_options, 
		humid_data, h_chart, h_options, 
	   weight_data, w_chart, w_options,
	   beecnt_data, b_chart, b_options),85000);
	/* Checks for messages from cloud and updates charts from messages */
	// checkNRFCloudMessages(temp_data, t_chart, t_options, 
	// 				 	  humid_data, h_chart, h_options, 
	// 					  weight_data, w_chart, w_options,
	// 					  beecnt_data, b_chart, b_options);

}


function batteryicon_changer(i,object) {
	if (battery[i] >= 80){
				$(object).css({
					"background-color":"#66cd00",
					"width":"80px"
				});
			}
			else if (battery[i] <= 50 && battery[i] >= 20){
				$(object).css({
					"background-color":"#fcd116",
					"width":"50px"
				});
			}
			else{
				$(object).css({
					"background-color":"#ff3333",
					"width":"20px"
				});
			}
	
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
	}, 5000);

	setInterval(async() => {
		for (var i = 0; i < 3; i++) {
			switch(i){
				case 0:
					batteryicon_changer(i,".battery-level1");
					 break;
				case 1:
					batteryicon_changer(i,".battery-level2");
					break;
				case 2:
					batteryicon_changer(i,".battery-level3");
					break;
				default:
					break;
			}
		}
	}, 5000);


});

