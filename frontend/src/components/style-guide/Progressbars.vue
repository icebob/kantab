<template>
	<section>
		<section-header number="8" caption="Progressbars" />
		<fieldset>
			<legend>Normal</legend>
			<div class="content buttons">
				<div class="progressbar">
					<div class="progress" style="width: 15%"></div>
				</div>
				<br />
				<div class="progressbar success">
					<div class="progress" style="width: 40%">40% complete...</div>
				</div>
				<br />
				<div class="progressbar warning">
					<div class="progress" style="width: 60%">60%</div>
				</div>
				<br />
				<div class="progressbar danger">
					<div class="progress" style="width: 70%"></div>
				</div>
			</div>
		</fieldset>
		<fieldset>
			<legend>Stripped</legend>
			<div class="content buttons">
				<div class="progressbar stripped success">
					<div class="progress" style="width: 40%">40% complete...</div>
				</div>
				<br />
				<div class="progressbar stripped danger">
					<div class="progress" style="width: 70%"></div>
				</div>
			</div>
		</fieldset>
		<fieldset>
			<legend>Animated</legend>
			<div class="content buttons">
				<div class="progressbar stripped animate success">
					<div class="progress" style="width: 80%">80% complete...</div>
				</div>
				<br />
				<div class="progressbar stripped animate warning">
					<div class="progress" style="width: 34%"></div>
				</div>
			</div>
		</fieldset>
		<fieldset>
			<legend>Small</legend>
			<div class="content buttons">
				<div class="progressbar small">
					<div class="progress" style="width: 15%"></div>
				</div>
				<br />
				<div class="progressbar small success stripped">
					<div class="progress" style="width: 40%">40% complete...</div>
				</div>
				<br />
				<div class="progressbar small warning stripped animate">
					<div class="progress" style="width: 60%">60%</div>
				</div>
			</div>
		</fieldset>
		<fieldset>
			<legend>Large</legend>
			<div class="content buttons">
				<div class="progressbar large">
					<div class="progress" style="width: 15%"></div>
				</div>
				<br />
				<div class="progressbar large success stripped">
					<div class="progress" style="width: 40%">40% complete...</div>
				</div>
				<br />
				<div class="progressbar large warning stripped animate">
					<div class="progress" style="width: 60%">60%</div>
				</div>
			</div>
		</fieldset>
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
