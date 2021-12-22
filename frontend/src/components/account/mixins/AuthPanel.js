"use strict";

import Logo from "../partials/Logo.vue";
import SubmitButton from "../partials/SubmitButton.vue";
import SocialAuth from "../partials/SocialAuth.vue";

export default {
	components: {
		Logo,
		SubmitButton,
		SocialAuth
	},
	data() {
		return {
			processing: false,
			fullName: "",
			email: "",
			username: "",
			password: "",
			error: null,
			success: null
		};
	},

	methods: {
		async submit() {
			this.processing = true;
			this.error = null;
			this.success = null;
			try {
				await this.process();
			} catch (err) {
				//console.log(JSON.stringify(err, null, 2));
				this.error = err.message;
				this.success = null;
			}
			this.processing = false;
		}
	}
};
