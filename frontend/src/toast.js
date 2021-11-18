import VueIziToast from "vue-izitoast";
import "izitoast/dist/css/iziToast.css";
import Vue from "vue";

Vue.use(VueIziToast, {
	theme: "light",
	position: "topRight",
	animateInside: false,
	transitionIn: "fadeInDown"
});
