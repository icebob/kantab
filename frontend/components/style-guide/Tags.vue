<template>
	<section>
		<section-header number="7" caption="Tags & Badges" />
		<fieldset>
			<legend>Tags</legend>
			<div class="content flex align-center justify-space-around buttons">
			<div class="tag">Normal</div>
			<div class="tag primary">Primary</div>
			<div class="tag success">Success</div>
			<div class="tag warning">Warning</div>
			<div class="tag danger">Danger</div>
			<div class="tag outline">Outline</div>
			</div>
		</fieldset>
		<fieldset>
			<legend>Number tags</legend>
			<div class="content flex align-center justify-space-around buttons">
			<div class="tag pill">15</div>
			<div class="tag pill primary">5</div>
			<div class="tag pill success">100+</div>
			<div class="tag pill warning">45</div>
			<div class="tag pill danger">0</div>
			<div class="tag pill outline">8</div>
			</div>
		</fieldset>
	</section>
</template>

<script>
import SectionHeader from "./section-header";

export default {
	components: {
		SectionHeader
	}
};
</script>
