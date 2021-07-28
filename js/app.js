// Global objects

const api = new NRFCloudAPI("af2cf1f0a9b60f858a98dc956ce7c98a3800857b");
const deviceId = "352656106106472";
let counterInterval;
let requestInterval;


// Collection of update functions for different message types of nRFCloud device messages
const updateFunc = {
	TEMP: data => {
		$('#temperature').text(data);
	}
}

function orderPizza() {

	// check nRFCloud messages from the device every 5 seconds
	requestInterval = setInterval(async () => {
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
	}, 5000);

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
	orderPizza();
	});
