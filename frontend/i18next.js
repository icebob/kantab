import i18next from "i18next";
import i18NextLanguageDetector from "i18next-browser-languagedetector";
import i18NextXHR from "i18next-xhr-backend";
import i18NBackendAdapter from "i18next-multiload-backend-adapter";

import moment from "moment";

function install(Vue, callback) {

	i18next
		.use(i18NBackendAdapter)
		.use(i18NextLanguageDetector)
		.init({
			//lng: "en",
			fallbackLng: "en",
			whitelist: ["en", "hu"],
			ns: ["common", "errors"],
			defaultNS: "common",
			load: "languageOnly",
			saveMissing: true,
			saveMissingTo: "all", // "fallback", "current", "all"

			backend: {
				backend: i18NextXHR,
				backendOption: {
					// path where resources get loaded from
					loadPath: "/locales?lng={{lng}}&ns={{ns}}",

					// path to post missing resources
					addPath: "/locales?lng={{lng}}&ns={{ns}}",
				}
			},

			detection: {
				order: ["cookie", "navigator"]
				/*
				// keys or params to lookup language from
				lookupCookie: 'i18next',
				lookupLocalStorage: 'i18nextLng',

				// cache user language on
				caches: ['localStorage', 'cookie']

				// optional expire and domain for set cookie
				cookieMinutes: 10,
				cookieDomain: 'myDomain',
				*/
			}

		}).then(t => {
			Vue.prototype.$lang = i18next.language;
			Vue.prototype.$t = t;

			moment.locale(i18next.language);

			console.log(`I18Next initialized! Language: ${i18next.language}, Date format: ${moment().format("LLL")}`);

			if (callback)
				return callback(i18next, t);
		}).catch(err => {
			console.error("Unable to initialize I18Next", err);
			return err;
		});

	// Register as a filter
	Vue.filter("i18n", i18next.t);

	// Register as a directive
	Vue.directive("i18n", {
		bind: function(el, binding) {
			el.innerHTML = i18next.t(binding.expression);
		}
	});

	Vue.prototype.$i18n = i18next;
	Vue.prototype.$t = i18next.t;
}

export default {
	install
};
