
exports.for = function (API) {

	var exports = {};

	exports.resolve = function (resolver, config, previousResolvedConfig) {
		return resolver({}).then(function (resolvedConfig) {

			function installation (installationId) {

				API.console.verbose("Provision installation", installationId);

				var installation = resolvedConfig.installations[installationId];

				installation.path = API.PATH.join(API.getTargetPath(), installationId);
			}

			Object.keys(resolvedConfig.installations).forEach(installation);

			return resolvedConfig;
		});
	}

	exports.turn = function (resolvedConfig) {

		function installation (installationId) {

			API.console.verbose("Provision installation", installationId);

			var installation = resolvedConfig.installations[installationId];

			function writeInstallDescriptor () {
				var path = API.PATH.join(installation.path, "package.json");
				API.console.debug("Writing install descriptor to:", path);
				var descriptor = {};
				descriptor.upstream = installation.upstream;
				descriptor.mappings = installation.mappings;
				return API.Q.denodeify(API.FS.outputFile)(path, JSON.stringify(descriptor, null, 4), "utf8");
			}

			function install () {
				return API.Q.denodeify(function (callback) {
					if (installation.install !== true) {
						API.console.debug("Skip install as 'install' config property is set to 'false'!");
						return callback(null);
					}
					API.console.debug("Install installation:", installation.path);
					var args = [];
					if (API.DEBUG) {
						args.push("-vd");
					}
					return API.runCommands([
						// TODO: Use PINF-based binary lookup.
						API.PATH.normalize(require.resolve("smi.cli/lib/smi.js") + "/../../bin/smi") + " install " + args.join(" ")
					], {
						cwd: installation.path
					}, callback);
				})();
			}

			return writeInstallDescriptor().then(function () {
				return install();
			});
		}


		var done = API.Q.resolve();
		Object.keys(resolvedConfig.installations).forEach(function (installationId) {
			done = API.Q.when(done, function () {
				return installation(installationId);
			});
		});
		return API.Q.when(done);
	}

	exports.spin = function (resolvedConfig) {
	}

	return exports;
}
