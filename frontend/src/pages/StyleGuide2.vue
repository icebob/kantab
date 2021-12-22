<template>
	<div class="p-5">
		<h3 class="mb-2">Style guide</h3>

		<h4 class="bg-neutral-900 border border-black p-2 px-4 rounded-lg">
			<span class="text-gray-500">2</span>
			<span class="ml-2 uppercase">Typography</span>
		</h4>
		<div class="m-4 flex flex-col gap-2">
			<h1>
				Heading #1 - <span class="text-neutral-400">{{ getTypographyInfo("h1") }}</span>
			</h1>
			<h2>
				Heading #2 - <span class="text-neutral-400">{{ getTypographyInfo("h2") }}</span>
			</h2>
			<h3>
				Heading #3 - <span class="text-neutral-400">{{ getTypographyInfo("h3") }}</span>
			</h3>
			<h4>
				Heading #4 - <span class="text-neutral-400">{{ getTypographyInfo("h4") }}</span>
			</h4>
			<h5>
				Heading #5 - <span class="text-neutral-400">{{ getTypographyInfo("h5") }}</span>
			</h5>

			<p>
				Paragraph - <span class="text-neutral-400">{{ getTypographyInfo("p") }}</span>
			</p>
			<p>
				ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 éáűőúöüóí ÉÁŰŐÚÖÜÓÍ
			</p>
			<hr class="border-neutral-600" />
			<p>
				An example paragraph with <strong>strong text</strong> and <em>emphasized text</em>,
				spanning <br />multiple lines so you can see the line-height.
			</p>
			<p class="text-justify">
				Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec varius ipsum tortor,
				eget convallis ante sagittis ac. Nulla eget bibendum dolor. Praesent at ipsum
				bibendum, malesuada quam tincidunt, lobortis purus. Donec vel mi mollis, sagittis
				libero non, ultrices elit. Nulla non mauris in sapien mattis scelerisque. Vivamus
				maximus tincidunt mi, interdum pellentesque urna feugiat sed. Suspendisse vulputate
				metus leo, nec hendrerit sapien tincidunt ac. Vivamus non libero luctus, suscipit
				libero ut, elementum enim.
				<a class="link" href="#">Read more</a>
			</p>
			<p>
				Fusce aliquam sem lorem, in porttitor orci dignissim at. Sed non dolor at orci
				dignissim bibendum a non nibh. Duis nec vestibulum dui, sit amet lobortis ligula.
				Sed aliquam mauris nunc, eu sodales est faucibus vitae. Ut sed accumsan lectus.
				Interdum et <a class="link" href="#">malesuada</a> fames ac ante ipsum primis in
				faucibus. Aenean dignissim odio vehicula ligula varius, ac ullamcorper tortor
				molestie. Phasellus dolor dui, egestas id ornare in, suscipit et dolor.
			</p>
		</div>

		<h4 class="bg-neutral-900 border border-black p-2 px-4 rounded-lg">
			<span class="text-gray-500">3</span>
			<span class="ml-2 uppercase">Buttons</span>
		</h4>
		<div class="m-4 flex flex-col gap-2">
			<h5 class="block border-b-2 border-b-neutral-600 mb-2 pb-1 uppercase">
				Normal buttons
			</h5>
			<div class="flex gap-4 items-center justify-center flex-wrap">
				<button class="button">Normal</button>
				<button class="button primary">Primary</button>
				<button class="button secondary">Secondary</button>
				<button class="button success icon"><i class="fa fa-check"></i>Success</button>
				<button class="button warning">Warning</button>
				<button class="button danger">Danger</button>
				<button class="button flat">Flat</button>
				<button class="button outlined">Outlined</button>
				<button class="button loading">Loading</button>
				<button class="button" disabled>Disabled</button>
			</div>
		</div>
		<div class="m-4 flex flex-col gap-2">
			<h5 class="block border-b-2 border-b-neutral-600 mb-2 pb-1 uppercase">Large buttons</h5>
			<div class="flex gap-4 items-center justify-center flex-wrap">
				<button class="button large">Normal</button>
				<button class="button large primary">Primary</button>
				<button class="button large secondary">Secondary</button>
				<button class="button large success icon">
					<i class="fa fa-check"></i>Success
				</button>
				<button class="button large warning">Warning</button>
				<button class="button large danger">Danger</button>
				<button class="button large flat">Flat</button>
				<button class="button large outlined">Outlined</button>
				<button class="button large loading">Loading</button>
				<button class="button large" disabled>Disabled</button>
			</div>
		</div>
		<div class="m-4 flex flex-col gap-2">
			<h5 class="block border-b-2 border-b-neutral-600 mb-2 pb-1 uppercase">Small buttons</h5>
			<div class="flex gap-4 items-center justify-center flex-wrap">
				<button class="button small">Normal</button>
				<button class="button small primary">Primary</button>
				<button class="button small secondary">Secondary</button>
				<button class="button small success icon">
					<i class="fa fa-check"></i>Success
				</button>
				<button class="button small warning">Warning</button>
				<button class="button small danger">Danger</button>
				<button class="button small flat">Flat</button>
				<button class="button small outlined">Outlined</button>
				<button class="button small loading">Loading</button>
				<button class="button small" disabled>Disabled</button>
			</div>
		</div>
		<div class="m-4 flex flex-col gap-2">
			<h5 class="block border-b-2 border-b-neutral-600 mb-2 pb-1 uppercase">Icon buttons</h5>
			<div class="flex gap-4 items-center justify-center flex-wrap">
				<button class="button"><i class="fa fa-home"></i></button>
				<button class="button large primary"><i class="fa fa-tasks"></i></button>
				<button class="button small success"><i class="fa fa-cogs"></i></button>
				<button class="button warning"><i class="fa fa-comments"></i></button>
				<button class="button danger"><i class="fa fa-trash"></i></button>
				<button class="button outline"><i class="fa fa-pencil"></i></button>
				<button class="button flat"><i class="fa fa-bar-chart"></i></button>
				<button class="button outlined"><i class="fa fa-gear"></i></button>
				<button class="button" disabled><i class="fa fa-warning"></i></button>
			</div>
		</div>
		<div class="m-4 flex flex-col gap-2">
			<h5 class="block border-b-2 border-b-neutral-600 mb-2 pb-1 uppercase">
				Floating buttons
			</h5>
			<div class="flex gap-4 items-center justify-center flex-wrap">
				<button class="button floating large"><i class="fa fa-plus"></i></button>
				<button class="button floating small primary">
					<i class="fa fa-plus"></i>
				</button>
				<button class="button floating success">
					<i class="fa fa-check"></i>
				</button>
				<button class="button floating warning" disabled>
					<i class="fa fa-comments"></i>
				</button>
				<button class="button floating danger">
					<i class="fa fa-trash"></i>
				</button>
				<button class="button floating flat">
					<i class="fa fa-bar-chart"></i>
				</button>
				<button class="button floating outlined">
					<i class="fa fa-bars"></i>
				</button>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	data() {
		return {
			loaded: false
		};
	},

	mounted() {
		this.$nextTick(() => (this.loaded = true));
	},

	methods: {
		getTypographyInfo(elType) {
			if (this.loaded && this.$el) {
				let element = this.$el.querySelector(elType);
				if (element) {
					let style = window.getComputedStyle(element, null);
					return (
						style.fontFamily.split(",")[0] +
						" " +
						style.fontWeight +
						", " +
						style.fontSize
					);
				}
			}
		}
	}
};
</script>
