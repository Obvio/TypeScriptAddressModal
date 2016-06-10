export class MapComponent {
    constructor(leadId) {
        this.mapElementId = 'ctx-map';
        this.geolocation = { lat: 37.7749, lng: -122.4194 };
        this.maxZoom = 12; //google maps api says it looks better ;)
        this.autocompleteElementId = 'autocomplete';
        this.markers = [];
        this.isRemovingMarker = false;
        this.fillInAddress = (event) => {
            let data = this.autocomplete.getPlace();
            data.addressType = $('#cio-address-type').val();
            if (data !== 'undefined') {
                var newPlaceEvent = new CustomEvent('address:added', { detail: data });
                window.dispatchEvent(newPlaceEvent);
                document.getElementById(this.autocompleteElementId).value = '';
            }
            else {
                //no-op
                console.warn('skipping');
            }
        };
        this.addMarkers = (event) => {
            let addresses = event.detail;
            for (let i = 0; i < addresses.length; i++) {
                let pos = addresses[i].myGeoCode.geometry.location;
                let marker = new google.maps.Marker({
                    position: pos,
                    map: this.map,
                    markerId: addresses[i].myGeoCode.place_id,
                    animation: google.maps.Animation.DROP,
                    title: addresses[i].addressType
                });
                marker.addListener('click', (event) => {
                    this.infoWindow.setContent(this.generateMarkerInfoWindowHtml(addresses[i].addressType, addresses[i].getGeoCodedFormattedAddressString(), addresses[i].myGeoCode.place_id));
                    this.infoWindow.open(this.map, marker);
                });
                this.markers.push(marker);
                this.bounds.extend(pos);
            }
            this.fitMapToMarkers();
        };
        this.addSingleMarker = (event) => {
            let address = event.detail;
            let pos = address.myGeoCode.geometry.location;
            let marker = new google.maps.Marker({
                position: pos,
                map: this.map,
                markerId: address.myGeoCode.place_id,
                animation: google.maps.Animation.DROP,
                title: address.addressType
            });
            marker.addListener('click', (event) => {
                this.infoWindow.setContent(this.generateMarkerInfoWindowHtml(address.addressType, address.getGeoCodedFormattedAddressString(), address.myGeoCode.place_id));
                this.infoWindow.open(this.map, marker);
            });
            this.markers.push(marker);
            this.bounds.extend(pos);
            this.fitMapToMarkers();
        };
        this.removeMarker = (event) => {
            this.bounds = new google.maps.LatLngBounds();
            for (let i = 0; i < this.markers.length; i++) {
                if (this.markers[i].markerId === event.detail.place.place_id) {
                    this.markers[i].setMap(null);
                    this.markers.splice(i, 1);
                }
                else {
                    this.bounds.extend(this.markers[i].position);
                }
            }
            this.fitMapToMarkers();
        };
        this.updateMarker = (event) => {
            let oldPlaceId = event.detail.idBeforeEdit;
            this.bounds = new google.maps.LatLngBounds();
            for (let i = 0; i < this.markers.length; i++) {
                if (this.markers[i].markerId === oldPlaceId) {
                    //create and add a new marker for the edited location
                    let address = event.detail.address;
                    let pos = address.myGeoCode.geometry.location;
                    let marker = new google.maps.Marker({
                        position: pos,
                        map: this.map,
                        markerId: address.myGeoCode.place_id,
                        animation: google.maps.Animation.DROP
                    });
                    //remove the old marker
                    this.markers[i].setMap(null);
                    this.markers.splice(i, 1, marker);
                }
                this.bounds.extend(this.markers[i].position);
            }
            this.fitMapToMarkers();
        };
        this.animateMarker = (event) => {
            for (let i = 0; i < this.markers.length; i++) {
                if (this.markers[i].markerId === event.detail.id) {
                    switch (event.detail.type) {
                        case 'mouseenter':
                            this.markers[i].setAnimation(google.maps.Animation.BOUNCE);
                            break;
                        case 'mouseleave':
                            this.markers[i].setAnimation(null);
                            break;
                    }
                }
            }
        };
        this.fitMapToMarkers = (event = null) => {
            if (this.bounds.isEmpty() === false) {
                this.map.fitBounds(this.bounds);
                if (this.map.getZoom() > this.maxZoom) {
                    this.map.setZoom(this.maxZoom);
                }
            }
        };
        this.leadId = leadId;
        this.bounds = new google.maps.LatLngBounds();
        this.infoWindow = new google.maps.InfoWindow();
    }
    init() {
        this.setupMap();
        this.setupAutocomplete();
        window.addEventListener('addresses:fetched', this.addMarkers);
        window.addEventListener('address:delete', this.removeMarker);
        window.addEventListener('address:addedToModel', this.addSingleMarker);
        window.addEventListener('address:editApproved', this.updateMarker);
        window.addEventListener('resize', this.fitMapToMarkers);
        window.addEventListener('address:mousemove', this.animateMarker);
    }
    destroy() {
        window.removeEventListener('addresses:fetched', this.addMarkers);
        window.removeEventListener('address:delete', this.removeMarker);
        window.removeEventListener('address:addedToModel', this.addSingleMarker);
        window.removeEventListener('address:editApproved', this.updateMarker);
        window.removeEventListener('resize', this.fitMapToMarkers);
        window.removeEventListener('address:mousemove', this.animateMarker);
    }
    setupMap() {
        this.mapDiv = document.getElementById(this.mapElementId);
        this.map = new google.maps.Map(this.mapDiv, {
            center: this.geolocation,
            zoom: this.maxZoom,
            mapTypeControl: false,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
    }
    setupAutocomplete() {
        this.autocomplete = new google.maps.places.Autocomplete(document.getElementById(this.autocompleteElementId), { types: ['geocode'] });
        this.autocomplete.addListener('place_changed', this.fillInAddress);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                var circle = new google.maps.Circle({
                    center: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    },
                    radius: position.coords.accuracy
                });
                this.autocomplete.setBounds(circle.getBounds());
            });
        }
    }
    generateMarkerInfoWindowHtml(addressType, addressText, id) {
        let dataId = `data-id="${id}"`;
        let dataContext = `data-context=".cio-info-window"`;
        let copyAction = `<a href="#" class="cio-action" data-action="copy" ${dataContext} data-clipboard-text="${addressText}">Copy</a>`;
        let actionButtons = `<div ${dataId} class="cio-info-window-actions">${copyAction}</div>`;
        return `<div class="cio-info-window"><strong>${addressType}</strong><div>${addressText}</div>${actionButtons}<div>`;
    }
}
