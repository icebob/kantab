<template>
	<button type="submit" :class="classes">{{ caption }}</button>
</template>

<script>
export default {
	props: ["caption", "color", "loading", "size"],

	computed: {
		classes() {
			const res = {
				button: true,
				submit: true,
				large: this.size == "large",
				small: this.size == "small",
				loading: this.loading
			};

			if (this.color) res[this.color] = true;

			return res;
		}
	}
};
</script>
