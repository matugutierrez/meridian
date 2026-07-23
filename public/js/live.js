const Live = {
	source: null,

	start() {
		if (this.source || !API.token || typeof EventSource === "undefined") return;
		try {
			this.source = new EventSource("/api/events?token=" + encodeURIComponent(API.token));
			this.source.addEventListener("domain", (msg) => {
				try {
					const e = JSON.parse(msg.data);
					/* Refresco silencioso con antirrebote: varios eventos seguidos = un reload */
					clearTimeout(this._t);
					this._t = setTimeout(() => {
						DB.reload().then(() => App.refresh()).catch(() => {});
					}, 400);
				} catch (err) { /* evento malformado: ignorar */ }
			});
			this.source.onerror = () => {
			};
		} catch (e) { }
	},

	stop() {
		if (this.source) { this.source.close(); this.source = null; }
	},
};
