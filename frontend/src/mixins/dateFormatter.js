import moment from "moment";
export default {
	methods: {
		dateToAgo(timestamp) {
			return moment(timestamp).fromNow();
		},
		dateToLong(timestamp) {
			return moment(timestamp).format("LLL");
		}
	}
};
