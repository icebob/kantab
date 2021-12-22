<template>
	<section>
		<section-header number="4" caption="Buttons" />
		<div class="content forms">
			<form action="#">
				<fieldset>
					<legend>Input fields</legend>
					<div class="form-group">
						<label for="text1">Label</label>
						<input
							id="text1"
							class="form-control"
							type="text"
							placeholder="Placeholder"
						/>
					</div>
					<div class="form-group">
						<label for="text2">Label with hint</label>
						<input
							id="text2"
							class="form-control"
							type="text"
							placeholder="Placeholder"
						/>
						<div class="hint">Maxium 100 characters</div>
					</div>
					<div class="form-group has-icon">
						<label for="text6">Label with icon</label>
						<input
							id="text6"
							class="form-control"
							type="text"
							placeholder="Placeholder"
						/><i class="icon fa fa-key"></i>
						<div class="hint">Maxium 100 characters</div>
					</div>
					<div class="form-group has-icon valid">
						<label for="text3">Label for valid input</label>
						<input
							id="text3"
							class="form-control"
							type="text"
							placeholder="Placeholder"
						/><i class="icon fa fa-check"></i>
					</div>
					<div class="form-group has-icon error">
						<label for="text4">Label for invalid input with error messages</label>
						<input
							id="text4"
							class="form-control"
							type="text"
							placeholder="Placeholder"
						/><i class="icon fa fa-exclamation-triangle"></i>
						<div class="errors">
							<span>Too short!</span><span>Invalid text content!</span>
						</div>
					</div>
					<div class="form-group">
						<label for="text5">Label for textarea</label>
						<textarea
							id="text5"
							class="form-control"
							type="text"
							placeholder="Placeholder"
							rows="5"
						></textarea>
					</div>
				</fieldset>
				<fieldset>
					<legend>Selections</legend>
					<div class="form-group">
						<label for="select1">Label for select</label>
						<select id="select1" class="form-control">
							<option>Option 1</option>
							<option>Option 2</option>
							<option>Option 3</option>
							<option>Option 4</option>
						</select>
					</div>
				</fieldset>
				<fieldset>
					<legend>Radio buttons</legend>
					<div class="form-option">
						<input id="radio1" type="radio" name="radio" />
						<label for="radio1">Option one</label>
					</div>
					<div class="form-option">
						<input id="radio2" type="radio" name="radio" />
						<label for="radio2">Option two</label>
					</div>
				</fieldset>
				<fieldset>
					<legend>Checkboxes</legend>
					<div class="form-option">
						<input id="check1" type="checkbox" />
						<label for="check1">Option one</label>
					</div>
					<div class="form-option">
						<input id="check2" type="checkbox" />
						<label for="check2">Option two</label>
					</div>
				</fieldset>
			</form>
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
