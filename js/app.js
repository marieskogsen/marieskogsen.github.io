// Global objects

const api = new NRFCloudAPI(localStorage.getItem('apiKey'));
let counterInterval;
let requestInterval;


// Load devices from nRFCloud api and populate list in settings view
function loadDeviceNames() {
	$('#device-list').empty().append('Refreshing device list...');
	api.devices().then(({ items }) => {
		if (items.length < 1) {
			throw new Error();
		}
		$('#device-list').empty();
		items.forEach(({ id, name }) => {
			const deviceItem = $(`<a class="list-group-item list-group-item-action">${name}</a>`);
			deviceItem.click(() => {
				$('#device-list').children().removeClass('active');
				deviceItem.addClass('active');
				localStorage.setItem('deviceId', id);
			});
			$('#device-list').append(deviceItem);
		});
	})
		.catch(() => $('#device-list').empty().append('No devices found.'));
}

// Collection of update functions for different message types of nRFCloud device messages
const updateFunc = {
	TEMP: data => {
		$('#temperature').text(data);
	}
}

function orderPizza() {
	// stop previous intervals if there was an order already
	clearInterval(counterInterval);
	clearInterval(requestInterval);

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
	$('body').tooltip({ selector: '[data-toggle="tooltip"]' });

	// Main logo toggling fullscreen
	$('#mainlogo').click(() => document.documentElement.webkitRequestFullScreen());

	// Tab bar view selector buttons:
	$('.view-btn').click(({ target }) => {
		const id = target.id.replace('Btn', '');

		['splash', 'order', 'track', 'settings']
			.filter(key => key !== id)
			.forEach(key => {
				$(`#${key}View`).removeClass('d-flex').addClass('d-none');
				$(`#${key}Btn`).removeClass('text-white').addClass('nrf-light-blue');
			});

		$(`#${id}Btn`).removeClass('nrf-light-blue').addClass('text-white');
		$(`#${id}View`).removeClass('d-none').addClass('d-flex');

		if (id === 'settings') {
			loadDeviceNames();
		}
		if (id === 'track') {
			leafletMap.invalidateSize();
		}
	});

	// Settings view, api key change:
	$('#api-key').on('input', () => {
		api.accessToken = $('#api-key').val().trim();
		localStorage.setItem('apiKey', api.accessToken);
		
	});


	});
});