<template>
	<div>
		<h4 class="bg-neutral-900 border border-black p-2 px-4 rounded-lg">
			<span class="text-gray-500">{{ number }}</span>
			<span class="ml-2 uppercase">{{ label }}</span>
		</h4>
		<div class="m-8 mt-4">
			<slot />
		</div>
	</div>
</template>

<script>
export default {
	props: {
		number: {
			type: String,
			default: "1"
		},
		label: {
			type: String,
			default: "Not defined"
		}
	}
};
</script>
