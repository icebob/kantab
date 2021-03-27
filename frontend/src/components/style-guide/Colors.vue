<template>
	<section>
		<section-header number="1" caption="Color palette" />
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
</template>

<script>
import SectionHeader from "./section-header";

export default {
	components: {
		SectionHeader
	}
};
</script>

<style lang="scss" scoped>
@import "../../styles/variables";

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

		.light,
		.dark,
		.code {
			&:after {
				position: absolute;
				top: 7px;
				bottom: 0;
				left: 0;
				right: 0;
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
				.main {
					background-color: $c;
				}
				.light {
					background-color: nth($colors-light, $i);
				}
				.light:after {
					content: "" + nth($colors-light, $i);
				}

				.dark {
					background-color: nth($colors-dark, $i);
				}
				.dark:after {
					content: "" + nth($colors-dark, $i);
				}

				.code:after {
					content: "" + $c;
				}
			} // box
		} // for
	} // .box
} // .colors
</style>
