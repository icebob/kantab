<template>
	<section>
		<section-header number="6" caption="Tables" />
		<div class="content tables">
			<table class="table stripped bordered">
				<thead>
					<tr>
						<th>#</th>
						<th class="sortable">Name</th>
						<th class="sortable"><i class="fa fa-envelope"></i>Mail</th>
						<th class="sortable"><i class="fa fa-phone"></i>Phone</th>
						<th class="sortable text-right">Outstanding</th>
						<th class="text-right">Functions</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>1</td>
						<td>Johnny Avlony</td>
						<td>info@johnnyavlony.com</td>
						<td>(740) 841-7566</td>
						<td class="text-right">$2,400.00</td>
						<td class="text-right buttons">
							<button class="button small"><i class="fa fa-edit"></i></button>
							<button class="button small danger"><i class="fa fa-trash"></i></button>
						</td>
					</tr>
					<tr>
						<td>2</td>
						<td>Johnny Avlony</td>
						<td>info@johnnyavlony.com</td>
						<td>(740) 841-7566</td>
						<td class="text-right">$2,400.00</td>
						<td class="text-right buttons">
							<button class="button small">Edit</button>
							<button class="button small danger icon">
								<i class="fa fa-trash"></i>Delete
							</button>
						</td>
					</tr>
					<tr class="selected">
						<td>3</td>
						<td>Johnny Avlony</td>
						<td>info@johnnyavlony.com</td>
						<td>(740) 841-7566</td>
						<td class="text-right">$2,400.00</td>
						<td class="text-right buttons">
							<button class="button small">Edit</button>
							<button class="button small danger icon">
								<i class="fa fa-trash"></i>Delete
							</button>
						</td>
					</tr>
					<tr class="inactive">
						<td>4</td>
						<td>Johnny Avlony</td>
						<td>info@johnnyavlony.com</td>
						<td>(740) 841-7566</td>
						<td class="text-right">$2,400.00</td>
						<td class="text-right buttons">
							<button class="button small">Edit</button>
							<button class="button small danger icon">
								<i class="fa fa-trash"></i>Delete
							</button>
						</td>
					</tr>
				</tbody>
				<tfoot>
					<tr>
						<td>4</td>
						<td></td>
						<td></td>
						<td></td>
						<td class="text-right">$15,500.00</td>
						<td class="text-right"></td>
					</tr>
				</tfoot>
			</table>
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
