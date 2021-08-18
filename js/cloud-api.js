// nRF Cloud REST API functions

class NRFCloudAPI {
	constructor(token) {
		this.accessToken = token;
	}

	async request(endpoint, { body, method = 'POST' } = {}) {
		const response = await fetch(`https://api.nrfcloud.com/v1${endpoint}`, Object.assign({
			method,
			mode: 'cors',
			headers: Object.assign({
				Accept: 'application/json',
				Authorization: `Bearer ${this.accessToken}`,
			}, body ? {
				'Content-Type': 'application/json'
			} : undefined),
		}, body ? { body } : undefined));
		if (response.headers.get('content-type') === 'application/json' &&
			response.headers.get('content-length') !== '0') {
			return response.json();
		}
		return response.text();
	}

	get(endpoint) {
		return this.request(endpoint, {
			method: 'GET'
		});
	}

	delete(endpoint) {
		return this.request(endpoint, {
			method: 'DELETE'
		});
	}

	post(endpoint) {
		return this.request(endpoint, {
			method: 'POST'
		});
	}

	// Example calls, not used in pizza app
	// https://docs.api.nrfcloud.com/api/api-rest.html#nrf-cloud-device-rest-api-account
	account() {
		return this.get('/account');
	}
	createAccountDeviceAndCertificate() {
		return this.request('/account/certificates');
	}
	listAccountCertificates() {
		return this.get('/account/certificates');
	}
	deleteAccountCertificate(certificateId) {
		return this.delete(`/account/certificates/${certificateId}`);
	}


	// Get devices: https://docs.api.nrfcloud.com/api/api-rest.html#nrf-cloud-device-rest-api-devices-all-types-
	devices() {
		return this.get('/devices');
	}

	// Get messages: https://docs.api.nrfcloud.com/api/api-rest.html#nrf-cloud-device-rest-api-messages
	getMessages(deviceId) {
		const end = new Date();
		const start = this.getMessages_start || new Date(end - 86400000);
		this.getMessages_start = new Date();
		const devIdsParam = deviceId ? `&deviceIdentifiers=${deviceId}` : '';
		return this.get(`/messages?inclusiveStart=${start.toISOString()}&exclusiveEnd=${end.toISOString()}${devIdsParam}&pageLimit=100`);
	}

	getOlderMessages(deviceId, to, msecs_back) {
        const end = new Date(to);
        const start = new Date(to - msecs_back);
        const devIdsParam = deviceId ? `&deviceIdentifiers=${deviceId}` : '';
        return this.get(`/messages?inclusiveStart=${start.toISOString()}&exclusiveEnd=${end.toISOString()}${devIdsParam}&pageLimit=100`);
}

	sendMessages() {
		this.sendMessages_start = new Date();
		return this.post('{"message":"BLE_status"}');
	}

}



