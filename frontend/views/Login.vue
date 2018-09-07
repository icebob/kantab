<template>
<page-content>
	<page-center>
		<logo />
		<form @submit.prevent="submit">
			<div class="alert error">{{ error }}</div>
			<fieldset class="email">
				<input type="text" v-model="email" placeholder="E-mail or username" />
				<i class="fa fa-user"></i>
			</fieldset>
			<fieldset class="password">
				<input type="password" v-model="password" placeholder="Password" />
				<i class="fa fa-lock"></i>
				<!-- div class="remember">
					<input type="checkbox" id="remember" v-model="remember" />
					<label for="remember">Remember me</label>
				</div -->
				<div class="forgot">
					<a href="#">Forgot password?</a>
				</div>
			</fieldset>
			<fieldset>
				<input type="submit" value="Login" />
			</fieldset>
			<fieldset>
				<span>Don't have an account?</span>
				<a href="#"> Sign Up</a>
			</fieldset>
		</form>
		<hr/>
		<social-auth />
	</page-center>
</page-content>
</template>

<script>
import Logo from "../components/Logo";
import SocialAuth from "../components/SocialAuth";
import PageCenter from "../components/PageCenter";
import PageContent from "../components/PageContent";

export default {
	components: {
		Logo,
		SocialAuth,
		PageContent,
		PageCenter
	},
	data() {
		return {
			email: "",
			password: "",
			remember: true,
			error: null
		};
	},

	methods: {
		async submit() {
			this.error = null;
			try {
				const res = await this.$authenticator.login(this.email, this.password);
				console.log(res);
				this.$router.push({ name: "home" });
			} catch(err) {
				//console.log(JSON.stringify(err, null, 2));
				this.error = err.message;
			}

		}
	}
};
</script>

<style lang="scss" scoped>
@import "../styles/variables";

$w: 250px;

.content {
	position: absolute;
	left: 0; right: 0; top: 0; bottom: 0;
	background-color: rgba(#000, 0.7);

	height: 100%;
	min-height: 100%;

	background-image: -webkit-radial-gradient(center center, $bg2, $bg1);
}

.wrap-outer {
	display: flex;
    align-items: center;
    justify-content: center;

	width: 100%;
	height: 100%;
}

form {
	width: $w;
	margin: 0 auto;
	margin-top: 1.5em;
	color: $textColor;
}

fieldset {
	border: none;
	padding: 0;
	position: relative;
	margin: 1.0em 0;
	text-align: center;
}

a {
	color: $linkTextColor;
	text-decoration: none;
}

.alert {
	text-align: center;
	color: rgb(255,128,128);
	text-shadow: 0 0 10px rgb(255,0,0);
	font-size: 0.9em;
}

fieldset.email input, fieldset.password input {
	background: lighten($bg2, 10);
	box-sizing: border-box;
	border-radius: 5px;
	border: 1px solid lighten($bg1, 10);
	box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.3);
	color: #fff;
	font-size: 1.2em;
	font-family: "Open Sans", Arial, sans-serif;
	font-weight: 200;
	padding: 10px 40px 10px 10px;
	width: 100%;
}

fieldset i {
	content: '\f007';
	font-size: 26px;
	color: lighten($bg2, 20);
	position: absolute;
	right: 12px;
	top: 10px;
	width: 20px;
	height: 20px;
	//color: White;
}

.remember {
	display: inline-block;
	width: 50%;

	text-align: left;
	margin-top: 0.2em;
	font-size: 0.8em;

	color: $textColor;

	label {
		cursor: pointer;
		&:hover {
			color: $linkTextColor;
		}
	}

	input[type=checkbox] {
		background: #10548C;
		box-sizing: border-box;
		border-radius: 5px;
		border: 1px solid lighten($bg1, 10);
		box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.3);
		color: #fff;
		width: 1.0em;
		height: 1.0em;
	}
}

.forgot {
	//display: inline-block;
	//width: 50%;

	text-align: right;
	margin-top: 0.2em;
	font-size: 0.8em;

	a {
		color: $textColor;
		&:hover {
			color: $linkTextColor;
		}
	}
}

input[type=submit] {
	background-image: linear-gradient(lighten($selected, 10), $selected);
	border-radius: 5px;
	box-shadow: 0 2px 3px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.6);
	border: solid 1px $selected;
	color: $bg2;
	font-size: 1.2em;
	font-family: "Open Sans", Arial, sans-serif;
	font-weight: 500;
	padding: 8px 30px;
	text-align: center;
	text-shadow: 0px 1px 1px rgba(255, 255, 255, 0.5);

	&:hover {
		background-image: linear-gradient(lighten($selected, 20), lighten($selected, 10));
		box-shadow:0 0 5px rgba($selected, 0.8);
	}
	&:active {
		box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.4);
	}
}

input {
	&::-webkit-input-placeholder {
		color: $placeholderColor;
	}
	&:-moz-placeholder {
		color: $placeholderColor;
	}
	&:-ms-input-placeholder {
		color: $placeholderColor;
	}
}

input:focus {
	border: 1px solid rgba($selected, 0.6);
	box-shadow:0 0 5px rgba($selected, 0.6);
	outline: none;
}

hr {
	width: 30%;
	min-width: 200px;
	margin-top: 2em;
	border: 0;
	border-top: 1px solid rgba(white, 0.3);
}

</style>
