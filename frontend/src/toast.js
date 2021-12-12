import iziToast from "izitoast";
import "izitoast/dist/css/iziToast.css";

iziToast.settings({
	theme: "light",
	position: "bottomRight",
	animateInside: false,
	transitionIn: "fadeInUp"
	//timeout: 10000,
});

export default iziToast;
