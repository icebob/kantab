"use strict";

import Logo from "../partials/Logo";
import SubmitButton from "../partials/SubmitButton";
import SocialAuth from "../partials/SocialAuth";
import PageCenter from "../partials/PageCenter";
import PageContent from "../partials/PageContent";

export default {
	components: {
		Logo,
		SubmitButton,
		SocialAuth,
		PageContent,
		PageCenter
	},
	data() {
		return {
			processing: false,
			firstName: "",
			lastName: "",
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
