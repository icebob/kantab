import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(duration);
dayjs.extend(relativeTime);

export default {
	methods: {
		dateToAgo(timestamp) {
			return dayjs(timestamp).fromNow();
		},
		dateToLong(timestamp) {
			return dayjs(timestamp).format("LLL");
		}
	}
};
