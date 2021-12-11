<template>
	<section>
		<h2><span class="number">3.</span><span class="text">Buttons</span></h2>
		<fieldset>
			<legend>Normal buttons</legend>
			<div class="content flex align-center justify-space-around wrap buttons">
				<button class="button">Normal</button>
				<button class="button primary">Primary</button>
				<button class="button secondary">Secondary</button>
				<button class="button success icon"><i class="fa fa-check"></i>Success</button>
				<button class="button warning">Warning</button>
				<button class="button danger">Danger</button>
				<button class="button outline">Outline</button>
				<button class="button loading">Loading</button>
			</div>
		</fieldset>
		<fieldset>
			<legend>Large buttons</legend>
			<div class="content flex align-center justify-space-around wrap buttons">
				<button class="button large">Normal</button>
				<button class="button large primary">Primary</button>
				<button class="button large secondary">Secondary</button>
				<button class="button large success icon">
					<i class="fa fa-check"></i>Success
				</button>
				<button class="button large warning">Warning</button>
				<button class="button large danger">Danger</button>
				<button class="button large outline">Outline</button>
				<button class="button large loading">Loading</button>
			</div>
		</fieldset>
		<fieldset>
			<legend>Small buttons</legend>
			<div class="content flex align-center justify-space-around wrap buttons">
				<button class="button small">Normal</button>
				<button class="button small primary">Primary</button>
				<button class="button small secondary">Secondary</button>
				<button class="button small success icon">
					<i class="fa fa-check"></i>Success
				</button>
				<button class="button small warning">Warning</button>
				<button class="button small danger">Danger</button>
				<button class="button small outline">Outline</button>
				<button class="button small loading">Loading</button>
			</div>
		</fieldset>
		<fieldset>
			<legend>Disabled buttons</legend>
			<div class="content flex align-center justify-space-around wrap buttons">
				<button disabled="disabled" class="button">Normal</button>
				<button disabled="disabled" class="button primary">Primary</button>
				<button disabled="disabled" class="button secondary">Secondary</button>
				<button disabled="disabled" class="button success icon">
					<i class="fa fa-check"></i>Success
				</button>
				<button disabled="disabled" class="button warning">Warning</button>
				<button disabled="disabled" class="button danger">Danger</button>
				<button disabled="disabled" class="button outline">Outline</button>
			</div>
		</fieldset>
		<fieldset>
			<legend>Icon buttons</legend>
			<div class="content flex align-center justify-space-around wrap buttons">
				<button class="button large"><i class="fa fa-home"></i></button>
				<button class="button small primary"><i class="fa fa-tasks"></i></button>
				<button class="button success"><i class="fa fa-cogs"></i></button>
				<button class="button warning"><i class="fa fa-comments"></i></button>
				<button class="button danger"><i class="fa fa-trash"></i></button>
				<button class="button outline"><i class="fa fa-pencil"></i></button>
			</div>
		</fieldset>
		<fieldset>
			<legend>Floating buttons</legend>
			<div class="content flex align-center justify-space-around wrap buttons">
				<button class="button fab large icon"><i class="fa fa-plus"></i>Normal</button>
				<button class="button fab small primary icon">
					<i class="fa fa-plus"></i>Primary
				</button>
				<button class="button fab success icon"><i class="fa fa-check"></i>Success</button>
				<button disabled="disabled" class="button fab warning icon">
					<i class="fa fa-comments"></i>Warning
				</button>
				<button class="button fab danger icon"><i class="fa fa-trash"></i>Danger</button>
				<button class="button fab outline icon"><i class="fa fa-bars"></i>Outline</button>
			</div>
		</fieldset>
		<fieldset>
			<legend>Button group</legend>
			<div class="content flex align-center justify-space-around buttons">
				<div class="button-group">
					<button class="button icon"><i class="fa fa-align-left"></i>Left</button>
					<button class="button icon"><i class="fa fa-align-center"></i>Middle</button>
					<button class="button icon"><i class="fa fa-align-right"></i>Right</button>
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
