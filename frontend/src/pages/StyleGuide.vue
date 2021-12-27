<template>
	<div class="p-5">
		<h2 class="mb-8">Style guide</h2>

		<guide-section number="2" label="Colors">
			<div class="flex flex-col gap-2">
				<div>
					<h5>Primary</h5>
					<div class="border border-neutral-900 rounded flex p-2">
						<div class="w-16 text-center">
							<div class="h-16 bg-primary border border-black rounded"></div>
							<div class="pt-1 text-xs font-mono">
								{{ getColorInfo(".bg-primary") }}
							</div>
						</div>
						<div class="ml-4 flex-1 flex text-center">
							<div
								class="hidden bg-primary bg-primary-100 bg-primary-200 bg-primary-300 bg-primary-400 bg-primary-500 bg-primary-600 bg-primary-700 bg-primary-800 bg-primary-900"
							></div>
							<div v-for="i of paletteRange" :key="i" class="flex-1">
								<div :class="'h-16 bg-primary-' + i"></div>
								<div class="pt-1 text-xs font-mono">{{ i }}</div>
							</div>
						</div>
					</div>
				</div>
				<div class="mt-2">
					<h5>Secondary</h5>
					<div class="border border-neutral-900 rounded flex p-2">
						<div class="w-16 text-center">
							<div class="h-16 bg-secondary border border-black rounded"></div>
							<div class="pt-1 text-xs font-mono">
								{{ getColorInfo(".bg-secondary") }}
							</div>
						</div>
						<div class="ml-4 flex-1 flex text-center">
							<div
								class="hidden bg-secondary bg-secondary-100 bg-secondary-200 bg-secondary-300 bg-secondary-400 bg-secondary-500 bg-secondary-600 bg-secondary-700 bg-secondary-800 bg-secondary-900"
							></div>
							<div v-for="i of paletteRange" :key="i" class="flex-1">
								<div :class="'h-16 bg-secondary-' + i"></div>
								<div class="pt-1 text-xs font-mono">{{ i }}</div>
							</div>
						</div>
					</div>
				</div>
				<div class="mt-2">
					<h5>Other colors</h5>
					<div class="border border-neutral-900 rounded flex flex-wrap p-2">
						<div class="flex-1 text-center">
							<div class="font-title">panel</div>
							<div
								class="m-auto w-20 h-16 bg-panel border border-black rounded"
							></div>
							<div class="pt-1 text-xs font-mono">#2e353a</div>
						</div>
						<div class="flex-1 text-center">
							<div class="font-title">card</div>
							<div class="m-auto w-20 h-16 bg-card border border-black rounded"></div>
							<div class="pt-1 text-xs font-mono">
								{{ getColorInfo(".bg-card") }}
							</div>
						</div>
						<div class="flex-1 text-center">
							<div class="font-title">muted</div>
							<div
								class="m-auto w-20 h-16 bg-muted border border-black rounded"
							></div>
							<div class="pt-1 text-xs font-mono">
								{{ getColorInfo(".bg-muted") }}
							</div>
						</div>
						<div class="flex-1 text-center">
							<div class="font-title">input</div>
							<div
								class="m-auto w-20 h-16 bg-input border border-black rounded"
							></div>
							<div class="pt-1 text-xs font-mono">
								{{ getColorInfo(".bg-input") }}
							</div>
						</div>
						<div class="flex-1 text-center">
							<div class="font-title">text</div>
							<div class="m-auto w-20 h-16 bg-text border border-black rounded"></div>
							<div class="pt-1 text-xs font-mono">
								{{ getColorInfo(".bg-text") }}
							</div>
						</div>
						<div class="flex-1 text-center">
							<div class="font-title">warning</div>
							<div
								class="m-auto w-20 h-16 bg-warning border border-black rounded"
							></div>
							<div class="pt-1 text-xs font-mono">
								{{ getColorInfo(".bg-warning") }}
							</div>
						</div>
						<div class="flex-1 text-center">
							<div class="font-title">negative</div>
							<div
								class="m-auto w-20 h-16 bg-negative border border-black rounded"
							></div>
							<div class="pt-1 text-xs font-mono">
								{{ getColorInfo(".bg-negative") }}
							</div>
						</div>
						<div class="flex-1 text-center">
							<div class="font-title">positive</div>
							<div
								class="m-auto w-20 h-16 bg-positive border border-black rounded"
							></div>
							<div class="pt-1 text-xs font-mono">
								{{ getColorInfo(".bg-positive") }}
							</div>
						</div>
					</div>
				</div>
			</div>
		</guide-section>

		<guide-section number="2" label="Typography">
			<div class="flex flex-col gap-2">
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
					ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 éáűőúöüóí
					ÉÁŰŐÚÖÜÓÍ
				</p>
				<hr class="border-neutral-600" />
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
		</guide-section>

		<guide-section number="3" label="Buttons">
			<div class="flex flex-col gap-2">
				<h5 class="block border-b-2 border-b-neutral-600 mb-2 pb-1 uppercase">
					Normal buttons
				</h5>
				<div class="flex gap-4 items-center justify-center flex-wrap">
					<button class="button">Normal</button>
					<button class="button primary">Primary</button>
					<button class="button secondary">Secondary</button>
					<button class="button success icon"><i class="fa fa-check" />Success</button>
					<button class="button warning">Warning</button>
					<button class="button danger">Danger</button>
					<button class="button flat">Flat</button>
					<button class="button loading">Loading</button>
					<button class="button icon" disabled><i class="fa fa-ban" />Disabled</button>
				</div>
			</div>
			<div class="flex flex-col gap-2 mt-8">
				<h5 class="block border-b-2 border-b-neutral-600 mb-2 pb-1 uppercase">
					Outlined buttons
				</h5>
				<div class="flex gap-4 items-center justify-center flex-wrap">
					<button class="button outlined">Normal</button>
					<button class="button outlined primary">Primary</button>
					<button class="button outlined secondary">Secondary</button>
					<button class="button outlined success icon">
						<i class="fa fa-check" />Success
					</button>
					<button class="button outlined warning">Warning</button>
					<button class="button outlined danger">Danger</button>
					<button class="button outlined loading">Loading</button>
					<button class="button outlined icon" disabled>
						<i class="fa fa-ban" />Disabled
					</button>
				</div>
			</div>
			<div class="flex flex-col gap-2 mt-8">
				<h5 class="block border-b-2 border-b-neutral-600 mb-2 pb-1 uppercase">
					Large buttons
				</h5>
				<div class="flex gap-4 items-center justify-center flex-wrap">
					<button class="button large">Normal</button>
					<button class="button large primary">Primary</button>
					<button class="button large secondary">Secondary</button>
					<button class="button large success icon">
						<i class="fa fa-check" />Success
					</button>
					<button class="button large warning">Warning</button>
					<button class="button large danger">Danger</button>
					<button class="button large primary flat">Flat</button>
					<button class="button large outlined">Outlined</button>
					<button class="button large loading">Loading</button>
					<button class="button large icon" disabled>
						<i class="fa fa-ban" />Disabled
					</button>
				</div>
			</div>
			<div class="flex flex-col gap-2 mt-8">
				<h5 class="block border-b-2 border-b-neutral-600 mb-2 pb-1 uppercase">
					Small buttons
				</h5>
				<div class="flex gap-4 items-center justify-center flex-wrap">
					<button class="button small">Normal</button>
					<button class="button small primary">Primary</button>
					<button class="button small secondary">Secondary</button>
					<button class="button small success icon">
						<i class="fa fa-check" />Success
					</button>
					<button class="button small warning">Warning</button>
					<button class="button small danger">Danger</button>
					<button class="button small flat">Flat</button>
					<button class="button small outlined">Outlined</button>
					<button class="button small loading">Loading</button>
					<button class="button small icon" disabled>
						<i class="fa fa-ban" />Disabled
					</button>
				</div>
			</div>
			<div class="flex flex-col gap-2 mt-8">
				<h5 class="block border-b-2 border-b-neutral-600 mb-2 pb-1 uppercase">
					Icon buttons
				</h5>
				<div class="flex gap-4 items-center justify-center flex-wrap">
					<button class="button"><i class="fa fa-home" /></button>
					<button class="button large primary"><i class="fa fa-tasks" /></button>
					<button class="button small success"><i class="fa fa-cogs" /></button>
					<button class="button warning"><i class="fa fa-comments" /></button>
					<button class="button danger"><i class="fa fa-trash" /></button>
					<button class="button outlined"><i class="fa fa-pencil" /></button>
					<button class="button flat"><i class="fa fa-bar-chart" /></button>
					<button class="button" disabled><i class="fa fa-ban" /></button>
				</div>
			</div>
			<div class="flex flex-col gap-2 mt-8">
				<h5 class="block border-b-2 border-b-neutral-600 mb-2 pb-1 uppercase">
					Floating buttons
				</h5>
				<div class="flex gap-4 items-center justify-center flex-wrap">
					<button class="button floating large"><i class="fa fa-plus" /></button>
					<button class="button floating small primary">
						<i class="fa fa-plus" />
					</button>
					<button class="button floating success">
						<i class="fa fa-check" />
					</button>
					<button class="button floating warning" disabled>
						<i class="fa fa-comments" />
					</button>
					<button class="button floating danger">
						<i class="fa fa-trash" />
					</button>
					<button class="button floating flat">
						<i class="fa fa-bar-chart" />
					</button>
					<button class="button floating outlined">
						<i class="fa fa-bars" />
					</button>
					<button class="button floating" disabled><i class="fa fa-ban" /></button>
				</div>
			</div>
			<div class="flex flex-col gap-2 mt-8">
				<h5 class="block border-b-2 border-b-neutral-600 mb-2 pb-1 uppercase">
					Button group
				</h5>
				<div class="flex gap-4 items-center justify-center flex-wrap">
					<div class="button-group">
						<button class="button icon"><i class="fa fa-align-left"></i>Left</button>
						<button class="button icon">
							<i class="fa fa-align-center"></i>Middle
						</button>
						<button class="button icon active">
							<i class="fa fa-align-right"></i>Right
						</button>
					</div>
				</div>
			</div>
		</guide-section>

		<guide-section number="4" label="Forms">
			<div class="flex flex-col gap-2">
				<h5 class="block border-b-2 border-b-neutral-600 mb-2 pb-1 uppercase">
					Input fields
				</h5>
				<div class="flex flex-col gap-4">
					<div class="form-element">
						<label>Label</label>
						<input type="text" placeholder="Placeholder" />
					</div>
					<div class="form-element">
						<label>Label with hint</label>
						<input type="text" placeholder="Placeholder" />
						<div class="hint">Maximum 100 characters</div>
					</div>
					<div class="form-element">
						<label>Label with icon</label>
						<input type="text" placeholder="Placeholder" />
						<i class="icon fa fa-search" />
					</div>
					<div class="form-element valid">
						<label>Label for valid input</label>
						<input type="text" placeholder="Placeholder" />
						<i class="icon fa fa-check" />
					</div>
					<div class="form-element error">
						<label>Label for invalid input with error messages</label>
						<input type="text" placeholder="Placeholder" />
						<i class="icon fa fa-exclamation-triangle" />
						<div class="errors">
							<div>Too short!</div>
							<div>Invalid text content!</div>
						</div>
					</div>
					<div class="form-element">
						<label for="text5">Label for textarea</label>
						<textarea type="text" placeholder="Placeholder" rows="5"></textarea>
					</div>
				</div>
			</div>
			<div class="flex flex-col gap-2 mt-8">
				<h5 class="block border-b-2 border-b-neutral-600 mb-2 pb-1 uppercase">Select</h5>
				<div class="flex flex-col gap-4">
					<div class="form-element">
						<label>Label for select</label>
						<select id="select1" class="form-control">
							<option>Option 1</option>
							<option>Option 2</option>
							<option>Option 3</option>
							<option>Option 4</option>
						</select>
					</div>
				</div>
			</div>
			<div class="flex flex-col gap-2 mt-8">
				<h5 class="block border-b-2 border-b-neutral-600 mb-2 pb-1 uppercase">
					Radio buttons
				</h5>
				<div class="flex flex-col gap-4">
					<div class="form-option">
						<input id="radio1" type="radio" name="radio" />
						<label for="radio1">Option one</label>
					</div>
					<div class="form-option">
						<input id="radio2" type="radio" name="radio" />
						<label for="radio2">Option two</label>
					</div>
					<div class="form-option">
						<input id="radio2" type="radio" name="radio" disabled />
						<label for="radio2">Option three (disabled)</label>
					</div>
				</div>
			</div>
			<div class="flex flex-col gap-2 mt-8">
				<h5 class="block border-b-2 border-b-neutral-600 mb-2 pb-1 uppercase">
					Checkboxes
				</h5>
				<div class="flex flex-col gap-4">
					<div class="form-option">
						<input id="check1" type="checkbox" />
						<label for="check1">Option one</label>
					</div>
					<div class="form-option">
						<input id="check2" type="checkbox" checked />
						<label for="check2">Option two</label>
					</div>
					<div class="form-option">
						<input id="check3" type="checkbox" disabled />
						<label for="check3">Option three (disabled)</label>
					</div>
					<div class="form-option">
						<input id="check4" type="checkbox" checked disabled />
						<label for="check4">Option three (disabled & checked)</label>
					</div>
				</div>
			</div>
			<div class="flex flex-col gap-2 mt-8">
				<h5 class="block border-b-2 border-b-neutral-600 mb-2 pb-1 uppercase">Switches</h5>
				<div class="flex flex-col gap-4">
					<div class="form-switch">
						<input id="switch1" type="checkbox" />
						<label for="switch1">Switch one</label>
					</div>
					<div class="form-switch">
						<input id="switch2" type="checkbox" checked />
						<label for="switch2">Switch two</label>
					</div>
					<div class="form-switch">
						<input id="switch3" type="checkbox" disabled />
						<label for="switch3">Switch three (disabled)</label>
					</div>
					<div class="form-switch">
						<input id="switch4" type="checkbox" checked disabled />
						<label for="switch4">Switch three (disabled & checked)</label>
					</div>
				</div>
			</div>
		</guide-section>
		<guide-section number="5" label="Alerts">
			<div class="flex flex-col gap-4">
				<div class="alert">This is a neutral alert.</div>
				<div class="alert">
					<i class="icon fa fa-info-circle" />This is a neutral alert with icon.
				</div>
				<div class="alert flex items-center">
					<i class="icon fa fa-info-circle" />
					<span class="flex-1">This is a neutral alert with icon and close button.</span>
					<i class="close fa fa-times" />
				</div>
				<div class="alert bg-primary">This is a primary alert.</div>
				<div class="alert bg-secondary">This is a secondary alert.</div>
				<div class="alert bg-positive">
					<i class="icon fa fa-check-circle" />This is a success alert.
				</div>
				<div class="alert bg-warning">
					<i class="icon fa fa-exclamation-triangle" />This is a warning alert.
				</div>
				<div class="alert bg-negative">
					<i class="icon fa fa-times-circle" />This is an error alert.
				</div>
				<div class="alert py-3">
					<h4 class="mb-2">Well done!</h4>
					<p>
						Aww yeah, you successfully read this important alert message. This example
						text is going to run a bit longer so that you can see how spacing within an
						alert works with this kind of content.
					</p>
				</div>
			</div>
		</guide-section>
		<guide-section number="6" label="Badges">
			<div class="flex flex-col gap-2">
				<h5 class="block border-b-2 border-b-neutral-600 mb-2 pb-1 uppercase">Badges</h5>
				<div class="flex gap-8 items-center justify-center flex-wrap">
					<div class="badge">Normal</div>
					<div class="badge bg-primary">Primary</div>
					<div class="badge bg-positive">Success</div>
					<div class="badge bg-warning">Warning</div>
					<div class="badge bg-negative">
						<i class="fa fa-exclamation-triangle mr-1" />Danger
					</div>
					<div class="badge outlined">Outlined</div>
				</div>
			</div>
			<div class="flex flex-col gap-2 mt-8">
				<h5 class="block border-b-2 border-b-neutral-600 mb-2 pb-1 uppercase">
					Rounded badges
				</h5>
				<div class="flex gap-8 items-center justify-center flex-wrap">
					<div class="badge pill">15</div>
					<div class="badge pill bg-primary">5</div>
					<div class="badge pill bg-positive">100+</div>
					<div class="badge pill bg-warning">45</div>
					<div class="badge pill bg-negative">0</div>
					<div class="badge pill outlined">8</div>
				</div>
			</div>
		</guide-section>
		<guide-section number="7" label="Tables">
			<div class="flex flex-col gap-2">
				<h5 class="block border-b-2 border-b-neutral-600 mb-2 pb-1 uppercase">
					Normal table
				</h5>
				<div class="">
					<table class="table">
						<thead>
							<tr>
								<th>#</th>
								<th class="sortable sorted">Name</th>
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
								<td>
									<div class="flex justify-end gap-2">
										<button class="button small">
											<i class="fa fa-edit"></i>
										</button>
										<button class="button small danger">
											<i class="fa fa-trash"></i>
										</button>
									</div>
								</td>
							</tr>
							<tr>
								<td>2</td>
								<td>Johnny Avlony</td>
								<td>info@johnnyavlony.com</td>
								<td>(740) 841-7566</td>
								<td class="text-right">$2,400.00</td>
								<td>
									<div class="flex justify-end gap-2">
										<button class="button small">Edit</button>
										<button class="button small danger icon">
											<i class="fa fa-trash"></i>Delete
										</button>
									</div>
								</td>
							</tr>
							<tr class="selected">
								<td>3</td>
								<td>Johnny Avlony</td>
								<td>info@johnnyavlony.com</td>
								<td>(740) 841-7566</td>
								<td class="text-right">$2,400.00</td>
								<td>
									<div class="flex justify-end gap-2">
										<button class="button small">Edit</button>
										<button class="button small danger icon">
											<i class="fa fa-trash"></i>Delete
										</button>
									</div>
								</td>
							</tr>
							<tr class="inactive">
								<td>4</td>
								<td>Johnny Avlony</td>
								<td>info@johnnyavlony.com</td>
								<td>(740) 841-7566</td>
								<td class="text-right">$2,400.00</td>
								<td>
									<div class="flex justify-end gap-2">
										<button class="button small">Edit</button>
										<button class="button small danger icon">
											<i class="fa fa-trash"></i>Delete
										</button>
									</div>
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
				<h5 class="block border-b-2 border-b-neutral-600 mb-2 pb-1 uppercase mt-8">
					Stripped and bordered table
				</h5>
				<div class="">
					<table class="table stripped bordered">
						<thead>
							<tr>
								<th>#</th>
								<th class="sortable sorted desc">Name</th>
								<th class="sortable"><i class="fa fa-envelope"></i>Mail</th>
								<th class="sortable"><i class="fa fa-phone"></i>Phone</th>
								<th class="sortable text-right">Outstanding</th>
								<th class="text-right"></th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td class="selector"></td>
								<td>Johnny Avlony</td>
								<td>info@johnnyavlony.com</td>
								<td>(740) 841-7566</td>
								<td class="text-right">$2,400.00</td>
								<td>
									<div class="flex justify-end gap-2">
										<button class="button small">
											<i class="fa fa-edit"></i>
										</button>
										<button class="button small danger">
											<i class="fa fa-trash"></i>
										</button>
									</div>
								</td>
							</tr>
							<tr>
								<td class="selector"></td>
								<td>Johnny Avlony</td>
								<td>info@johnnyavlony.com</td>
								<td>(740) 841-7566</td>
								<td class="text-right">$2,400.00</td>
								<td>
									<div class="flex justify-end gap-2">
										<button class="button small">Edit</button>
										<button class="button small danger icon">
											<i class="fa fa-trash"></i>Delete
										</button>
									</div>
								</td>
							</tr>
							<tr class="">
								<td class="selector"></td>
								<td>Johnny Avlony</td>
								<td>info@johnnyavlony.com</td>
								<td>(740) 841-7566</td>
								<td class="text-right">$2,400.00</td>
								<td>
									<div class="flex justify-end gap-2">
										<button class="button small">Edit</button>
										<button class="button small danger icon">
											<i class="fa fa-trash"></i>Delete
										</button>
									</div>
								</td>
							</tr>
							<tr class="selected inactive">
								<td class="selector"></td>
								<td>Johnny Avlony</td>
								<td>info@johnnyavlony.com</td>
								<td>(740) 841-7566</td>
								<td class="text-right">$2,400.00</td>
								<td>
									<div class="flex justify-end gap-2">
										<button class="button small">Edit</button>
										<button class="button small danger icon">
											<i class="fa fa-trash"></i>Delete
										</button>
									</div>
								</td>
							</tr>
						</tbody>
						<tfoot>
							<tr>
								<td class="selector"></td>
								<td></td>
								<td></td>
								<td></td>
								<td class="text-right">$15,500.00</td>
								<td class="text-right"></td>
							</tr>
						</tfoot>
					</table>
				</div>
			</div>
		</guide-section>

		<guide-section number="8" label="Progress">
			<div class="flex flex-col gap-2">
				<h5 class="block border-b-2 border-b-neutral-600 mb-2 pb-1 uppercase">Normal</h5>
				<div class="flex flex-col gap-4 justify-center">
					<div class="progressbar">
						<div class="progress" style="width: 15%"></div>
					</div>
					<div class="progressbar">
						<div class="progress bg-positive" style="width: 40%">40% complete...</div>
					</div>
					<div class="progressbar">
						<div class="progress bg-warning" style="width: 60%">60%</div>
					</div>
					<div class="progressbar">
						<div class="progress bg-negative" style="width: 70%"></div>
					</div>
					<div class="progressbar extra-small">
						<div class="progress" style="width: 75%"></div>
					</div>
					<div class="progressbar small">
						<div class="progress" style="width: 80%">Small progress</div>
					</div>
					<div class="progressbar large">
						<div class="progress" style="width: 90%">Large progress</div>
					</div>
				</div>
			</div>
			<div class="flex flex-col gap-2 mt-8">
				<h5 class="block border-b-2 border-b-neutral-600 mb-2 pb-1 uppercase">Normal</h5>
				<div class="flex flex-col gap-4 justify-center">
					<div class="progressbar stripped">
						<div class="progress" style="width: 15%"></div>
					</div>
					<div class="progressbar stripped">
						<div class="progress bg-positive" style="width: 40%">40% complete...</div>
					</div>
					<div class="progressbar stripped">
						<div class="progress bg-warning" style="width: 60%">60%</div>
					</div>
					<div class="progressbar stripped">
						<div class="progress bg-negative" style="width: 70%"></div>
					</div>
					<div class="progressbar stripped small">
						<div class="progress" style="width: 80%">Small progress</div>
					</div>
					<div class="progressbar stripped large">
						<div class="progress" style="width: 90%">Large progress</div>
					</div>
				</div>
			</div>
		</guide-section>

		<guide-section number="9" label="Panels & Cards">
			<div class="flex flex-col gap-2">
				<h5 class="block border-b-2 border-b-neutral-600 mb-2 pb-1 uppercase">
					Normal cards
				</h5>
				<div class="flex gap-8 items-start justify-center flex-wrap">
					<card
						title="Simple card"
						description="Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur dicta cumque assumenda culpa maiores omnis totam obcaecati voluptas eligendi sapiente enim debitis, illo dolore facilis, in, nihil perspiciatis, et perferendis."
						footer="Last updated 5 mins ago"
						class="w-64"
					/>
					<card
						title="Card with ribbon and footer"
						description="Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur dicta cumque assumenda culpa maiores omnis totam obcaecati voluptas eligendi sapiente enim debitis, illo dolore facilis, in, nihil perspiciatis, et perferendis."
						ribbon="Public"
						class="w-64"
					>
						<template #footer>
							<button class="button primary">Checkout</button>
						</template>
					</card>
					<card
						cover-image="https://picsum.photos/350/150"
						title="Card with image"
						description="Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur dicta cumque assumenda culpa maiores omnis totam obcaecati voluptas eligendi sapiente enim debitis, illo dolore facilis, in, nihil perspiciatis, et perferendis."
						ribbon="Brand new"
						ribbon-color="primary"
						ribbon-direction="left"
						class="w-96"
					/>
					<card ribbon="Customize" ribbon-color="red">
						<div class="p-5">
							<h4 class="text-primary">Customizable content</h4>
							<div class="py-5">
								<div class="form-element">
									<label>Label</label>
									<input type="text" placeholder="Placeholder" />
								</div>
							</div>
							<div class="alert bg-yellow-600 text-xs">
								Something awesome happened!
							</div>
							<div class="pt-5 flex justify-center items-center">
								<button class="button icon"><i class="fa fa-cloud" />Upload</button>
								<button class="button flat">Cancel</button>
							</div>
						</div>
					</card>
				</div>
			</div>

			<div class="flex flex-col gap-2">
				<h5 class="block border-b-2 border-b-neutral-600 mb-2 pb-1 uppercase">
					Normal panels
				</h5>
				<div class="flex gap-4 items-start justify-center flex-wrap">
					<panel class="w-80" title="Panel normal">
						<p>
							Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur
							dicta cumque assumenda culpa maiores omnis totam obcaecati voluptas
							eligendi sapiente enim debitis, illo dolore facilis, in, nihil
							perspiciatis, et perferendis.
						</p>
					</panel>
					<panel
						class="w-80"
						title="Panel with footer"
						footer="Panel footer"
						color="bg-primary"
					>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur
							dicta cumque assumenda culpa maiores omnis totam obcaecati voluptas
							eligendi sapiente enim debitis, illo dolore facilis, in, nihil
							perspiciatis, et perferendis.
						</p>
					</panel>
					<panel
						class="w-80 h-96"
						title="Panel with scroll"
						footer="Panel footer"
						color="bg-secondary"
					>
						<p>
							Duis ex nulla eu ex quis consectetur amet voluptate qui ipsum aliqua
							nisi commodo cupidatat. Reprehenderit aliqua sint magna ad eiusmod magna
							non esse. Ex tempor ex duis dolore commodo labore aliquip ad dolor nulla
							est. Ex eiusmod labore deserunt velit ad consequat elit. Quis elit
							cupidatat culpa pariatur excepteur. Elit nulla nisi ut nulla cupidatat
							ipsum officia sint consectetur in laboris. Voluptate anim in et esse.
							Voluptate ad est irure eiusmod sit enim pariatur adipisicing. Dolore
							officia nulla reprehenderit ipsum do aliquip incididunt eiusmod
							cupidatat exercitation consectetur incididunt.
						</p>
					</panel>
					<panel
						class="w-80 bg-neutral-800"
						color="bg-neutral-900"
						ribbon="Customize"
						ribbon-color="red"
					>
						<template #header>
							<h4 class="text-primary">Customizable content</h4>
						</template>
						<template #default>
							<div class="pb-5">
								<div class="form-element">
									<label>Label</label>
									<input type="text" placeholder="Placeholder" />
								</div>
							</div>
							<div class="mb-2 alert bg-yellow-600 text-xs">
								Something awesome happened!
							</div>
						</template>
						<template #footer>
							<div class="flex justify-between items-center">
								<button class="button icon"><i class="fa fa-cloud" />Upload</button>
								<button class="button flat">Cancel</button>
							</div>
						</template>
					</panel>
				</div>
			</div>
		</guide-section>
	</div>
</template>

<script>
import GuideSection from "../components/GuideSection.vue";
import Card from "../components/Card.vue";
import Panel from "../components/Panel.vue";

export default {
	components: {
		GuideSection,
		Card,
		Panel
	},

	data() {
		return {
			loaded: false
		};
	},

	computed: {
		paletteRange() {
			return [100, 200, 300, 400, 500, 600, 700, 800, 900];
		}
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
		},

		// Credits: https://github.com/sindresorhus/rgb-hex/blob/main/index.js
		getColorInfo(selector) {
			if (this.loaded && this.$el) {
				let element = this.$el.querySelector(selector);
				if (element) {
					let style = window.getComputedStyle(element, null);
					const c = style.backgroundColor;
					if (c) {
						const [red, green, blue, alpha = ""] = c
							.match(/(0?\.?\d{1,3})%?\b/g)
							.map(component => Number(component));
						return (
							"#" +
							((blue | (green << 8) | (red << 16) | (1 << 24)).toString(16).slice(1) +
								alpha)
						);
					}
				}
			}
		}
	}
};
</script>
