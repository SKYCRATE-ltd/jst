const SLASH = '/';
const CHARS = {
	'<': 'lt',
	'>': 'gt',
	'"': 'quot',
	'\'': 'apos',
	'&': 'amp',
	'\r': '#10',
	'\n': '#13'
};

const trim = x => x.trim();
const clip = (x, y = trim(x), _index = x.indexOf(' ')) =>
		y.substr(0, _index > 0 ? _index : y.length);

const view = (item = {}, defaults = {}) => {
	return {
		...defaults,
		item
	};
};

const API = (JST, API = {}) => {
	return API = {
		...API,
		assume: x => x || "",
		exists: x => !!x,
		encode: x => x.replace(/[<>"'\r\n&]/g, x => `&${CHARS[x]};`),
		filter: (list, filter) => {
			if (list.constructor === Array)
				return list.filter(filter);
			let output = {};
			for (const index in list) {
				let item = list[index];
				if (filter(item, index, list))
					output[index] = item;
			}
			return output;
		},
		render: async (file, model = {}) => await JST.render(file, view(model)),
		iterate: async (
			list, file, wrap = '',
			wrapL = wrap && `<${trim(wrap)}>`,
			wrapR = wrapL && `</${clip(wrap)}>\n`,
		) => {
			let template = await JST.open(file)
			let output = "";
			for (const index in list) {
				output += wrapL;
				output += await template(view(
					list[index],
					{index}
				));
				output += wrapR;
			}
			return output;
		},
		list: async (type, list, file, empty_file, model = {}) =>
			(list instanceof Array && list.length) || Object.keys(list).length ?
				`<${trim(type)}>\n` + await API.iterate(list, file, "li") + `</${clip(type)}>` :
					empty_file ? await API.render(empty_file, model) : "",
		// TODO: keep these?
		ul: async (list, file, empty_file, model = {}) =>
				await API.list("ul", list, file, empty_file, model),
		ol: async (list, file, empty_file, model = {}) =>
				await API.list("ol", list, file, empty_file, model),
	};
}

const Async = Object.getPrototypeOf(async function() {}).constructor;

export default class JST {
	#api;
	#dir = '.';
	#ext = '';
	#read = x => '';
	#cache = false;
	#files = {};

	constructor(file_handler, directory = ".", cache = false, extension = ".jst") {
		this.#cache = cache;
		this.#api = API(this/*, {plugins}*/);
		this.#dir = directory.endsWith(SLASH) ?
				directory.substr(0, directory.length - 1) : directory;
		this.#ext = extension;
		this.#read = file_handler;
	}

	create(source, template = `return \`${source}\`;`) {
		return (model = {}, context = {...model, ...this.#api}) =>
			new Async(...Object.keys(context), template)(...Object.values(context));
	}

	async open(file) {
		if (this.#files[file])
			return this.#files[file];
		
		let source = await this.#read((file.startsWith(SLASH) ? file :
							`${this.#dir}/${file}`) + this.#ext);
		
		const template = this.create(source);
		return this.#cache ? this.cache(file, template) : template;
	}

	async cache(uri, template) {
		return this.#files[uri] = template || await this.open(uri);
	}

	clear(uri = undefined) {
		return uri ? delete this.#files[uri] : (this.#files = {}) && true;
	}

	async render(file, model = {}) {
		return (await this.open(file))(model);
	}

	layout(layout_file, defaults = {}) {
		return async (content_file, model, defs = {}) => await this.render(layout_file, view(
			model,
			{
				...defaults,
				...defs,
				content: await this.render(content_file, view(model))
			}));
	}
}
