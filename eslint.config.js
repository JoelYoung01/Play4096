import prettier from "eslint-plugin-prettier/recommended";
import { includeIgnoreFile } from "@eslint/compat";
import eslint from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import { fileURLToPath } from "node:url";
import svelteConfig from "./svelte.config.js";

const gitignorePath = fileURLToPath(new URL("./.gitignore", import.meta.url));

/** @type {import('eslint').Linter.Config[]} */
export default [
	includeIgnoreFile(gitignorePath),
	eslint.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
		},
		rules: {
			"prettier/prettier": "warn",
		},
	},
	{
		files: ["**/*.svelte", "**/*.svelte.js"],
		languageOptions: { parserOptions: { svelteConfig } },
	},
];
