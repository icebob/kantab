<template>
  <div class="home">
	<logo/>
    <h4>Style guide</h4>

	<section>
		<h2><span class="number">1.</span><span class="text">Color palette</span></h2>
		<div class="content flex wrap align-center justify-space-around colors">
			<div class="box box1">
				<div class="caption">Color #1</div>
				<div class="main"></div>
				<div class="light"></div>
				<div class="dark"></div>
				<div class="code"></div>
			</div>
			<div class="box box2">
				<div class="caption">Color #2</div>
				<div class="main"></div>
				<div class="light"></div>
				<div class="dark"></div>
				<div class="code"></div>
			</div>
			<div class="box box3">
				<div class="caption">Color #3</div>
				<div class="main"></div>
				<div class="light"></div>
				<div class="dark"></div>
				<div class="code"></div>
			</div>
			<div class="box box4">
				<div class="caption">Color #4</div>
				<div class="main"></div>
				<div class="light"></div>
				<div class="dark"></div>
				<div class="code"></div>
			</div>
			<div class="box box5">
				<div class="caption">Color #5</div>
				<div class="main"></div>
				<div class="light"></div>
				<div class="dark"></div>
				<div class="code"></div>
			</div>
		</div>
	</section>

	<section>
		<h2><span class="number">2.</span><span class="text">Typography</span></h2>
		<div class="content typo">
			<div class="headers">
				<h1>Heading #1 - {{ getTypographyInfo("h1") }}</h1>
				<h2>Heading #2 - {{ getTypographyInfo("h2") }}</h2>
				<h3>Heading #3 - {{ getTypographyInfo("h3") }}</h3>
				<h4>Heading #4 - {{ getTypographyInfo("h4") }}</h4>
				<h5>Heading #5 - {{ getTypographyInfo("h5") }}</h5>
				<h5>ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 éáűőúöüóí ÉÁŰŐÚÖÜÓÍ </h5>
			</div>
			<hr/>
			<div class="paragraph">
				<p>Paragraph - {{ getTypographyInfo("p") }}</p>
				<p>ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 éáűőúöüóí ÉÁŰŐÚÖÜÓÍ</p>
				<p>An example paragraph with <strong>strong text</strong> and <em>emphasized text</em>, spanning <br/>multiple lines so you can see the line-height.</p>
				<p class="text-justify">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec varius ipsum tortor, eget convallis ante sagittis ac. Nulla eget bibendum dolor. Praesent at ipsum bibendum, malesuada quam tincidunt, lobortis purus. Donec vel mi mollis, sagittis
					libero non, ultrices elit. Nulla non mauris in sapien mattis scelerisque. Vivamus maximus tincidunt mi, interdum pellentesque urna feugiat sed. Suspendisse vulputate metus leo, nec hendrerit sapien tincidunt ac. Vivamus non libero luctus,
					suscipit libero ut, elementum enim. <a class="link" href="#">Read more</a></p>
				<p>Fusce aliquam sem lorem, in porttitor orci dignissim at. Sed non dolor at orci dignissim bibendum a non nibh. Duis nec vestibulum dui, sit amet lobortis ligula. Sed aliquam mauris nunc, eu sodales est faucibus vitae. Ut sed accumsan lectus.
					Interdum et <a class="link" href="#">malesuada</a> fames ac ante ipsum primis in faucibus. Aenean dignissim odio vehicula ligula varius, ac ullamcorper tortor molestie. Phasellus dolor dui, egestas id ornare in, suscipit et dolor.</p>
			</div>
		</div>
	</section>
	<section>
		<h2><span class="number">2.</span><span class="text">Typography</span></h2>
		<fieldset>
			<legend>Normal buttons</legend>
			<div class="buttons">
				<button class="button">Normal</button>
				<button class="button primary">Primary</button>
				<button class="button secondary">Secondary</button>
				<button class="button success"> <i class="icon fa fa-check"></i>Success</button>
				<button class="button warning">Warning</button>
				<button class="button danger">Danger</button>
				<button class="button outline">Outline</button>
				<button class="button loading">Loading</button>
			</div>
		</fieldset>
		<fieldset>
			<legend>Large buttons</legend>
			<div class="buttons">
				<button class="button large">Normal</button>
				<button class="button large primary">Primary</button>
				<button class="button large secondary">Secondary</button>
				<button class="button large success"> <i class="icon fa fa-check"></i>Success</button>
				<button class="button large warning">Warning</button>
				<button class="button large danger">Danger</button>
				<button class="button large outline">Outline</button>
				<button class="button large loading">Loading</button>
			</div>
		</fieldset>
		<fieldset>
			<legend>Small buttons</legend>
			<div class="buttons">
				<button class="button small">Normal</button>
				<button class="button small primary">Primary</button>
				<button class="button small secondary">Secondary</button>
				<button class="button small success"><i class="icon fa fa-check"></i>Success</button>
				<button class="button small warning">Warning</button>
				<button class="button small danger">Danger</button>
				<button class="button small outline">Outline</button>
				<button class="button small loading">Loading</button>
			</div>
		</fieldset>
		<fieldset>
			<legend>Disabled buttons</legend>
			<div class="buttons">
				<button disabled="disabled" class="button">Normal</button>
				<button disabled="disabled" class="button primary">Primary</button>
				<button disabled="disabled" class="button secondary">Secondary</button>
				<button disabled="disabled" class="button success"><i class="icon fa fa-check"></i>Success</button>
				<button disabled="disabled" class="button warning">Warning</button>
				<button disabled="disabled" class="button danger">Danger</button>
				<button disabled="disabled" class="button outline">Outline</button>
			</div>
		</fieldset>
		<fieldset>
		<legend>Icon buttons</legend>
			<div class="buttons">
				<button class="button large"><i class="fa fa-home"></i></button>
				<button class="button small primary"><i class="fa fa-tasks"></i></button>
				<button class="button success"> <i class="fa fa-cogs"></i></button>
				<button class="button warning"><i class="fa fa-comments"></i></button>
				<button class="button danger"><i class="fa fa-trash"></i></button>
				<button class="button outline"><i class="fa fa-pencil"></i></button>
			</div>
		</fieldset>
		<fieldset>
		<legend>Floating buttons</legend>
			<div class="buttons">
				<button class="button fab large"><i class="icon fa fa-plus"></i>Normal</button>
				<button class="button fab small primary"> <i class="icon fa fa-plus"></i>Primary</button>
				<button class="button fab success"><i class="icon fa fa-check"></i>Success</button>
				<button disabled="disabled" class="button fab warning"><i class="icon fa fa-comments"></i>Warning</button>
				<button class="button fab danger"><i class="icon fa fa-trash"></i>Danger</button>
				<button class="button fab outline"><i class="icon fa fa-bars"></i>Outline</button>
			</div>
		</fieldset>
	</section>
  </div>
</template>

<script>
import Logo from "./account/partials/Logo";

export default {
	components: {
		Logo
	},
	methods: {
		getTypographyInfo(elType) {
			if (this.$el) {
				let element = this.$el.querySelector(elType);
				if (element) {
					let style = window.getComputedStyle(element, null);
					return style.fontFamily.split(",")[0] + " " + style.fontWeight + ", " + style.fontSize;
				}
			}
		}
	}
};
</script>


<style lang="scss" scoped>
@import "../styles/variables";

.home {
	padding: 1em;
}

section {
	&:not(:last-child) {
		margin-bottom: 40px;
	}

	> h2 {
		font-size: 1.5rem;
		margin-bottom: 20px;
		padding: 8px 10px;

		background-color: rgba(darken($backgroundColor, 10%), 0.6);
		border: 1px solid darken($backgroundColor, 8%);
		border-radius: 8px;

		.number {
			color: #888;
		}

		.text {
			margin-left: 4px;
			font-weight: 300;
			text-transform: uppercase;
		}

		clear: both;

	} // .title

} //. section

.buttons {
	margin-bottom: 20px;
}

.list {
	> * {
		margin-bottom: 20px;
	}
}

.panels {
	align-items: flex-start;
	.panel, .card {
		margin: 20px;
	}

	.card {
		max-width: 350px;
	}
}

.colors {
	$boxSize: 150px;

	.box {
		width: $boxSize;
		min-width: $boxSize;
		height: $boxSize + 20px;

		border: 1px solid darken($backgroundColor, 10%);
		border-radius: 6px;

		margin: 10px;
		padding: 2px;

		.caption {
			float: left;
			width: 100%;
			text-align: center;
		}

		.main {
			float: left;
			width: 100%;
			height: $boxSize - 60px;
		} // .main

		.light {
			float: left;
			width: 50%;
			height: 30px;
			position: relative;

		} // .light

		.dark {
			float: right;
			width: 50%;
			height: 30px;
			position: relative;

		} // .dark

		.light, .dark, .code {
			&:after {
				position: absolute;
				top: 7px; bottom: 0;
				left: 0; right: 0;
				margin: auto;
				width: 100%;
				font-size: 0.8rem;
				text-align: center;
				font-family: "Consolas";
				color: White;
				text-shadow: 0px 0px 6px rgba(black, 0.7);
			}
		}

		.code {
			float: left;
			width: 100%;
			position: relative;
			margin-top: 6px;

			&:after {
				top: 0;
				font-size: 1rem;
			}
		} // .code

		$colors: $color1, $color2, $color3, $color4, $color5;

		$colors-light: $color1-light, $color2-light, $color3-light, $color4-light, $color5-light;
		$colors-dark: $color1-dark, $color2-dark, $color3-dark, $color4-dark, $color5-dark;

		@for $i from 1 through 5 {
			$c: nth($colors, $i);

			&.box#{$i} {
				.main { background-color: $c; }
				.light { background-color: nth($colors-light, $i); }
				.light:after {	content: "" + nth($colors-light, $i); }

				.dark { background-color: nth($colors-dark, $i); }
				.dark:after {	content: "" + nth($colors-dark, $i); }

				.code:after {	content: "" + $c; }

			} // box

		} // for

	} // .box

} // .colors

fieldset {
	border: 1px solid $backgroundColor2;
	border-radius: 0.5em;
	padding: 1em;
	margin: 1em 0em;

	.buttons {
		.button {
			margin: 0.5em 1em;
		}
	}
}
</style>
