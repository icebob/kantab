import iziToast from "izitoast";
import "izitoast/dist/css/iziToast.css";

iziToast.settings({
	theme: "light",
	position: "topRight",
	animateInside: false,
	transitionIn: "fadeInDown"
	//timeout: 10000,
});

export default iziToast;
