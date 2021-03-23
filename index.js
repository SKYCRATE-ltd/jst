#!/usr/bin/env node

import JST from "./src/backend.js";
import {
	read
} from "config";
import {
	write
} from "computer";

// const DIR = parent_dir(process.argv[1]);

const jst = new JST();
const [
	template_file = "test",
	input_file = "test.in",
	output_file = "test.out"
] = process.argv.slice(2);

async function main() {
	const output = await jst.render(template_file, read(input_file));
	console.log(output);
	write(output_file, output);
}

main();