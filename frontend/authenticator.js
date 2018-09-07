"use strict";

import bus from "./bus";
import router from "./router";

export default new class Authenticator {

	constructor() {
		bus.on("expiredToken", () => this.logout());


	}



};

