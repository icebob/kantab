<template>
<div class="content">
	<h3>
		<span>Kan</span><span>Tab</span>
	</h3>
	<form @submit.prevent="login">
		<div class="alert error">{{ error }}</div>
		<fieldset class="email">
			<input type="text" :model="email" placeholder="E-mail or username" />
			<i class="fa fa-user"></i>
		</fieldset>
		<fieldset class="password">
			<input type="text" :model="password" placeholder="Password" />
			<i class="fa fa-lock"></i>
			<div class="forgot">
				<a href="#">Forgot password?</a>
			</div>
		</fieldset>
		<fieldset class="remember-me">
			<input type="checkbox" id="remember" :model="remember" />
        	<label for="remember">Remember me</label>
		</fieldset>
		<input type="submit" value="Login" />
		<fieldset>
			<span>Don't have an account?</span>
			<a href="#"> Sign Up</a>
		</fieldset>
	</form>
	<hr/>
	<div class="social-icons">
		<a class="google" href="/auth/google" title="Google">
			<svg aria-labelledby="simpleicons-google-icon" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title id="simpleicons-google-icon">Google icon</title><path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"/></svg>
		</a>
		<a class="facebook" href="/auth/facebook" title="Facebook">
			<svg aria-labelledby="simpleicons-facebook-icon" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title id="simpleicons-facebook-icon">Facebook icon</title><path d="M22.676 0H1.324C.593 0 0 .593 0 1.324v21.352C0 23.408.593 24 1.324 24h11.494v-9.294H9.689v-3.621h3.129V8.41c0-3.099 1.894-4.785 4.659-4.785 1.325 0 2.464.097 2.796.141v3.24h-1.921c-1.5 0-1.792.721-1.792 1.771v2.311h3.584l-.465 3.63H16.56V24h6.115c.733 0 1.325-.592 1.325-1.324V1.324C24 .593 23.408 0 22.676 0"/></svg>
		</a>
		<a class="github" href="/auth/github" title="Github">
			<svg aria-labelledby="simpleicons-github-icon" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title id="simpleicons-github-icon">GitHub icon</title><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
		</a>
	</div>
</div>
</template>

<script>
// https://codepen.io/icebob/pen/rcKEo?editors=1100
// https://dribbble.com/shots/5085224-Fitness-App-Sign-In/attachments/1127039

import axios from "axios";

export default {
	data() {
		return {
			email: "",
			password: "",
			remember: true,
			error: null
		};
	},

	methods: {
		async login() {
			const res = await axios.post("/api/v1/accounts/login", { email: this.email, password: this.password });

		}
	}
};
</script>

<style lang="scss" scoped>
$w: 250px;
$bg1: #1D2124;
$bg2: #454F56;
$hoverBG: #454F56;
$textColor: #FFFFFF;
$textColor2: #BBBBBB;
$selected: #A1C72C;
$greenBG: desaturate($selected, 10);
$textColor: #A0A0A0;
$linkTextColor: white;
$placeholderColor: #a7b9c4;



.content {
	position: absolute;
	left: 0; right: 0; top: 0; bottom: 0;
	background-color: rgba(#000, 0.7);

	height: 100%;
	min-height: 100%;

	background-image: -webkit-radial-gradient(center center, $bg2, $bg1);
}

h3 {
	width: $w;
	margin: 0 auto;
	margin-top: 120px;
	text-align: center;
	font-size: 2em;
	font-weight: 700;
	color: White;
	text-shadow: 0px 0px 20px rgba(0,0,0, 0.4);

	font-family: "Roboto Condensed";

	span:first-child {
		color: $selected;
		//font-size: 1.1em;
	}
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
}

a {
	color: $linkTextColor;
	text-decoration: none;
}

.alert {
	text-align: center;
	color: rgb(255,128,128);
	text-shadow: 0 0 10px rgb(255,0,0);
}

fieldset.email input, fieldset.password input {
	background: lighten($bg2, 10);
	box-sizing: border-box;
	border-radius: 5px;
	border: 1px solid lighten($bg1, 10);
	box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.3);
	color: #fff;
	font-size: 1.2em;
	font-family:"Open Sans", Arial, sans-serif;
	font-weight: 200;
	padding: 10px 40px 10px 10px;
	width: 100%;
}

fieldset i {
	content: '\f007';
	font-family: 'font-awesome';
	font-size: 26px;
	color: lighten($bg2, 20);
	position: absolute;
	right: 12px;
	top: 10px;
	width: 20px;
	height: 20px;
	//color: White;
}

.forgot {
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

label {
	font-size: 1.1em;
	font-family:"Open Sans", Arial, sans-serif;
	color: #fff;
	text-shadow: 0 1px 1px rgba(0, 0, 0, .4);
}

input[type=checkbox] {
	background: #10548C;
	box-sizing: border-box;
	border-radius: 5px;
	border: 1px solid lighten($bg1, 10);
	box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.3);
	color: #fff;
	width: 1.5em;
	height: 1.5em;
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

.social-icons {
	margin: 2em 0;

	a {
		margin: 0 1em;

		svg {
			width: 48px;
			height: 48px;
			transform: scale(1.0);

			&:hover {
				transform: scale(1.2);
				transition: transform 0.2s ease-in-out;
			}
		}

		&.google svg path {
			fill: #DC4E41;
		}

		&.facebook svg path {
			fill: #3B5998;
		}

		&.twitter svg path {
			fill: #1DA1F2;
		}

		&.github svg path {
			fill: white;
		}

	}
}
</style>
