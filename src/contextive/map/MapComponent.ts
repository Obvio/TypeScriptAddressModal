import {Address} from "../address/Address";

declare var google: any;

export class MapComponent {

    private map:any;
    private mapDiv:HTMLElement;
    private mapElementId:string = 'ctx-map';
    private geolocation:any = {lat: 37.7749, lng: -122.4194};
    private maxZoom:number = 12; //google maps api says it looks better ;)
    private autocomplete:any;
    private autocompleteElementId:string = 'autocomplete';
    private leadId:string;
    private bounds:any;
    private markers:any[] = [];
    private infoWindow:any;
    private isRemovingMarker:boolean = false;

    constructor(leadId:string) {
        this.leadId = leadId;
        this.bounds = new google.maps.LatLngBounds();
        this.infoWindow = new google.maps.InfoWindow();
    }

    public init():void {
        this.setupMap();
        this.setupAutocomplete();
        window.addEventListener('addresses:fetched', this.addMarkers);
        window.addEventListener('address:delete', this.removeMarker);
        window.addEventListener('address:addedToModel', this.addSingleMarker);
        window.addEventListener('address:editApproved', this.updateMarker);
        window.addEventListener('resize', this.fitMapToMarkers);
        window.addEventListener('address:mousemove', this.animateMarker );
    }

    public destroy():void{
        window.removeEventListener('addresses:fetched', this.addMarkers);
        window.removeEventListener('address:delete', this.removeMarker);
        window.removeEventListener('address:addedToModel', this.addSingleMarker);
        window.removeEventListener('address:editApproved', this.updateMarker);
        window.removeEventListener('resize', this.fitMapToMarkers);
        window.removeEventListener('address:mousemove', this.animateMarker );
    }

    private setupMap():void {
        this.mapDiv = document.getElementById(this.mapElementId);
        this.map = new google.maps.Map(this.mapDiv, {
            center: this.geolocation,
            zoom: this.maxZoom,
            mapTypeControl: false,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
    }

    private setupAutocomplete():void {
        this.autocomplete = new google.maps.places.Autocomplete(
            document.getElementById(this.autocompleteElementId),
            {types: ['geocode']}
        );
        this.autocomplete.addListener('place_changed', this.fillInAddress);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    var circle = new google.maps.Circle({
                        center: {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        },
                        radius: position.coords.accuracy
                    });
                    this.autocomplete.setBounds(circle.getBounds());
                }
            );
        }
    }

    private fillInAddress = (event:CustomEvent):void => {
        let data:any = this.autocomplete.getPlace();
        data.addressType = $('#cio-address-type').val();
        if(data !== 'undefined'){
            var newPlaceEvent:CustomEvent = new CustomEvent('address:added', {detail: data});
            window.dispatchEvent(newPlaceEvent);
            (<HTMLInputElement>document.getElementById(this.autocompleteElementId)).value = '';
        } else {
            //no-op
            console.warn('skipping');
        }
    }

    private addMarkers = (event:CustomEvent):void => {
        let addresses:Address[] = event.detail;
         for(let i = 0; i < addresses.length; i++){
             let pos:any = addresses[i].myGeoCode.geometry.location;
             let marker = new google.maps.Marker({
                 position: pos,
                 map: this.map,
                 markerId : addresses[i].myGeoCode.place_id,
                 animation: google.maps.Animation.DROP,
                 title: addresses[i].addressType
             });
             marker.addListener('click', (event:Event):void => {
                 this.infoWindow.setContent(
                     this.generateMarkerInfoWindowHtml(
                         addresses[i].addressType,
                         addresses[i].getGeoCodedFormattedAddressString(),
                         addresses[i].myGeoCode.place_id
                     )
                 );
                 this.infoWindow.open(this.map, marker);
             });
             this.markers.push(marker);
             this.bounds.extend(pos);
         }
         this.fitMapToMarkers();
    }

    private addSingleMarker = (event:CustomEvent):void => {
        let address:Address = <Address>event.detail;
        let pos:any = address.myGeoCode.geometry.location;
        let marker = new google.maps.Marker({
            position: pos,
            map: this.map,
            markerId : address.myGeoCode.place_id,
            animation: google.maps.Animation.DROP,
            title: address.addressType
        });
        marker.addListener('click', (event:Event):void => {
            this.infoWindow.setContent(
                this.generateMarkerInfoWindowHtml(
                    address.addressType,
                    address.getGeoCodedFormattedAddressString(),
                    address.myGeoCode.place_id
                ));
            this.infoWindow.open(this.map, marker);
        });
        this.markers.push(marker);
        this.bounds.extend(pos);
        this.fitMapToMarkers();
    }

    private  generateMarkerInfoWindowHtml(addressType:string, addressText:string, id:string):string{
        let dataId:string = `data-id="${id}"`;
        let dataContext:string = `data-context=".cio-info-window"`;
        let copyAction:string = `<a href="#" class="cio-action" data-action="copy" ${dataContext} data-clipboard-text="${addressText}">Copy</a>`;
        let actionButtons:string = `<div ${dataId} class="cio-info-window-actions">${copyAction}</div>`;
        return `<div class="cio-info-window"><strong>${addressType}</strong><div>${addressText}</div>${actionButtons}<div>`;
    }

    private removeMarker = (event:CustomEvent):void =>{
        this.bounds = new google.maps.LatLngBounds();
        for(let i:number = 0; i < this.markers.length; i++) {
            if (this.markers[i].markerId === event.detail.place.place_id){
                this.markers[i].setMap(null);
                this.markers.splice(i, 1);
            } else {
                this.bounds.extend(this.markers[i].position);
            }
        }
        this.fitMapToMarkers();
    }

    private updateMarker = (event:CustomEvent):void => {
        let oldPlaceId:string = event.detail.idBeforeEdit;
        this.bounds = new google.maps.LatLngBounds();
        for(let i:number = 0; i < this.markers.length; i++) {
            if (this.markers[i].markerId === oldPlaceId){
                //create and add a new marker for the edited location
                let address:Address = <Address>event.detail.address;
                let pos:any = address.myGeoCode.geometry.location;
                let marker = new google.maps.Marker({
                    position: pos,
                    map: this.map,
                    markerId : address.myGeoCode.place_id,
                    animation: google.maps.Animation.DROP
                });
                //remove the old marker
                this.markers[i].setMap(null);
                this.markers.splice(i, 1, marker);
            }
            this.bounds.extend(this.markers[i].position);
        }
        this.fitMapToMarkers();
    }

    private animateMarker = (event:CustomEvent) => {
        for(let i:number = 0; i < this.markers.length; i++) {
            if (this.markers[i].markerId === event.detail.id) {
                switch (event.detail.type){
                    case 'mouseenter':
                        this.markers[i].setAnimation(google.maps.Animation.BOUNCE);
                        break;
                    case 'mouseleave':
                        this.markers[i].setAnimation(null);
                        break;
                }
            }
        }
    }

    private fitMapToMarkers = (event:Event = null) =>{
        if(this.bounds.isEmpty() === false) {
            this.map.fitBounds(this.bounds);
            if (this.map.getZoom() > this.maxZoom) {
                this.map.setZoom(this.maxZoom);
            }
        }
    }
}