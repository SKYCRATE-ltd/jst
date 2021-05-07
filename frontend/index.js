import JST from "../index.js";

const GET = 'GET';
const OK = 200;

function req(method, uri, data = null) {
	return new Promise((resolve, reject) => {
		const	req = new XMLHttpRequest();
				req.responseType = data !== null ? "json" : "text";
				req.open(method, uri);
				req.onload = e =>
					req.status >= OK ?
						resolve(req.response) : req.onerror(e);
				req.onerror = e =>
					reject(req);
				req.send(data);
	});
}

async function get(uri) {
	return await req(GET, uri);
};

export default class extends JST {
	constructor(directory = ".", extension = ".jst") {
		super(get, directory, false, extension);
	}
	async domify(uri, model) {
		const el = document.createElement('div');
		el.innerHTML = await this.render(uri, model);
		return el.childNodes;
	}
}
