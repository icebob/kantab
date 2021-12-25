<template>
	<div class="flex flex-col border border-gray-500 rounded-md bg-panel shadow-lg relative">
		<div v-if="ribbon" :class="'ribbon ' + ribbonDirection + ' ' + ribbonColor">
			<span>{{ ribbon }}</span>
		</div>
		<div class="px-5 py-3 rounded-t-md" :class="bgColor">
			<slot name="header">
				<div class="font-title text-xl font-light text-white text-shadow">{{ title }}</div>
			</slot>
		</div>
		<div class="flex-1 px-5 py-3 overflow-y-auto">
			<slot />
		</div>
		<div v-if="hasFooterSlot || footer" class="px-5 py-3 rounded-b-md" :class="bgColor">
			<slot name="footer">
				<div v-if="footer" class="font-title text-xl font-light text-white text-shadow">
					{{ footer }}
				</div>
			</slot>
		</div>
	</div>
</template>

<script>
export default {
	props: {
		title: { type: String, default: null },
		color: { type: String, default: "bg-gray-500" },
		footer: { type: String, default: null },
		ribbon: { type: String, default: null },
		ribbonDirection: { type: String, default: "right" },
		ribbonColor: { type: String, default: "blue" }
	},

	computed: {
		bgColor() {
			return this.color ? this.color : "";
		},

		hasFooterSlot() {
			return !!this.$slots.footer;
		}
	}
};
</script>

<style lang="scss" scoped>
$textColor: #dedede;

@mixin ribbon($c, $text: $textColor) {
	$c2: darken($c, 15%);

	position: absolute;
	left: -5px;
	top: -5px;
	z-index: 1;
	overflow: hidden;
	width: 75px;
	height: 75px;
	text-align: right;

	span {
		font-size: 10px;
		font-weight: bold;
		color: $text;
		text-transform: uppercase;
		text-align: center;
		line-height: 20px;
		transform: rotate(-45deg);
		width: 100px;
		display: block;
		background: $c;
		background: linear-gradient($c 0%, $c2 100%);
		box-shadow: 0 3px 10px -5px rgba(0, 0, 0, 1);
		position: absolute;
		top: 19px;
		left: -21px;

		&::before {
			content: "";
			position: absolute;
			left: 0px;
			top: 100%;
			z-index: -1;
			border-left: 3px solid $c2;
			border-right: 3px solid transparent;
			border-bottom: 3px solid transparent;
			border-top: 3px solid $c2;
		}

		&::after {
			content: "";
			position: absolute;
			right: 0px;
			top: 100%;
			z-index: -1;
			border-left: 3px solid transparent;
			border-right: 3px solid $c2;
			border-bottom: 3px solid transparent;
			border-top: 3px solid $c2;
		}
	} // span

	&.right {
		left: initial;
		right: -4px;

		span {
			transform: rotate(45deg);
			left: initial;
			right: -23px;
		}
	}
} // .ribbon

.ribbon {
	@include ribbon(#b6bac9);
}

.ribbon.blue {
	@include ribbon(#2989d8);
}

.ribbon.primary {
	@include ribbon(#90b227);
}

.ribbon.black {
	@include ribbon(#222);
}

.ribbon.red {
	@include ribbon(#c30303);
}

.ribbon.green {
	@include ribbon(#9bc90d);
}

.ribbon.orange {
	@include ribbon(#f79e05);
}
</style>
