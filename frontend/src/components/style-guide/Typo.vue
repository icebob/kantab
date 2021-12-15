<template>
	<section>
		<section-header number="2" caption="Typography" />
		<div class="content typo">
			<div class="headers">
				<h1>Heading #1 - {{ getTypographyInfo("h1") }}</h1>
				<h2>Heading #2 - {{ getTypographyInfo("h2") }}</h2>
				<h3>Heading #3 - {{ getTypographyInfo("h3") }}</h3>
				<h4>Heading #4 - {{ getTypographyInfo("h4") }}</h4>
				<h5>Heading #5 - {{ getTypographyInfo("h5") }}</h5>
				<h5>
					ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 éáűőúöüóí
					ÉÁŰŐÚÖÜÓÍ
				</h5>
			</div>
			<hr />
			<div class="paragraph">
				<p>Paragraph - {{ getTypographyInfo("p") }}</p>
				<p>
					ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 éáűőúöüóí
					ÉÁŰŐÚÖÜÓÍ
				</p>
				<p>
					An example paragraph with <strong>strong text</strong> and
					<em>emphasized text</em>, spanning <br />multiple lines so you can see the
					line-height.
				</p>
				<p class="text-justify">
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec varius ipsum
					tortor, eget convallis ante sagittis ac. Nulla eget bibendum dolor. Praesent at
					ipsum bibendum, malesuada quam tincidunt, lobortis purus. Donec vel mi mollis,
					sagittis libero non, ultrices elit. Nulla non mauris in sapien mattis
					scelerisque. Vivamus maximus tincidunt mi, interdum pellentesque urna feugiat
					sed. Suspendisse vulputate metus leo, nec hendrerit sapien tincidunt ac. Vivamus
					non libero luctus, suscipit libero ut, elementum enim.
					<a class="link" href="#">Read more</a>
				</p>
				<p>
					Fusce aliquam sem lorem, in porttitor orci dignissim at. Sed non dolor at orci
					dignissim bibendum a non nibh. Duis nec vestibulum dui, sit amet lobortis
					ligula. Sed aliquam mauris nunc, eu sodales est faucibus vitae. Ut sed accumsan
					lectus. Interdum et <a class="link" href="#">malesuada</a> fames ac ante ipsum
					primis in faucibus. Aenean dignissim odio vehicula ligula varius, ac ullamcorper
					tortor molestie. Phasellus dolor dui, egestas id ornare in, suscipit et dolor.
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
	},
	data() {
		return {
			loaded: false
		};
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
	},

	mounted() {
		this.$nextTick(() => (this.loaded = true));
	}
};
</script>
