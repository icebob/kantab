// Default: https://github.com/tailwindlabs/tailwindcss/blob/master/stubs/defaultConfig.stub.js

module.exports = {
	important: "#app",
	content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
	theme: {
		fontFamily: {
			sans: [
				"Open Sans",
				"ui-sans-serif",
				"system-ui",
				"-apple-system",
				"BlinkMacSystemFont",
				'"Segoe UI"',
				"Roboto",
				'"Helvetica Neue"',
				"Arial"
			]
		},
		extend: {
			colors: {
				primary: {
					DEFAULT: "#90B227",
					50: "#DAEBA5",
					100: "#D3E895",
					200: "#C6E073",
					300: "#B8D952",
					400: "#AAD230",
					500: "#90B227",
					600: "#6B841D",
					700: "#465613",
					800: "#202809",
					900: "#000000"
				},
				panel: "#2e353a",
				muted: "#929292",
				text: "#dedede"
			},

			fontFamily: {
				title: [
					"Roboto Condensed",
					"Open Sans",
					"ui-sans-serif",
					"system-ui",
					"-apple-system",
					"BlinkMacSystemFont",
					'"Segoe UI"',
					"Roboto",
					'"Helvetica Neue"',
					"Arial"
				]
			},

			boxShadow: {
				panel: "2px 5px 5px 0 rgb(0 0 0 / 25%)"
			}
		}
	},
	plugins: []
};
