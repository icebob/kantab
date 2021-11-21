module.exports = function ({ broker, contexts }) {
	return {
		registerAccount(data) {
			return broker.call("v1.accounts.register", data);
		},

		login(email, password) {
			return broker.call("v1.accounts.login", { email, password });
		},

		boardCreate(user, data) {
			return broker.call("v1.boards.create", data, contexts[user]);
		},

		boards(user, params = {}) {
			return broker.call("v1.boards.list", params, contexts[user]);
		},

		boardsAll(user, params = {}) {
			return broker.call("v1.boards.find", params, contexts[user]);
		},

		boardsCount(user, params = {}) {
			return broker.call("v1.boards.count", params, contexts[user]);
		},

		boardByID(user, params = {}) {
			return broker.call("v1.boards.get", params, contexts[user]);
		},

		boardResolve(user, params = {}) {
			return broker.call("v1.boards.resolve", params, contexts[user]);
		},

		boardUpdate(user, params = {}) {
			return broker.call("v1.boards.update", params, contexts[user]);
		},

		boardAddMembers(user, params) {
			return broker.call("v1.boards.addMembers", params, contexts[user]);
		},

		boardRemoveMembers(user, params) {
			return broker.call("v1.boards.removeMembers", params, contexts[user]);
		},

		boardTransferOwnership(user, params) {
			return broker.call("v1.boards.transferOwnership", params, contexts[user]);
		},

		boardArchive(user, id) {
			return broker.call("v1.boards.archive", { id }, contexts[user]);
		},

		boardUnarchive(user, id) {
			return broker.call("v1.boards.unarchive", { id }, contexts[user]);
		},

		boardRemove(user, params = {}) {
			return broker.call("v1.boards.remove", params, contexts[user]);
		}
	};
};
