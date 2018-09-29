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
		<h2><span class="number">3.</span><span class="text">Buttons</span></h2>
		<fieldset>
			<legend>Normal buttons</legend>
			<div class="content flex align-center justify-space-around wrap buttons">
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
			<div class="content flex align-center justify-space-around wrap buttons">
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
			<div class="content flex align-center justify-space-around wrap buttons">
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
			<div class="content flex align-center justify-space-around wrap buttons">
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
			<div class="content flex align-center justify-space-around wrap buttons">
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
			<div class="content flex align-center justify-space-around wrap buttons">
				<button class="button fab large"><i class="icon fa fa-plus"></i>Normal</button>
				<button class="button fab small primary"> <i class="icon fa fa-plus"></i>Primary</button>
				<button class="button fab success"><i class="icon fa fa-check"></i>Success</button>
				<button disabled="disabled" class="button fab warning"><i class="icon fa fa-comments"></i>Warning</button>
				<button class="button fab danger"><i class="icon fa fa-trash"></i>Danger</button>
				<button class="button fab outline"><i class="icon fa fa-bars"></i>Outline</button>
			</div>
		</fieldset>
		<fieldset>
			<legend>Button group</legend>
			<div class="content flex align-center justify-space-around buttons">
				<div class="button-group">
					<button class="button"> <i class="icon fa fa-align-left"></i>Left</button>
					<button class="button"><i class="icon fa fa-align-center"></i>Middle</button>
					<button class="button"><i class="icon fa fa-align-right"></i>Right</button>
				</div>
			</div>
		</fieldset>
	</section>
	<section>
	<h2><span class="number">4.</span><span class="text">Form elements</span></h2>
	<div class="content forms">
		<form action="#">
		<fieldset>
			<legend>Input fields</legend>
			<div class="form-group">
			<label for="text1">Label</label>
			<input class="form-control" id="text1" type="text" placeholder="Placeholder" />
			</div>
			<div class="form-group">
			<label for="text2">Label with hint</label>
			<input class="form-control" id="text2" type="text" placeholder="Placeholder" />
			<div class="hint">Maxium 100 characters</div>
			</div>
			<div class="form-group has-icon valid">
			<label for="text3">Label for valid input</label>
			<input class="form-control" id="text3" type="text" placeholder="Placeholder" /><i class="icon fa fa-check"></i>
			</div>
			<div class="form-group has-icon error">
			<label for="text4">Label for invalid input with error messages</label>
			<input class="form-control" id="text4" type="text" placeholder="Placeholder" /><i class="icon fa fa-exclamation-triangle"></i>
			<div class="errors"><span>Too short!</span><span>Invalid text content!</span></div>
			</div>
			<div class="form-group">
			<label for="text5">Label for textarea</label>
			<textarea class="form-control" id="text5" type="text" placeholder="Placeholder" rows="5"></textarea>
			</div>
		</fieldset>
		<fieldset>
			<legend>Selections</legend>
			<div class="form-group">
			<label for="select1">Label for select</label>
			<select class="form-control" id="select1">
				<option>Option 1</option>
				<option>Option 2</option>
				<option>Option 3 </option>
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
	<section>
	<h2><span class="number">5.</span><span class="text">Alerts</span></h2>
	<div class="content alerts">
		<div class="alert"> <i class="icon fa fa-info-circle"></i>This is a neutral alert. </div>
		<div class="alert primary"><i class="icon fa fa-home"></i>This is a primary alert.<a class="close" href="x">&times;</a></div>
		<div class="alert secondary"><i class="icon fa fa-envelope"></i>This is a secondary alert.<a class="close" href="x">&times;</a></div>
		<div class="alert success"><i class="icon fa fa-check"></i>This is a success alert.<a class="close" href="x">&times;</a></div>
		<div class="alert warning"><i class="icon fa fa-exclamation-triangle"></i>This is a warning alert.<a class="close" href="x">&times; </a></div>
		<div class="alert error"><i class="icon fa fa-times-circle"></i><strong>Error!</strong>This is an error alert.<a class="close" href="x">&times; </a></div>
		<div class="alert success">
		<h4>Well done!</h4>
		<p>Aww yeah, you successfully read this important alert message. This example text is going to run a bit longer so that you can see how spacing within an alert works with this kind of content.</p>
		</div>
	</div>
	</section>
	<section>
	<h2><span class="number">6.</span><span class="text">Tables</span></h2>
	<div class="content tables">
		<table class="table stripped bordered">
		<thead>
			<tr>
			<th>#</th>
			<th class="sortable">Name</th>
			<th class="sortable"> <i class="fa fa-envelope"></i>Mail</th>
			<th class="sortable"> <i class="fa fa-phone"></i>Phone</th>
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
				<button class="button small danger"> <i class="icon fa fa-trash"></i>Delete</button>
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
				<button class="button small danger"> <i class="icon fa fa-trash"></i>Delete</button>
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
				<button class="button small danger"> <i class="icon fa fa-trash"></i>Delete</button>
			</td>
			</tr>
		</tbody>
		<tfoot>
			<tr>
			<td>4</td>
			<td> </td>
			<td> </td>
			<td> </td>
			<td class="text-right">$15,500.00</td>
			<td class="text-right"> </td>
			</tr>
		</tfoot>
		</table>
	</div>
	</section>
	<section>
	<h2><span class="number">7.</span><span class="text">Tags / badges</span></h2>
	<fieldset>
		<legend>Tags</legend>
		<div class="content flex align-center justify-space-around buttons">
		<div class="tag">Normal</div>
		<div class="tag primary">Primary</div>
		<div class="tag success">Success</div>
		<div class="tag warning">Warning</div>
		<div class="tag danger">Danger</div>
		<div class="tag outline">Outline</div>
		</div>
	</fieldset>
	<fieldset>
		<legend>Number tags</legend>
		<div class="content flex align-center justify-space-around buttons">
		<div class="tag pill">15</div>
		<div class="tag pill primary">5</div>
		<div class="tag pill success">100+</div>
		<div class="tag pill warning">45</div>
		<div class="tag pill danger">0</div>
		<div class="tag pill outline">8</div>
		</div>
	</fieldset>
	</section>
	<section>
	<h2><span class="number">8.</span><span class="text">Progress bars</span></h2>
	<fieldset>
		<legend>Normal</legend>
		<div class="content buttons">
		<div class="progressbar">
			<div class="progress" style="width: 15%;"></div>
		</div><br />
		<div class="progressbar success">
			<div class="progress" style="width: 40%;">40% complete...</div>
		</div><br />
		<div class="progressbar warning">
			<div class="progress" style="width: 60%;">60%</div>
		</div><br />
		<div class="progressbar danger">
			<div class="progress" style="width: 70%;"></div>
		</div>
		</div>
	</fieldset>
	<fieldset>
		<legend>Stripped</legend>
		<div class="content buttons">
		<div class="progressbar stripped success">
			<div class="progress" style="width: 40%;">40% complete...</div>
		</div><br />
		<div class="progressbar stripped danger">
			<div class="progress" style="width: 70%;"></div>
		</div>
		</div>
	</fieldset>
	<fieldset>
		<legend>Animated</legend>
		<div class="content buttons">
		<div class="progressbar stripped animate success">
			<div class="progress" style="width: 80%;">80% complete...</div>
		</div><br />
		<div class="progressbar stripped animate warning">
			<div class="progress" style="width: 34%;"></div>
		</div>
		</div>
	</fieldset>
	<fieldset>
		<legend>Small</legend>
		<div class="content buttons">
		<div class="progressbar small">
			<div class="progress" style="width: 15%;"></div>
		</div><br />
		<div class="progressbar small success stripped">
			<div class="progress" style="width: 40%;">40% complete...</div>
		</div><br />
		<div class="progressbar small warning stripped animate">
			<div class="progress" style="width: 60%;">60%</div>
		</div>
		</div>
	</fieldset>
	<fieldset>
		<legend>Large</legend>
		<div class="content buttons">
		<div class="progressbar large">
			<div class="progress" style="width: 15%;"></div>
		</div><br />
		<div class="progressbar large success stripped">
			<div class="progress" style="width: 40%;">40% complete...</div>
		</div><br />
		<div class="progressbar large warning stripped animate">
			<div class="progress" style="width: 60%;">60%</div>
		</div>
		</div>
	</fieldset>
	</section>
	<section>
	<h2><span class="number">9.</span><span class="text">Panels & Cards</span></h2>
	<fieldset>
		<legend>Normal Panels</legend>
		<div class="content flex align-start justify-space-around panels">
		<div class="panel">
			<div class="header">Panel normal</div>
			<div class="body">
			<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur dicta cumque assumenda culpa maiores omnis totam obcaecati voluptas eligendi sapiente enim debitis, illo dolore facilis, in, nihil perspiciatis, et perferendis.</p>
			</div>
		</div>
		<div class="panel primary">
			<div class="ribbon right red"> <span>Primary</span></div>
			<div class="header">Panel primary</div>
			<div class="body">
			<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur dicta cumque assumenda culpa maiores omnis totam obcaecati voluptas eligendi sapiente enim debitis, illo dolore facilis, in, nihil perspiciatis, et perferendis.</p>
			</div>
		</div>
		<div class="panel success" style="height: 332px;">
			<div class="header">Panel success with list</div>
			<div class="body">
			<div class="list">
				<div class="item"><img class="avatar" src="https://s3.amazonaws.com/uifaces/faces/twitter/kolage/73.jpg" />
				<div class="body"><strong>Message title <small class="text-muted">John Doe</small></strong>
					<p class="text-justify">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Facilis eligendi mollitia ratione fugiat earum qui sit vero nisi pariatur eaque quasi reprehenderit possimus consequatur commodi cum quod, amet sed cupiditate?</p>
				</div>
				<div class="footer text-right"><small class="text-muted">1 min ago</small></div>
				</div>
				<div class="item"><img class="avatar" src="https://s3.amazonaws.com/uifaces/faces/twitter/kolage/73.jpg" />
				<div class="body"><strong>Message title <small class="text-muted">John Doe</small></strong>
					<p class="text-justify">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Facilis eligendi mollitia ratione fugiat earum qui sit vero nisi pariatur eaque quasi reprehenderit possimus consequatur commodi cum quod, amet sed cupiditate? Lorem ipsum dolor sit amet, consectetur adipisicing elit. Eum perferendis sapiente non atque qui quis pariatur impedit ea cupiditate culpa repellat voluptate, ipsam id illo incidunt nam commodi optio? Quasi.</p>
				</div>
				<div class="footer text-right"><small class="text-muted">3 min ago</small></div>
				</div>
				<div class="item"><img class="avatar" src="https://s3.amazonaws.com/uifaces/faces/twitter/kolage/73.jpg" />
				<div class="body"><strong>Message title <small class="text-muted">John Doe</small></strong>
					<p class="text-justify">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Facilis eligendi mollitia ratione fugiat earum qui sit vero nisi.</p>
				</div>
				<div class="footer text-right"><small class="text-muted">15 min ago</small></div>
				</div>
				<div class="item"><img class="avatar" src="https://s3.amazonaws.com/uifaces/faces/twitter/kolage/73.jpg" />
				<div class="body"><strong>Message title <small class="text-muted">John Doe</small></strong>
					<p class="text-justify">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Facilis eligendi mollitia ratione fugiat earum qui sit vero nisi pariatur eaque quasi reprehenderit possimus consequatur commodi cum quod, amet sed cupiditate?</p>
				</div>
				<div class="footer text-right"><small class="text-muted">3 hours ago</small></div>
				</div>
				<div class="item"><img class="avatar" src="https://s3.amazonaws.com/uifaces/faces/twitter/kolage/73.jpg" />
				<div class="body"><strong>Message title <small class="text-muted">John Doe</small></strong>
					<p class="text-justify">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Facilis eligendi mollitia ratione fugiat earum qui sit vero nisi pariatur eaque quasi reprehenderit possimus consequatur commodi cum quod, amet sed cupiditate? Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nemo officia, nulla ad quae. Possimus, necessitatibus excepturi ad vel aspernatur ipsam molestiae. Blanditiis assumenda, doloribus tenetur inventore, earum fugiat! Ducimus, recusandae.</p>
				</div>
				<div class="footer text-right"><small class="text-muted">1 day ago</small></div>
				</div>
			</div>
			</div>
		</div>
		</div>
		<div class="content flex align-start justify-space-around panels">
		<div class="panel warning" style="max-height: 280px; max-width: 600px;">
			<div class="header">Panel warning with scroll</div>
			<div class="body">
			<p>Duis ex nulla eu ex quis consectetur amet voluptate qui ipsum aliqua nisi commodo cupidatat. Reprehenderit aliqua sint magna ad eiusmod magna non esse. Ex tempor ex duis dolore commodo labore aliquip ad dolor nulla est. Ex eiusmod labore deserunt velit ad consequat elit. Quis elit cupidatat culpa pariatur excepteur. Elit nulla nisi ut nulla cupidatat ipsum officia sint consectetur in laboris.</p>
			<p>Voluptate anim in et esse. Voluptate ad est irure eiusmod sit enim pariatur adipisicing. Dolore officia nulla reprehenderit ipsum do aliquip incididunt eiusmod cupidatat exercitation consectetur incididunt.</p>
			</div>
			<div class="footer">Panel footer</div>
		</div>
		<div class="panel danger">
			<div class="header">Panel danger</div>
			<div class="body">
			<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur dicta cumque.</p>
			</div>
			<div class="footer">Panel footer</div>
		</div>
		<div class="panel outline">
			<div class="header">Panel outline</div>
			<div class="body">
			<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur dicta cumque assumenda culpa maiores omnis totam obcaecati voluptas eligendi sapiente enim debitis, illo dolore facilis, in, nihil perspiciatis, et perferendis.</p>
			</div>
		</div>
		</div>
	</fieldset>
	<fieldset>
		<legend>Normal cards</legend>
		<div class="content flex align-start justify-space-around panels">
		<div class="card">
			<div class="block">
			<div class="title">Simple Card</div>
			<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur dicta cumque assumenda culpa maiores omnis totam obcaecati voluptas eligendi sapiente enim debitis, illo dolore facilis, in, nihil perspiciatis, et perferendis.</p>
			</div>
			<div class="block"><small class="text-muted">Last updated 5 mins ago</small></div>
		</div>
		<div class="card">
			<div class="ribbon right blue"> <span>-20%</span></div><img class="img" src="http://lorempixel.com/350/150/city" />
			<div class="block">
			<div class="title">Card with image</div>
			<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur dicta cumque assumenda culpa maiores omnis totam obcaecati voluptas eligendi sapiente enim debitis, illo dolore facilis, in, nihil perspiciatis, et perferendis.</p>
			</div>
			<div class="block">
			<button class="button success">Checkout</button>
			</div>
		</div>
		<div class="card">
			<div class="ribbon left primary"> <span>Brand new</span></div><img class="img" src="http://placehold.it/350x150" />
			<div class="block">
			<div class="title">Card Title wih ribbon</div>
			<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur dicta cumque assumenda culpa maiores omnis totam obcaecati voluptas eligendi sapiente enim debitis, illo dolore facilis, in, nihil perspiciatis, et perferendis.</p>
			</div>
			<div class="block buttons text-right">
			<button class="button danger">DELETE</button>
			<button class="button outline">Close</button>
			</div>
		</div>
		</div>
	</fieldset>
	<fieldset>
		<legend>Cards in columns</legend>
		<div class="content card-columns">
		<div class="card">
			<div class="block">
			<div class="title">Small Card 1</div>
			<p>
				Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quos repellendus architecto molestiae iure enim labore dolores similique, quia consequatur culpa, at cumque ad tenetur nemo vitae dolorem ipsum repellat optio! <a class="link" href="https://twitter.com/Icebobcsi">@Icebobcsi</a></p>
			</div>
			<div class="block"><small class="text-muted">08:45 PM - 14 Jun 2016</small></div>
		</div>
		<div class="card">
			<div class="block">
			<div class="title">Small Card 2</div>
			<p>
				Lorem ipsum dolor sit amet, consectetur adipisicing elit. Porro voluptate, neque voluptatibus mollitia aliquid, harum in laborum non amet cupiditate ea nisi necessitatibus quis! Earum architecto corporis molestiae nihil molestias? Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ut, voluptate. Eaque nisi alias consectetur ipsum eveniet qui esse repellat voluptas mollitia, obcaecati corporis a modi officia, architecto commodi eius sint! <a class="link" href="https://twitter.com/Icebobcsi">@Icebobcsi</a></p>
			</div>
			<div class="block"><small class="text-muted">08:45 PM - 14 Jun 2016</small></div>
		</div>
		<div class="card">
			<div class="block">
			<div class="title">Small Card 3</div>
			<p>
				Lorem ipsum dolor sit amet, consectetur adipisicing elit. <a class="link" href="https://twitter.com/Icebobcsi">@Icebobcsi</a></p>
			</div>
			<div class="block"><small class="text-muted">08:45 PM - 14 Jun 2016</small></div>
		</div>
		<div class="card"><img class="img" src="http://lorempixel.com/600/300/city" />
			<div class="block">
			<div class="title">Small Card 4</div>
			<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur dicta cumque assumenda culpa</p>
			</div>
			<div class="block"><small class="text-muted">08:45 PM - 14 Jun 2016</small></div>
		</div>
		<div class="card">
			<div class="block">
			<div class="title">Small Card 5</div>
			<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur dicta cumque assumenda culpa <a class="link" href="https://twitter.com/Icebobcsi">@Icebobcsi</a></p>
			</div>
			<div class="block"><small class="text-muted">08:45 PM - 14 Jun 2016</small></div>
			<div class="block">
			<button class="button primary">Checkout</button>
			</div>
		</div>
		<div class="card">
			<div class="block">
			<div class="title">Small Card 6</div>
			<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur dicta cumque assumenda culpa </p>
			<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Incidunt voluptatum quos autem magnam doloribus sunt. Atque quas accusamus repellat, odio dolore sapiente voluptatibus nemo numquam eum odit tempore, similique natus! <a class="link" href="https://twitter.com/Icebobcsi">@Icebobcsi</a></p>
			</div>
			<div class="block"><small class="text-muted">08:45 PM - 14 Jun 2016</small></div>
		</div>
		<div class="card">
			<div class="block">
			<div class="title">Small Card 7</div>
			<p>
				Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur dicta cumque assumenda culpa <a class="link" href="https://twitter.com/Icebobcsi">@Icebobcsi</a></p>
			</div>
			<div class="block"><small class="text-muted">08:45 PM - 14 Jun 2016</small></div>
		</div>
		<div class="card">
			<div class="block">
			<div class="title">Small Card 8</div>
			<p>
				Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur dicta cumque assumenda culpa <a class="link" href="https://twitter.com/Icebobcsi">@Icebobcsi</a></p>
			</div>
			<div class="block"><small class="text-muted">08:45 PM - 14 Jun 2016</small></div>
		</div>
		</div>
	</fieldset>
	</section>
	<section>
	<h2><span class="number">10.</span><span class="text">Media</span></h2>
	<fieldset>
		<legend>Normal media</legend>
		<div class="content list">
		<div class="media">
			<div class="media-left"><img class="avatar" src="https://s3.amazonaws.com/uifaces/faces/twitter/kolage/73.jpg" /></div>
			<div class="media-content"><div class="title">John Doe<small class="text-muted">@johndoe - 31m ago</small></div>
			<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur dicta cumque assumenda culpa maiores omnis totam obcaecati voluptas eligendi sapiente enim debitis, illo dolore facilis, in, nihil perspiciatis, et perferendis. </p>
			<p>Elit ex id excepteur aliqua sint et culpa nisi laborum. Cupidatat anim aliqua nisi tempor nisi sint mollit non elit laboris consequat. Ut sint mollit voluptate quis sunt magna voluptate incididunt amet voluptate aute occaecat nulla. Nostrud ut eiusmod duis consequat sunt proident in aute esse adipisicing cupidatat commodo consequat dolor. Irure minim consectetur est duis nulla aliqua fugiat culpa proident cupidatat elit magna. Dolor esse magna pariatur sint adipisicing cupidatat veniam excepteur aliquip. Qui fugiat non eiusmod do sunt excepteur enim aliquip reprehenderit ullamco.<a class="link" href="#"> Read more...</a></p>
			<div class="functions"><a href="#"><i class="fa fa-reply"></i></a><a href="#"><i class="fa fa-heart"></i></a><a href="#"><i class="fa fa-trash"></i></a></div>
			</div>
			<div class="media-right"><a class="close" href="#" title="Close"></a></div>
		</div>
		<div class="media primary">
			<div class="media-left"><img class="avatar" src="https://s3.amazonaws.com/uifaces/faces/twitter/kolage/73.jpg" /></div>
			<div class="media-content"><div class="title">John Doe<small class="text-muted">@johndoe - 31m ago</small></div>
			<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur dicta cumque assumenda culpa maiores omnis totam obcaecati voluptas eligendi sapiente enim debitis, illo dolore facilis, in, nihil perspiciatis, et perferendis. <a class="link" href="#">Read more...</a></p>
			<div class="functions"><a href="#"><i class="fa fa-reply"></i></a><a href="#"><i class="fa fa-heart"></i></a><a href="#"><i class="fa fa-trash"></i></a></div>
			</div>
			<div class="media-right"><a class="close" href="#" title="Close"></a></div>
		</div>
		<div class="media success">
			<div class="media-left"><img class="avatar" src="https://s3.amazonaws.com/uifaces/faces/twitter/kolage/73.jpg" /></div>
			<div class="media-content"><div class="title">John Doe<small class="text-muted">@johndoe - 31m ago</small></div>
			<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur dicta cumque assumenda culpa maiores omnis totam obcaecati voluptas eligendi sapiente enim debitis, illo dolore facilis, in, nihil perspiciatis, et perferendis. <a class="link" href="#">Read more...</a></p>
			<div class="functions"><a href="#"><i class="fa fa-reply"></i></a><a href="#"><i class="fa fa-heart"></i></a><a href="#"><i class="fa fa-trash"></i></a></div>
			</div>
			<div class="media-right"><a class="close" href="#" title="Close"></a></div>
		</div>
		<div class="media warning">
			<div class="media-left"><img class="avatar" src="https://s3.amazonaws.com/uifaces/faces/twitter/kolage/73.jpg" /></div>
			<div class="media-content"><div class="title">John Doe<small class="text-muted">@johndoe - 31m ago</small></div>
			<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur dicta cumque assumenda culpa maiores omnis totam obcaecati voluptas eligendi sapiente enim debitis, illo dolore facilis, in, nihil perspiciatis, et perferendis. <a class="link" href="#">Read more...</a></p>
			<div class="functions"><a href="#"><i class="fa fa-reply"></i></a><a href="#"><i class="fa fa-heart"></i></a><a href="#"><i class="fa fa-trash"></i></a></div>
			</div>
			<div class="media-right"><a class="close" href="#" title="Close"></a></div>
		</div>
		<div class="media danger">
			<div class="media-left"><img class="avatar" src="https://s3.amazonaws.com/uifaces/faces/twitter/kolage/73.jpg" /></div>
			<div class="media-content"><div class="title">John Doe<small class="text-muted">@johndoe - 31m ago</small></div>
			<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur dicta cumque assumenda culpa maiores omnis totam obcaecati voluptas eligendi sapiente enim debitis, illo dolore facilis, in, nihil perspiciatis, et perferendis. <a class="link" href="#">Read more...</a></p>
			<div class="functions"><a href="#"><i class="fa fa-reply"></i></a><a href="#"><i class="fa fa-heart"></i></a><a href="#"><i class="fa fa-trash"></i></a></div>
			</div>
			<div class="media-right"><a class="close" href="#" title="Close"></a></div>
		</div>
		<div class="media outline">
			<div class="media-left"><img class="avatar" src="https://s3.amazonaws.com/uifaces/faces/twitter/kolage/73.jpg" /></div>
			<div class="media-content"><div class="title">John Doe<small class="text-muted">@johndoe - 31m ago</small></div>
			<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequuntur dicta cumque assumenda culpa maiores omnis totam obcaecati voluptas eligendi sapiente enim debitis, illo dolore facilis, in, nihil perspiciatis, et perferendis. <a class="link" href="#">Read more...</a></p>
			<div class="buttons">
				<div class="button"><i class="icon fa fa-mail-reply"></i>Reply</div>
				<div class="button warning"><i class="icon fa fa-ban"></i>Spam</div>
			</div>
			</div>
			<div class="media-right"><a class="close" href="#" title="Close"></a></div>
		</div>
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

.list {
  > * {
    margin-bottom: 20px;
  }
}

.panels {
  align-items: flex-start;
  .panel,
  .card {
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

    $colors-light: $color1-light, $color2-light, $color3-light, $color4-light,
      $color5-light;
    $colors-dark: $color1-dark, $color2-dark, $color3-dark, $color4-dark,
      $color5-dark;

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
