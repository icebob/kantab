<template>
	<section>
		<section-header number="10" caption="Media" />
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
					<div class="button icon"><i class="fa fa-mail-reply"></i>Reply</div>
					<div class="button icon warning"><i class="fa fa-ban"></i>Spam</div>
				</div>
				</div>
				<div class="media-right"><a class="close" href="#" title="Close"></a></div>
			</div>
			</div>
		</fieldset>
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
.list {
  > * {
    margin-bottom: 20px;
  }
}
</style>
