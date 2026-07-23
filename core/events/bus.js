const listeners = new Map();

module.exports = {
	on(event, handler) {
		if (!listeners.has(event)) listeners.set(event, []);
		listeners.get(event).push(handler);
	},
	emit(event, payload) {
		(listeners.get(event) || []).forEach((h) => {
			try { h(payload); } catch (err) {
				require("../logger").error("Listener falló en " + event + ":", err.message);
			}
		});
		(listeners.get("*") || []).forEach((h) => {
			try { h(event, payload); } catch (e) { /* noop */ }
		});
	},
	clear() { listeners.clear(); },
};
