import path from "path";
import util from "util";
import {readFile} from "fs";
import JST from "../index.js";

const read = util.promisify(readFile);

export default class extends JST {
	constructor(
		directory = ".",
		cache = false,
		extension = ".jst",
	) {
		super(
			async uri => await read(uri),
			path.resolve(directory),
			cache,
			extension
		);
	}
}
