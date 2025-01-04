let vinData = null;
const VIN_DEMO = 'JHMCB7559NC000001';
const CHASSIS_DEMO = 'SJ30012345';

const displayVIN = vin => {
	const display = document.getElementById('vinDisplay');
	display.innerHTML = '';

	const sections =
		vin.length === 17
			? {
					wmi: ['Country', 'Manufacturer', 'Type'],
					vds: ['Series', 'Series', 'Series', 'Body/Trans', 'Grade', 'Check'],
					vis: ['Year', 'Plant', 'Serial', 'Serial', 'Serial', 'Serial', 'Serial', 'Serial'],
			  }
			: {
					pre: ['Car Line', 'Engine', 'Body/Trans', 'Generation'],
					serial: ['#', '#', '#', '#', '#', '#'],
			  };

	let currentIndex = 0;
	Object.entries(sections).forEach(([section, types]) => {
		types.forEach(type => {
			const cell = document.createElement('div');
			cell.className = 'cell';
			cell.setAttribute('data-section', section);
			cell.setAttribute('data-type', type);
			if (vin.length === 17 && type === 'Year') cell.setAttribute('title', vinData['1981-present'].vis.position10.note);
			if (vin.length === 17 && type === 'Serial') cell.setAttribute('title', vinData['1981-present'].vis.positions12_17.notes.join('\n'));
			cell.textContent = vin[currentIndex] || ' ';
			display.appendChild(cell);
			currentIndex++;
		});
	});

	// Update legend visibility
	document.querySelector('.legend-17').classList.toggle('visible-17', vin.length === 17);
	document.querySelector('.legend-10').classList.toggle('visible-10', vin.length === 10);
};

const decode = () => {
	if (!vinData) return;
	const input = document.getElementById('vinInput');
	const vin = input.value.toUpperCase();
	input.value = vin;
	displayVIN(vin);

	const result = document.getElementById('result');
	result.innerHTML = '';

	if (vin.length !== 17 && vin.length !== 10) {
		result.innerHTML = '<div class="error">Invalid length. Enter a 17-character VIN or 10-character chassis number.</div>';
		return;
	}

	const info = document.createElement('div');
	info.className = 'info';

	if (vin.length === 10) {
		const data = vinData['1973-1980'];
		info.innerHTML = `
			<h3>Chassis Number (1973-1980)</h3>
			<p data-label="${data.positions1_2.title}">${vin.slice(0, 2)} (${data.positions1_2.description})</p>
			<p data-label="${data.position3.title}">${data.position3.codes[vin[2]] || 'Unknown'}</p>
			<p data-label="${data.position4.title}">${data.position4.codes[vin[3]] || 'Unknown'}</p>
			<p data-label="${data.positions5_10.title}">${vin.slice(4)} (${data.positions5_10.description})</p>
		`;
	} else {
		const data = vinData['1981-present'];
		const wmi = vin.slice(0, 3);
		const yearChar = vin[9];
		const plant = vin[10];
		const year = data.vis.position10.codes[yearChar];
		const plantInfo = data.vis.position11.codes[plant];

		info.innerHTML = `<h3>VIN (1981-present)</h3>`;

		// WMI Section
		const method2Match = data.wmiMethods.method2.positions1_3.codes[wmi];
		if (method2Match) {
			info.innerHTML += `<p data-label="World Manufacturer Identifier">${method2Match}</p>`;
		} else {
			const countryCode = data.wmiMethods.method1.position1.codes[vin[0]];
			const manufacturer = data.wmiMethods.method1.position2.codes[vin[1]];
			const vehicleType = data.wmiMethods.method1.position3.codes[vin[2]];

			info.innerHTML += `
				<p data-label="Country of Origin">${Array.isArray(countryCode) ? countryCode.join(', ') : countryCode || 'Unknown'}</p>
				<p data-label="Manufacturer">${manufacturer || 'Unknown'}</p>
				<p data-label="Vehicle Type">${Array.isArray(vehicleType) ? vehicleType.join(', ') : vehicleType || 'Unknown'}</p>
			`;
		}

		// VDS Section
		const vdsData = yearChar && parseInt(year) < 2010 ? (parseInt(year) < 1987 ? data.vds['1981-1986'] : data.vds['1987-2009']) : data.vds['2010-present'];

		if (vdsData) {
			const bodyTransCode = vin[6];
			const bodyTrans = vdsData.position7?.codes[bodyTransCode];
			const positions4_6Title = vdsData.positions4_6?.title || 'Car Line & Engine';
			const position7Title = vdsData.position7?.title || 'Body & Transmission';

			info.innerHTML += `
				<p data-label="${positions4_6Title}">${vin.slice(3, 6)} (${vdsData.positions4_6?.description || ''})</p>
				<p data-label="${position7Title}">${Array.isArray(bodyTrans) ? bodyTrans.join(' or ') : bodyTrans || 'Unknown'}</p>
				<p data-label="${data.position8.title}">${vin[7]}</p>
				<p data-label="${data.position9.title}">${vin[8]}</p>
			`;
		}

		// VIS Section
		info.innerHTML += `
			<p data-label="${data.vis.position10.title}">${Array.isArray(year) ? year.join(' or ') : year || 'Unknown'}</p>
			<p data-label="${data.vis.position11.title}">${Array.isArray(plantInfo) ? plantInfo.join(' or ') : plantInfo || 'Unknown'}</p>
			<p data-label="${data.vis.positions12_17.title}">${vin.slice(11)}</p>
			<p class="notes"><small>${data.vis.positions12_17.notes.join('<br>')}</small></p>
		`;
	}

	result.appendChild(info);
};

const loadDemo = () => {
	const input = document.getElementById('vinInput');
	const currentValue = input.value.toUpperCase();
	let isVin = true;

	if (currentValue === VIN_DEMO) isVin = false;
	else if (currentValue === CHASSIS_DEMO) isVin = true;
	else isVin = Math.random() < 0.5;

	input.value = isVin ? VIN_DEMO : CHASSIS_DEMO;
	document.getElementById('demoButton').textContent = `Load ${isVin ? 'Chassis' : 'VIN'} Demo`;
	decode();
};

(async () => {
	const response = await fetch('honda-vin-data.json');
	vinData = await response.json();
	document.getElementById('vinInput').addEventListener('input', decode);
	loadDemo();
})();
