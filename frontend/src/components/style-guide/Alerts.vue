<template>
	<section>
		<section-header number="5" caption="Alerts" />
		<div class="content alerts">
			<div class="alert"><i class="icon fa fa-info-circle"></i>This is a neutral alert.</div>
			<div class="alert primary">
				<i class="icon fa fa-home"></i>This is a primary alert.<a class="close" href="x"
					>&times;</a
				>
			</div>
			<div class="alert secondary">
				<i class="icon fa fa-envelope"></i>This is a secondary alert.<a
					class="close"
					href="x"
					>&times;</a
				>
			</div>
			<div class="alert success">
				<i class="icon fa fa-check"></i>This is a success alert.<a class="close" href="x"
					>&times;</a
				>
			</div>
			<div class="alert warning">
				<i class="icon fa fa-exclamation-triangle"></i>This is a warning alert.<a
					class="close"
					href="x"
					>&times;
				</a>
			</div>
			<div class="alert error">
				<i class="icon fa fa-times-circle"></i><strong>Error!</strong>This is an error
				alert.<a class="close" href="x">&times; </a>
			</div>
			<div class="alert success">
				<h4>Well done!</h4>
				<p>
					Aww yeah, you successfully read this important alert message. This example text
					is going to run a bit longer so that you can see how spacing within an alert
					works with this kind of content.
				</p>
			</div>
		</div>
	</section>
</template>

<script>
import SectionHeader from "./section-header.vue";

export default {
	components: {
		SectionHeader
	}
};
</script>

<style lang="scss" scoped>
@import "../../styles/style.scss";
</style>
