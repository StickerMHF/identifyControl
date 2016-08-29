/**
 * @author mhf
 * @createTime 2016.7.26
 */

L.Polyline.Identify = L.Draw.Feature.extend({
	initialize : function(map, options, layerid, identifysuccess) {
		this.type = L.Draw.Marker.TYPE;
		L.Draw.Feature.prototype.initialize.call(this, map, options);
		this.options.identifylayerId = layerid;
		this.options.identifysuccess = identifysuccess;
	},
	options : {
		position : 'topright',
		handler : {},
		identifylayerId : -1,
		icon : new L.icon({
			iconUrl : 'img/toolbar/identify.png',
			iconAnchor : [ 8, 8 ],
			iconSize : [ 16, 16 ]
		})
	},
	addHooks : function() {
		L.Draw.Feature.prototype.addHooks.call(this);
		if (this._map) {
			this._tooltip.updateContent({
				text : L.drawLocal.draw.handlers.marker.tooltip.start
			});

			// Same mouseMarker as in Draw.Polyline
			if (!this._mouseMarker) {
				this._mouseMarker = L.marker(this._map.getCenter(), {
					icon : new L.icon({
						iconUrl : 'img/toolbar/identify.png',
						iconAnchor : [ 8, 8 ],
						iconSize : [ 16, 16 ]
					})
				});
			}
			this._markerGroup = new L.LayerGroup();

			this._mouseMarker.on('click', this._onClick, this).addTo(
					this._markerGroup);
			this._markerGroup.addTo(this._map);

			this._map.on('mousemove', this._onMouseMove, this);
		}
	},

	removeHooks : function() {
		if (this._map) {
			if (this._marker) {
				this._marker.off('click', this._onClick, this);
				this._map.off('click', this._onClick, this).off('click',
						this._onTouch, this).removeLayer(this._marker);
				delete this._marker;
			}

			this._mouseMarker.off('click', this._onClick, this);
			this._map.removeLayer(this._mouseMarker);
			delete this._mouseMarker;

			this._map.off('mousemove', this._onMouseMove, this);
		}
	},

	_onMouseMove : function(e) {
		var latlng = e.latlng;

		this._tooltip.updatePosition(latlng);
		this._mouseMarker.setLatLng(latlng);

		if (!this._marker) {
			this._marker = new L.Marker(latlng, {
				icon : this.options.icon,
				zIndexOffset : this.options.zIndexOffset
			});
			// Bind to both marker and map to make sure we get the click event.
			this._marker.on('click', this._onClick, this);
			this._map.on('click', this._onClick, this).addLayer(this._marker);
		} else {
			latlng = this._mouseMarker.getLatLng();
			this._marker.setLatLng(latlng);
		}
	},

	_onClick : function(evt) {
		var latlng = evt.latlng;
		this._markerGroup.clearLayers();
		var marker = new L.Marker(this._marker.getLatLng(), {
			icon : new L.icon({
				iconUrl : 'img/toolbar/identify.png',
				iconAnchor : [ 8, 8 ],
				iconSize : [ 16, 16 ]
			})
		}).addTo(this._markerGroup);
		this._tooltip.dispose();
		var result = this._identifyLayerEvent(latlng);
	},
	// identify查询数据
	_identifyLayerEvent : function(latlng) {
		var idenlayer = this._map._layers[this.options.identifylayerId];
		if (idenlayer != undefined) {
			var layerdefs = idenlayer.getLayerDefs();
			var identify=idenlayer.identify().on(this._map).at(latlng);
			var str="";
			for(var item in idenlayer.getLayers()){
				identify.layerDef(item,layerdefs[item]);
			}
			identify.run(
					function(error, featureCollection, response) {
						this.Globle.identifyControl.options.identifysuccess
								.call(this.options, response);
					});
		}
	}

});
L.Control.IdentifyControl = L.Control.extend({

	statics : {
		TITLE : '点选查询'
	},
	options : {
		position : 'topright',
		handler : {},
	},

	toggle : function() {
		if (this.handler.enabled()) {
			this.handler.disable.call(this.handler);
			this.handler._tooltip.dispose();
			this.handler._markerGroup.clearLayers();
		} else {
			this.handler.enable.call(this.handler);
		}
	},

	onAdd : function(map) {
		var className = 'leaflet-control-draw';

		this._container = L.DomUtil.create('div', 'leaflet-bar1');

		this.handler = new L.Polyline.Identify(map, this.options.handler,
				this.options.identifylayerId, this.options.identifysuccess);

		this.handler.on('enabled', function() {
			L.DomUtil.addClass(this._container, 'enabled');
		}, this);

		this.handler.on('disabled', function() {
			L.DomUtil.removeClass(this._container, 'enabled');
		}, this);

		var link = L.DomUtil.create('a', className + '-identify',
				this._container);
		link.href = '#';
		link.title = L.Control.IdentifyControl.TITLE;

		L.DomEvent.addListener(link, 'click', L.DomEvent.stopPropagation)
				.addListener(link, 'click', L.DomEvent.preventDefault)
				.addListener(link, 'click', this.toggle, this);
		return this._container;
	}
});
L.Control.identifyControl = function(options) {
	return new L.Control.IdentifyControl(options);
};