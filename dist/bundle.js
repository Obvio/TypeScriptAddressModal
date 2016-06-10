(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

class Address {
    constructor(addressData) {
        this.myGeoCode = {};
        this.isPrimary = false;
        this.isBeingEdited = false;
        this.handleEditApproved = event => {
            if (this.idBeforeEdit === event.detail.idBeforeEdit) {
                $(`[data-id=${ this.idBeforeEdit }] .ctx-address-type-label`).text(this.addressType);
                $(`[data-id="${ this.idBeforeEdit }"]`).attr('data-id', this.id);
            }
        };
        this.addressData = addressData;
        this.init();
    }
    init() {
        window.addEventListener('address:editApproved', this.handleEditApproved);
    }
    destroy() {
        window.removeEventListener('address:editApproved', this.handleEditApproved);
    }
    getHtml() {
        let addressString = this.getGeoCodedFormattedAddressString();
        let addressTypeLabel = `<strong class="ctx-address-type-label">${ this.addressType }</strong>`;
        let editableAddress = this.getSplitGeoCodedFormattedAddressForEdit();
        let dataId = `data-id="${ this.id }"`;
        let dataContext = `data-context=".ctx-address-item"`;
        let editAction = `<a href="#" class="ctx-action" data-action="edit" ${ dataId } ${ dataContext }>Edit</a>`;
        let cancelEditAction = `<a href="#" class="ctx-action ctx-hidden-action" data-action="cancel" ${ dataId } ${ dataContext }>Cancel</a>`;
        let approveEditAction = `<a href="#" class="ctx-action ctx-hidden-action" data-action="approve" ${ dataId } ${ dataContext }>OK</a>`;
        let copyAction = `<a href="#" class="ctx-action" data-action="copy" data-clipboard-text="${ addressString }" ${ dataContext }>Copy</a>`;
        let deleteAction = `<a href="#" class="ctx-action" data-action="delete" ${ dataId } ${ dataContext }>Delete</a>`;
        let isChecked = this.isPrimary ? 'checked' : '';
        let primaryRadio = `<label for="radio-${ this.id }">` + `<input type="radio" name="${ this.leadId }" value="${ this.isPrimary }" id="radio-${ this.id }" ${ dataId } ${ isChecked }>Primary</label>`;
        return `<li class="ctx-address-item" ${ dataId }>` + `<div class="ctx-address-title-and-primary">${ addressTypeLabel } ${ primaryRadio }</div>` + `<div class="ctx-address-type-selector">${ this.generateAddressTypeSelect() }</div>` + `<div class="ctx-editable-address-string">${ editableAddress }</div>` + `<div class="ctx-item-actions">${ approveEditAction }${ cancelEditAction }${ editAction }${ copyAction }${ deleteAction }</div></li>`;
    }
    setEditable() {
        this.isBeingEdited = true;
        this.idBeforeEdit = this.id;
        $(`li[data-id=${ this.id }]`).addClass('ctx-address-is-being-edited');
        $(`[data-id=${ this.id }] .ctx-editable-address-string span`).attr('contenteditable', 'true');
        $(`[data-id=${ this.id }] .ctx-editable-address-string span`).on('focus', function (event) {
            let range = document.createRange();
            range.selectNodeContents(event.currentTarget);
            let sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        });
        $(`[data-id=${ this.id }] .ctx-editable-address-string span:first-child`).focus();
        $(`[data-id=${ this.id }] select`).removeAttr('disabled');
        //action buttons
        $('[data-action="approve"], [data-action="cancel"]', `[data-id=${ this.id }]`).removeClass('ctx-hidden-action');
        $('[data-action="edit"]', `[data-id=${ this.id }]`).addClass('ctx-hidden-action');
    }
    cancelEditable(resetAddressString = true) {
        $(`li[data-id=${ this.id }]`).removeClass('ctx-address-is-being-edited');
        $(`[data-id=${ this.id }] .ctx-editable-address-string span`).attr('contenteditable', 'false');
        if (resetAddressString) {
            $(`[data-id=${ this.id }] .ctx-editable-address-string`).find('span').remove();
            $(`[data-id=${ this.id }] .ctx-editable-address-string`).prepend(this.getSplitGeoCodedFormattedAddressForEdit());
        }
        $(`[data-id=${ this.id }] select`).attr('disabled', 'disabled');
        //action buttons
        $('[data-action="approve"], [data-action="cancel"]', `[data-id=${ this.id }]`).addClass('ctx-hidden-action');
        $('[data-action="edit"]', `[data-id=${ this.id }]`).removeClass('ctx-hidden-action');
        this.isBeingEdited = false;
    }
    sendToApproveEdit() {
        this.cancelEditable(false);
        let newAddressString = $(`[data-id=${ this.idBeforeEdit }] .ctx-editable-address-string span`).text();
        let payload = {
            id: this.id,
            idBeforeEdit: this.idBeforeEdit,
            newAddressString: newAddressString,
            address: this,
            newAddressType: $(`[data-id=${ this.id }] select`).val()
        };
        let addressEditEvent = new CustomEvent('address:edit', { detail: payload });
        window.dispatchEvent(addressEditEvent);
    }
    freezeActions() {
        this.isBeingEdited = true;
        this.idBeforeEdit = this.id;
        $(`li[data-id=${ this.id }] .ctx-item-actions`).addClass('ctx-item-actions-disabled');
        $(`li[data-id=${ this.id }] .ctx-item-actions a`).attr('disabled', 'disabled');
        $(`li[data-id=${ this.id }] select`).attr('disabled', 'disabled');
    }
    getGeoCodedFormattedAddressString() {
        return this.myGeoCode.formatted_address;
    }
    getSplitGeoCodedFormattedAddressForEdit() {
        let addressFragments = this.myGeoCode.formatted_address.split(',');
        let editableAddress = '';
        for (let i = 0; i < addressFragments.length; i++) {
            editableAddress += `<span class="ctx-address-fragment" contenteditable="false">${ addressFragments[i].trim() }`;
            if (i < addressFragments.length - 1) {
                editableAddress += ', ';
            }
            editableAddress += `</span>`;
        }
        return editableAddress;
    }
    generateAddressTypeSelect() {
        return `<select name="" data-id="${ this.id }" disabled="disabled" class="ctx-select">` + `<option value="business" ${ this.addressType == 'business' ? 'selected' : '' }>Business</option>` + `<option value="mailing" ${ this.addressType == 'mailing' ? 'selected' : '' }>Mailing</option>` + `<option value="other" ${ this.addressType == 'other' ? 'selected' : '' }>Other</option>` + `</select>`;
    }
    /*
    * Legacy address string
    * */
    getAddressString() {
        return this.addressData.address_1 + ', ' + this.addressData.address_2 + ', ' + this.addressData.city + ' ' + this.addressData.zipcode + ', ' + this.addressData.state + ', ' + this.addressData.country;
    }
}
exports.Address = Address;

},{}],2:[function(require,module,exports){
/// <reference path="../../../typings/tsd.d.ts" />
"use strict";

const DataService_1 = require('../data/DataService');
class AddressList {
    constructor(leadId) {
        this.listElementClass = 'ctx-address-list';
        this.animationTime = 122;
        this.addAdress = event => {
            this.handleZeroEntries();
            var addressesHtml = event.detail.getHtml();
            $(`.${ this.listElementClass }`).append(addressesHtml);
        };
        this.removeAddress = event => {
            this.handleZeroEntries();
            $(`.${ this.listElementClass } li[data-id=${ event.detail.id }]`).remove();
        };
        this.renderAddresses = event => {
            this.handleZeroEntries();
            let addresses = event.detail;
            let addressesHtml = '';
            for (let i = 0; i < addresses.length; i++) {
                addressesHtml += addresses[i].getHtml();
            }
            if (addressesHtml !== '') {
                $(`.${ this.listElementClass }`).append(addressesHtml);
            }
        };
        this.handleClicks = event => {
            let actionableAddress = this.getActionableAddress(event.currentTarget.dataset.id);
            switch (event.currentTarget.dataset.action) {
                case 'edit':
                    actionableAddress.setEditable();
                    break;
                case 'cancel':
                    actionableAddress.cancelEditable(true);
                    break;
                case 'approve':
                    actionableAddress.sendToApproveEdit();
                    break;
                case 'delete':
                    let deleteConfirmation = confirm('This is destructive, are you sure want to delete?');
                    if (deleteConfirmation === true) {
                        actionableAddress.freezeActions();
                        let payload = {
                            id: event.currentTarget.dataset.id,
                            action: event.currentTarget.dataset.action,
                            place: actionableAddress.myGeoCode
                        };
                        let addressDeleteEvent = new CustomEvent('address:delete', { detail: payload });
                        window.dispatchEvent(addressDeleteEvent);
                    }
                    break;
                default:
                    //no-op
                    break;
            }
            event.preventDefault();
        };
        this.handlePrimaryChange = event => {
            let actionableAddress = this.getActionableAddress(event.currentTarget.dataset.id);
            let payload = {
                id: event.currentTarget.dataset.id
            };
            let setPrimaryAddressEvent = new CustomEvent('address:setPrimary', { detail: payload });
            window.dispatchEvent(setPrimaryAddressEvent);
        };
        this.handleMouseOver = event => {
            this.mouseEnterEvent = new CustomEvent('address:mousemove', { detail: { id: $(event.currentTarget).attr('data-id'), type: event.type } });
            window.dispatchEvent(this.mouseEnterEvent);
        };
        this.leadId = leadId;
    }
    init() {
        window.addEventListener('address:addedToModel', this.addAdress);
        window.addEventListener('address:removedFromModel', this.removeAddress);
        window.addEventListener('addresses:fetched', this.renderAddresses);
        $(`.${ this.listElementClass }`).on('mouseenter', 'li', this.handleMouseOver);
        $(`.${ this.listElementClass }`).on('mouseleave', 'li', this.handleMouseOver);
        $(`.${ this.listElementClass }`).on('click', 'a', this.handleClicks);
        $(`.${ this.listElementClass }`).on('change', 'input[type="radio"]', this.handlePrimaryChange);
    }
    destroy() {
        window.removeEventListener('address:addedToModel', this.addAdress);
        window.removeEventListener('address:removedFromModel', this.removeAddress);
        window.removeEventListener('addresses:fetched', this.renderAddresses);
        $(`.${ this.listElementClass }`).off('mouseenter', 'li', this.handleMouseOver);
        $(`.${ this.listElementClass }`).off('mouseleave', 'li', this.handleMouseOver);
        $(`.${ this.listElementClass }`).off('click', 'a', this.handleClicks);
        $(`.${ this.listElementClass }`).off('change', 'input[type="radio"]', this.handlePrimaryChange);
    }
    handleZeroEntries() {
        $(`.ctx-location-indicator`).addClass('hide-indicator');
        if (DataService_1.DataService.getInstance().addresses.length > 0) {
            $(`.${ this.listElementClass } .ctx-modal-0-entries`).slideUp(this.animationTime);
            $(`.${ this.listElementClass } .ctx-modal-0-entries-message`).hide(this.animationTime);
        } else {
            $(`.${ this.listElementClass } .ctx-location-indicator`).addClass('hide-indicator');
            $(`.${ this.listElementClass } .ctx-modal-0-entries`).slideDown(this.animationTime);
            $(`.${ this.listElementClass } .ctx-modal-0-entries-message`).show(this.animationTime);
        }
    }
    getActionableAddress(id) {
        for (let i = 0; i < DataService_1.DataService.getInstance().addresses.length; i++) {
            if (DataService_1.DataService.getInstance().addresses[i].id === id) {
                return DataService_1.DataService.getInstance().addresses[i];
            }
        }
    }
}
exports.AddressList = AddressList;

},{"../data/DataService":3}],3:[function(require,module,exports){
"use strict";

const Address_1 = require("../address/Address");
class DataService {
    constructor() {
        this._addresses = [];
        this.apiEndPoint = 'https://app.io/api/v1/lead';
        this.dispatchAddressesFetchedEvent = () => {
            let addressesFetchedEvent = new CustomEvent('addresses:fetched', { detail: this.addresses });
            window.dispatchEvent(addressesFetchedEvent);
        };
        this.addAddressToModel = event => {
            if (event.detail !== null && event.detail.hasOwnProperty('place_id')) {
                let place = event.detail;
                let newAddressExists = false;
                for (let i = 0; i < this.addresses.length; i++) {
                    if (this.addresses[i].id === place.place_id) {
                        newAddressExists = true;
                    }
                }
                if (newAddressExists === false) {
                    let address = new Address_1.Address(place);
                    address.myGeoCode = place;
                    address.id = place.place_id;
                    address.addressType = place.addressType;
                    this.addresses.push(address);
                    this.updateServer();
                    //
                    let addressAddedToModelEvent = new CustomEvent('address:addedToModel', { detail: address });
                    window.dispatchEvent(addressAddedToModelEvent);
                }
            }
        };
        this.removeAddressFromModel = event => {
            for (let i = 0; i < this.addresses.length; i++) {
                if (this.addresses[i].id === event.detail.id) {
                    this.addresses[i].destroy();
                    let addressIdToRemove = { id: this.addresses[i].id };
                    this.addresses.splice(i, 1);
                    let addressRemovedFromModelEvent = new CustomEvent('address:removedFromModel', { detail: addressIdToRemove });
                    window.dispatchEvent(addressRemovedFromModelEvent);
                }
            }
            this.updateServer();
        };
        this.setPrimaryAddress = event => {
            for (let i = 0; i < this.addresses.length; i++) {
                if (this.addresses[i].id === event.detail.id) {
                    this.addresses[i].isPrimary = true;
                } else {
                    this.addresses[i].isPrimary = false;
                }
            }
            this.updateServer();
        };
        this.editAddress = event => {
            let addressGeoCodePromise = this.geoCodeAddress(event.detail.newAddressString).then(result => {
                event.detail.address.id = result[0].place_id;
                event.detail.address.addressData = result[0];
                event.detail.address.myGeoCode = result[0];
                event.detail.address.addressType = event.detail.newAddressType;
                let addressEditApprovedEvent = new CustomEvent('address:editApproved', { detail: {
                        idBeforeEdit: event.detail.address.idBeforeEdit,
                        address: event.detail.address
                    } });
                window.dispatchEvent(addressEditApprovedEvent);
                this.updateServer();
                //@MESSAGE: This should really be a Promise which on Success dispatches the Event,
                // but for the sake of the demo and showing the flow the event is dispatched without the server response
                /*this.updateServerPromise()
                .then((result:any)=> {
                    let addressEditApprovedEvent = new CustomEvent('address:editApproved',
                        { detail : {
                            idBeforeEdit : event.detail.address.idBeforeEdit,
                            address : event.detail.address
                        }});
                    window.dispatchEvent(addressEditApprovedEvent);
                })
                .catch((err:Error)=> this.logError(`${err} - problem adding address ${address.id}`));*/
            }).catch(err => console.log(err));
        };
        if (DataService._instance) {
            throw new Error("Error: Instantiation failed: Use DataService.getInstance() instead of new.");
        } else {
            DataService._instance = this;
        }
    }
    static getInstance() {
        return DataService._instance;
    }
    init() {
        this.geoCoder = new google.maps.Geocoder();
        window.addEventListener('address:added', this.addAddressToModel);
        window.addEventListener('address:delete', this.removeAddressFromModel);
        window.addEventListener('address:edit', this.editAddress);
        window.addEventListener('address:setPrimary', this.setPrimaryAddress);
        console.log('%c', 'background:#fff; color:#fff; padding:3px');
        console.log('%cʘ‿ʘ Thanks for visiting & considering! — Amit Ashckenazi', 'background:#1E90FF; color:#fff; padding:3px');
        console.log('%c', 'background:#fff; color:#fff; padding:3px');
    }
    destroy() {
        window.removeEventListener('address:added', this.addAddressToModel);
        window.removeEventListener('address:delete', this.removeAddressFromModel);
        window.removeEventListener('address:edit', this.editAddress);
        for (let i = 0; i < this.addresses.length; i++) {
            this.addresses[i].destroy();
        }
    }
    setLeadId(leadId) {
        this.leadId = leadId;
    }
    getAddressesForId() {
        /*
        @MESSAGE: A GET request is made to the API, simulate it with dispatching this event with the result
        $.ajax({url : `${this.apiEndPoint}/${this.leadId}` })
            .done(function(result){ console.log(result); })
            .fail(function(err){ console.log(err); });
        */
        var demoAddresses = [{
            id: 1,
            address_1: "123 5th Ave",
            address_2: "",
            city: "New York",
            country: "USA",
            state: "NY",
            zipcode: 10003,
            label: "business",
            is_primary: true
        }, {
            id: 2,
            address_1: "62 8th Ave",
            address_2: "",
            city: "New York",
            country: "USA",
            state: "NY",
            zipcode: 10014,
            label: "business",
            is_primary: false
        }];
        //@MESSAGE: uncomment to see how the component load with 0 addresses
        //demoAddresses = [];
        if (demoAddresses.length > 0) {
            let promises = [];
            for (let i = 0; i < demoAddresses.length; i++) {
                let address = new Address_1.Address(demoAddresses[i]);
                address.addressType = demoAddresses[i].label;
                address.isPrimary = demoAddresses[i].is_primary || false;
                address.leadId = this.leadId;
                let addressGeoCodePromise = this.geoCodeAddress(address.getAddressString()).then(result => {
                    address.id = result[0].place_id;
                    address.myGeoCode = result[0];
                    this.addresses.push(address);
                }).catch(err => this.logError(`${ err } - problem geocoding ${ address.getAddressString() }`));
                promises.push(addressGeoCodePromise);
            }
            Promise.all(promises).then(this.dispatchAddressesFetchedEvent);
        } else {
            this.dispatchAddressesFetchedEvent();
        }
    }
    geoCodeAddress(address) {
        // return a Promise
        return new Promise((resolve, reject) => {
            this.geoCoder.geocode({ 'address': address }, (results, status) => {
                if (status == google.maps.GeocoderStatus.OK) {
                    resolve(results);
                } else {
                    reject(status);
                }
            });
        });
    }
    get addresses() {
        return this._addresses;
    }
    set addresses(_addresses) {
        this._addresses = _addresses;
    }
    updateServerPromise() {
        return new Promise((resolve, reject) => {
            $.ajax({
                method: 'PUT',
                url: `${ this.apiEndPoint }/${ this.leadId }`,
                data: {
                    id: this.leadId,
                    addresses: this.addresses
                }
            }).done(result => {
                resolve(result);
            }).fail((jqXHR, err) => {
                reject(jqXHR);
            });
        });
    }
    updateServer() {
        console.log(`%cupdating addresses on server`, 'background:#00FA9A; color:#fff; padding:2px');
        let ajaxWillSendEvent = new CustomEvent('ajax:willSend');
        window.dispatchEvent(ajaxWillSendEvent);
        let ajaxConsequences = 'done' || 'fail';
        setTimeout(() => {
            switch (ajaxConsequences) {
                case 'done':
                    let ajaxSuccessEvent = new CustomEvent('ajax:success');
                    window.dispatchEvent(ajaxSuccessEvent);
                    break;
                case 'fail':
                    this.logError('Ajax Failed.... endpoint: ${this.apiEndPoint}/${this.leadId}, lead id: ${this.leadId}');
                    let ajaxErrorEvent = new CustomEvent('ajax:fail');
                    window.dispatchEvent(ajaxErrorEvent);
                    break;
            }
        }, 2000);
        /*$.ajax({
            method: 'PUT',
            url: `${this.apiEndPoint}/${this.leadId}`,
            data: {
                id : this.leadId,
                addresses : this.addresses
            }
        })
        .done((result:any)=>{
                let ajaxSuccessEvent:CustomEvent = new CustomEvent('ajax:success');
                window.dispatchEvent(ajaxSuccessEvent);
            }
        )
        .fail(( jqXHR:any, err:string) => {
                this.logError(err);
                let ajaxErrorEvent:CustomEvent = new CustomEvent('ajax:fail');
                window.dispatchEvent(ajaxErrorEvent);
            }
        );*/
    }

    logError(err) {
        console.log(`%c${ err }`, 'background:#B22222; color:#fff; padding:2px');
    }
}
DataService._instance = new DataService();
exports.DataService = DataService;

},{"../address/Address":1}],4:[function(require,module,exports){
"use strict";

class MapComponent {
    constructor(leadId) {
        this.mapElementId = 'ctx-map';
        this.geolocation = { lat: 37.7749, lng: -122.4194 };
        this.maxZoom = 12; //google maps api says it looks better ;)
        this.autocompleteElementId = 'autocomplete';
        this.markers = [];
        this.isRemovingMarker = false;
        this.fillInAddress = event => {
            let data = this.autocomplete.getPlace();
            data.addressType = $('#cio-address-type').val();
            if (data !== 'undefined') {
                var newPlaceEvent = new CustomEvent('address:added', { detail: data });
                window.dispatchEvent(newPlaceEvent);
                document.getElementById(this.autocompleteElementId).value = '';
            } else {
                //no-op
                console.warn('skipping');
            }
        };
        this.addMarkers = event => {
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
                marker.addListener('click', event => {
                    this.infoWindow.setContent(this.generateMarkerInfoWindowHtml(addresses[i].addressType, addresses[i].getGeoCodedFormattedAddressString(), addresses[i].myGeoCode.place_id));
                    this.infoWindow.open(this.map, marker);
                });
                this.markers.push(marker);
                this.bounds.extend(pos);
            }
            this.fitMapToMarkers();
        };
        this.addSingleMarker = event => {
            let address = event.detail;
            let pos = address.myGeoCode.geometry.location;
            let marker = new google.maps.Marker({
                position: pos,
                map: this.map,
                markerId: address.myGeoCode.place_id,
                animation: google.maps.Animation.DROP,
                title: address.addressType
            });
            marker.addListener('click', event => {
                this.infoWindow.setContent(this.generateMarkerInfoWindowHtml(address.addressType, address.getGeoCodedFormattedAddressString(), address.myGeoCode.place_id));
                this.infoWindow.open(this.map, marker);
            });
            this.markers.push(marker);
            this.bounds.extend(pos);
            this.fitMapToMarkers();
        };
        this.removeMarker = event => {
            this.bounds = new google.maps.LatLngBounds();
            for (let i = 0; i < this.markers.length; i++) {
                if (this.markers[i].markerId === event.detail.place.place_id) {
                    this.markers[i].setMap(null);
                    this.markers.splice(i, 1);
                } else {
                    this.bounds.extend(this.markers[i].position);
                }
            }
            this.fitMapToMarkers();
        };
        this.updateMarker = event => {
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
        this.animateMarker = event => {
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
            navigator.geolocation.getCurrentPosition(position => {
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
        let dataId = `data-id="${ id }"`;
        let dataContext = `data-context=".cio-info-window"`;
        let copyAction = `<a href="#" class="cio-action" data-action="copy" ${ dataContext } data-clipboard-text="${ addressText }">Copy</a>`;
        let actionButtons = `<div ${ dataId } class="cio-info-window-actions">${ copyAction }</div>`;
        return `<div class="cio-info-window"><strong>${ addressType }</strong><div>${ addressText }</div>${ actionButtons }<div>`;
    }
}
exports.MapComponent = MapComponent;

},{}],5:[function(require,module,exports){
"use strict";

class AjaxIndicator {
    constructor() {
        this.element = '.ctx-ajax-indicator';
        this.onWillSend = event => {
            $(`${ this.element }`).attr('data-status', 'yellow');
            $(`${ this.element }`).text('sending');
            this.emptyTextLabel();
        };
        this.onSuccess = event => {
            $(`${ this.element }`).attr('data-status', 'green');
            $(`${ this.element }`).text('success!');
            this.emptyTextLabel();
        };
        this.onFail = event => {
            $(`${ this.element }`).attr('data-status', 'red');
            $(`${ this.element }`).text('failed, try again..');
        };
    }
    init() {
        window.addEventListener('ajax:willSend', this.onWillSend);
        window.addEventListener('ajax:success', this.onSuccess);
        window.addEventListener('ajax:fail', this.onFail);
    }
    destroy() {
        window.removeEventListener('ajax:willSend', this.onWillSend);
        window.removeEventListener('ajax:success', this.onSuccess);
        window.removeEventListener('ajax:fail', this.onFail);
    }
    emptyTextLabel() {
        setTimeout(() => {
            $(`${ this.element }`).attr('data-status', '');
            $(`${ this.element }`).text('');
        }, 1500);
    }
}
exports.AjaxIndicator = AjaxIndicator;

},{}],6:[function(require,module,exports){
"use strict";

class Copier {
    constructor() {}
    init() {
        this.clipboard = new Clipboard('[data-action="copy"]');
        this.clipboard.on('success', this.signalCopiedItem);
    }
    destroy() {
        this.clipboard.destroy();
    }
    signalCopiedItem(event) {
        let parentElement;
        let parentClass = $(event.trigger).data('context');
        parentElement = $(event.trigger).parentsUntil(parentClass).parent();
        parentElement.addClass('ctx-copied');
        setTimeout(function () {
            parentElement.removeClass('ctx-copied');
        }, 1500);
        event.clearSelection();
    }
}
exports.Copier = Copier;

},{}],7:[function(require,module,exports){
"use strict";

const MapComponent_1 = require('./contextive/map/MapComponent');
const AddressList_1 = require('./contextive/address/AddressList');
const DataService_1 = require('./contextive/data/DataService');
const AjaxIndicator_1 = require('./contextive/ui/AjaxIndicator');
const Copier_1 = require('./contextive/ui/Copier');
class Main {
    constructor(leadId) {
        this.leadId = leadId;
    }
    init() {
        this.mapComponent = new MapComponent_1.MapComponent(this.leadId);
        this.mapComponent.init();
        this.addressList = new AddressList_1.AddressList(this.leadId);
        this.addressList.init();
        this.ajaxIndicator = new AjaxIndicator_1.AjaxIndicator();
        this.ajaxIndicator.init();
        this.copier = new Copier_1.Copier();
        this.copier.init();
        this.dataService = DataService_1.DataService.getInstance();
        this.dataService.init();
        this.dataService.setLeadId(this.leadId);
        this.dataService.getAddressesForId();
    }
    destroy() {
        this.mapComponent.destroy();
        this.addressList.destroy();
        this.ajaxIndicator.destroy();
        this.copier.destroy();
        this.dataService.destroy();
    }
}
window.gapiCallback = function () {
    const leadId = 'abc1234567890xyz';
    let main = new Main(leadId);
    main.init();
    //@MESSAGE: when removed, the destroy() method should be invoked - this removes events
    //main.destroy();
    //You can use this delay to test it out
    //setTimeout(()=>{  main.destroy(); console.log('destroyed!'); }, 5000);
};

},{"./contextive/address/AddressList":2,"./contextive/data/DataService":3,"./contextive/map/MapComponent":4,"./contextive/ui/AjaxIndicator":5,"./contextive/ui/Copier":6}]},{},[7])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY29udGV4dGl2ZS9hZGRyZXNzL0FkZHJlc3MudHMiLCJzcmMvY29udGV4dGl2ZS9hZGRyZXNzL0FkZHJlc3NMaXN0LnRzIiwic3JjL2NvbnRleHRpdmUvZGF0YS9EYXRhU2VydmljZS50cyIsInNyYy9jb250ZXh0aXZlL21hcC9NYXBDb21wb25lbnQudHMiLCJzcmMvY29udGV4dGl2ZS91aS9BamF4SW5kaWNhdG9yLnRzIiwic3JjL2NvbnRleHRpdmUvdWkvQ29waWVyLnRzIiwic3JjL21haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBO0FBV0ksZ0JBQVksQUFBZTtBQVBwQixhQUFTLFlBQU8sQUFBRSxBQUFDO0FBRW5CLGFBQVMsWUFBVyxBQUFLLEFBQUM7QUFFekIsYUFBYSxnQkFBVyxBQUFLLEFBQUM7QUFzRjlCLGFBQWtCLHFCQUFJLEFBQWlCLEtBQWxCO0FBQ3pCLEFBQUUsZ0JBQUMsQUFBSSxLQUFDLEFBQVksaUJBQUssQUFBSyxNQUFDLEFBQU0sT0FBQyxBQUFZLEFBQUMsY0FBQSxBQUFDO0FBQ2hELEFBQUMsa0JBQUMsYUFBWSxBQUFJLEtBQUMsQUFBWSxjQUEyQixBQUFDLDRCQUFDLEFBQUksS0FBQyxBQUFJLEtBQUMsQUFBVyxBQUFDLEFBQUM7QUFDbkYsQUFBQyxrQkFBQyxjQUFhLEFBQUksS0FBQyxBQUFZLGNBQUksQUFBQyxLQUFDLEFBQUksS0FBQyxBQUFTLFdBQUMsQUFBSSxLQUFDLEFBQUUsQUFBQyxBQUFDLEFBQ2xFO0FBQUMsQUFDTDtBQUFDO0FBdkZHLEFBQUksYUFBQyxBQUFXLGNBQUcsQUFBVyxBQUFDO0FBQy9CLEFBQUksYUFBQyxBQUFJLEFBQUUsQUFBQyxBQUNoQjtBQUFDO0FBRU0sQUFBSTtBQUNQLEFBQU0sZUFBQyxBQUFnQixpQkFBQyxBQUFzQix3QkFBRSxBQUFJLEtBQUMsQUFBa0IsQUFBQyxBQUFDLEFBQzdF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QUksU0FBQyxBQUFJLEFBQUUsQUFBQyxBQUVaLEFBQXNGLEFBQ3RGLEFBQWlCLEFBQ2pCLEFBQXVDLEFBQ3ZDLEFBQXdFLEFBQzVFOzs7OztBQUFDLEFBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiZXhwb3J0IGNsYXNzIEFkZHJlc3N7XG5cbiAgICBwdWJsaWMgYWRkcmVzc0RhdGE6YW55O1xuICAgIHB1YmxpYyBpZDpzdHJpbmc7XG4gICAgcHVibGljIG15R2VvQ29kZTphbnkgPSB7fTtcbiAgICBwdWJsaWMgYWRkcmVzc1R5cGU6c3RyaW5nO1xuICAgIHB1YmxpYyBpc1ByaW1hcnk6Ym9vbGVhbiA9IGZhbHNlO1xuICAgIHB1YmxpYyBsZWFkSWQ6c3RyaW5nO1xuICAgIHByaXZhdGUgaXNCZWluZ0VkaXRlZDpib29sZWFuID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBpZEJlZm9yZUVkaXQ6c3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3IoYWRkcmVzc0RhdGE6YW55KXtcbiAgICAgICAgdGhpcy5hZGRyZXNzRGF0YSA9IGFkZHJlc3NEYXRhO1xuICAgICAgICB0aGlzLmluaXQoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgaW5pdCgpOnZvaWR7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdhZGRyZXNzOmVkaXRBcHByb3ZlZCcsIHRoaXMuaGFuZGxlRWRpdEFwcHJvdmVkKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVzdHJveSgpOnZvaWR7XG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdhZGRyZXNzOmVkaXRBcHByb3ZlZCcsIHRoaXMuaGFuZGxlRWRpdEFwcHJvdmVkKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0SHRtbCgpOnN0cmluZ3tcbiAgICAgICAgbGV0IGFkZHJlc3NTdHJpbmc6c3RyaW5nID0gdGhpcy5nZXRHZW9Db2RlZEZvcm1hdHRlZEFkZHJlc3NTdHJpbmcoKTtcbiAgICAgICAgbGV0IGFkZHJlc3NUeXBlTGFiZWw6c3RyaW5nID0gYDxzdHJvbmcgY2xhc3M9XCJjdHgtYWRkcmVzcy10eXBlLWxhYmVsXCI+JHt0aGlzLmFkZHJlc3NUeXBlfTwvc3Ryb25nPmA7XG4gICAgICAgIGxldCBlZGl0YWJsZUFkZHJlc3M6c3RyaW5nID0gdGhpcy5nZXRTcGxpdEdlb0NvZGVkRm9ybWF0dGVkQWRkcmVzc0ZvckVkaXQoKTtcbiAgICAgICAgbGV0IGRhdGFJZDpzdHJpbmcgPSBgZGF0YS1pZD1cIiR7dGhpcy5pZH1cImA7XG4gICAgICAgIGxldCBkYXRhQ29udGV4dDpzdHJpbmcgPSBgZGF0YS1jb250ZXh0PVwiLmN0eC1hZGRyZXNzLWl0ZW1cImA7XG4gICAgICAgIGxldCBlZGl0QWN0aW9uOnN0cmluZyA9IGA8YSBocmVmPVwiI1wiIGNsYXNzPVwiY3R4LWFjdGlvblwiIGRhdGEtYWN0aW9uPVwiZWRpdFwiICR7ZGF0YUlkfSAke2RhdGFDb250ZXh0fT5FZGl0PC9hPmA7XG4gICAgICAgIGxldCBjYW5jZWxFZGl0QWN0aW9uOnN0cmluZyA9IGA8YSBocmVmPVwiI1wiIGNsYXNzPVwiY3R4LWFjdGlvbiBjdHgtaGlkZGVuLWFjdGlvblwiIGRhdGEtYWN0aW9uPVwiY2FuY2VsXCIgJHtkYXRhSWR9ICR7ZGF0YUNvbnRleHR9PkNhbmNlbDwvYT5gO1xuICAgICAgICBsZXQgYXBwcm92ZUVkaXRBY3Rpb246c3RyaW5nID0gYDxhIGhyZWY9XCIjXCIgY2xhc3M9XCJjdHgtYWN0aW9uIGN0eC1oaWRkZW4tYWN0aW9uXCIgZGF0YS1hY3Rpb249XCJhcHByb3ZlXCIgJHtkYXRhSWR9ICR7ZGF0YUNvbnRleHR9Pk9LPC9hPmA7XG4gICAgICAgIGxldCBjb3B5QWN0aW9uOnN0cmluZyA9IGA8YSBocmVmPVwiI1wiIGNsYXNzPVwiY3R4LWFjdGlvblwiIGRhdGEtYWN0aW9uPVwiY29weVwiIGRhdGEtY2xpcGJvYXJkLXRleHQ9XCIke2FkZHJlc3NTdHJpbmd9XCIgJHtkYXRhQ29udGV4dH0+Q29weTwvYT5gO1xuICAgICAgICBsZXQgZGVsZXRlQWN0aW9uOnN0cmluZyA9IGA8YSBocmVmPVwiI1wiIGNsYXNzPVwiY3R4LWFjdGlvblwiIGRhdGEtYWN0aW9uPVwiZGVsZXRlXCIgJHtkYXRhSWR9ICR7ZGF0YUNvbnRleHR9PkRlbGV0ZTwvYT5gO1xuICAgICAgICBsZXQgaXNDaGVja2VkOnN0cmluZyA9IHRoaXMuaXNQcmltYXJ5ID8gJ2NoZWNrZWQnIDogJyc7XG4gICAgICAgIGxldCBwcmltYXJ5UmFkaW86c3RyaW5nID0gYDxsYWJlbCBmb3I9XCJyYWRpby0ke3RoaXMuaWR9XCI+YCtcbiAgICAgICAgICAgIGA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIiR7dGhpcy5sZWFkSWR9XCIgdmFsdWU9XCIke3RoaXMuaXNQcmltYXJ5fVwiIGlkPVwicmFkaW8tJHt0aGlzLmlkfVwiICR7ZGF0YUlkfSAke2lzQ2hlY2tlZH0+UHJpbWFyeTwvbGFiZWw+YDtcblxuICAgICAgICByZXR1cm4gYDxsaSBjbGFzcz1cImN0eC1hZGRyZXNzLWl0ZW1cIiAke2RhdGFJZH0+YCArXG4gICAgICAgICAgICAgICBgPGRpdiBjbGFzcz1cImN0eC1hZGRyZXNzLXRpdGxlLWFuZC1wcmltYXJ5XCI+JHthZGRyZXNzVHlwZUxhYmVsfSAke3ByaW1hcnlSYWRpb308L2Rpdj5gICtcbiAgICAgICAgICAgICAgIGA8ZGl2IGNsYXNzPVwiY3R4LWFkZHJlc3MtdHlwZS1zZWxlY3RvclwiPiR7dGhpcy5nZW5lcmF0ZUFkZHJlc3NUeXBlU2VsZWN0KCl9PC9kaXY+YCArXG4gICAgICAgICAgICAgICBgPGRpdiBjbGFzcz1cImN0eC1lZGl0YWJsZS1hZGRyZXNzLXN0cmluZ1wiPiR7ZWRpdGFibGVBZGRyZXNzfTwvZGl2PmAgK1xuICAgICAgICAgICAgICAgYDxkaXYgY2xhc3M9XCJjdHgtaXRlbS1hY3Rpb25zXCI+JHthcHByb3ZlRWRpdEFjdGlvbn0ke2NhbmNlbEVkaXRBY3Rpb259JHtlZGl0QWN0aW9ufSR7Y29weUFjdGlvbn0ke2RlbGV0ZUFjdGlvbn08L2Rpdj48L2xpPmA7XG4gICAgfVxuXG4gICAgcHVibGljIHNldEVkaXRhYmxlKCk6dm9pZHtcbiAgICAgICAgdGhpcy5pc0JlaW5nRWRpdGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5pZEJlZm9yZUVkaXQgPSB0aGlzLmlkO1xuICAgICAgICAkKGBsaVtkYXRhLWlkPSR7dGhpcy5pZH1dYCkuYWRkQ2xhc3MoJ2N0eC1hZGRyZXNzLWlzLWJlaW5nLWVkaXRlZCcpO1xuICAgICAgICAkKGBbZGF0YS1pZD0ke3RoaXMuaWR9XSAuY3R4LWVkaXRhYmxlLWFkZHJlc3Mtc3RyaW5nIHNwYW5gKS5hdHRyKCdjb250ZW50ZWRpdGFibGUnLCAndHJ1ZScpO1xuICAgICAgICAkKGBbZGF0YS1pZD0ke3RoaXMuaWR9XSAuY3R4LWVkaXRhYmxlLWFkZHJlc3Mtc3RyaW5nIHNwYW5gKS5vbignZm9jdXMnLCBmdW5jdGlvbiAoZXZlbnQ6YW55KSB7XG4gICAgICAgICAgICBsZXQgcmFuZ2UgPSBkb2N1bWVudC5jcmVhdGVSYW5nZSgpO1xuICAgICAgICAgICAgcmFuZ2Uuc2VsZWN0Tm9kZUNvbnRlbnRzKGV2ZW50LmN1cnJlbnRUYXJnZXQpO1xuICAgICAgICAgICAgbGV0IHNlbCA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgIHNlbC5yZW1vdmVBbGxSYW5nZXMoKTtcbiAgICAgICAgICAgIHNlbC5hZGRSYW5nZShyYW5nZSk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKGBbZGF0YS1pZD0ke3RoaXMuaWR9XSAuY3R4LWVkaXRhYmxlLWFkZHJlc3Mtc3RyaW5nIHNwYW46Zmlyc3QtY2hpbGRgKS5mb2N1cygpO1xuICAgICAgICAkKGBbZGF0YS1pZD0ke3RoaXMuaWR9XSBzZWxlY3RgKS5yZW1vdmVBdHRyKCdkaXNhYmxlZCcpO1xuXG4gICAgICAgIC8vYWN0aW9uIGJ1dHRvbnNcbiAgICAgICAgJCgnW2RhdGEtYWN0aW9uPVwiYXBwcm92ZVwiXSwgW2RhdGEtYWN0aW9uPVwiY2FuY2VsXCJdJywgYFtkYXRhLWlkPSR7dGhpcy5pZH1dYCkucmVtb3ZlQ2xhc3MoJ2N0eC1oaWRkZW4tYWN0aW9uJyk7XG4gICAgICAgICQoJ1tkYXRhLWFjdGlvbj1cImVkaXRcIl0nLCBgW2RhdGEtaWQ9JHt0aGlzLmlkfV1gKS5hZGRDbGFzcygnY3R4LWhpZGRlbi1hY3Rpb24nKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY2FuY2VsRWRpdGFibGUocmVzZXRBZGRyZXNzU3RyaW5nOmJvb2xlYW4gPSB0cnVlKTp2b2lke1xuICAgICAgICAkKGBsaVtkYXRhLWlkPSR7dGhpcy5pZH1dYCkucmVtb3ZlQ2xhc3MoJ2N0eC1hZGRyZXNzLWlzLWJlaW5nLWVkaXRlZCcpO1xuICAgICAgICAkKGBbZGF0YS1pZD0ke3RoaXMuaWR9XSAuY3R4LWVkaXRhYmxlLWFkZHJlc3Mtc3RyaW5nIHNwYW5gKS5hdHRyKCdjb250ZW50ZWRpdGFibGUnLCdmYWxzZScpO1xuICAgICAgICBpZihyZXNldEFkZHJlc3NTdHJpbmcpe1xuICAgICAgICAgICAgJChgW2RhdGEtaWQ9JHt0aGlzLmlkfV0gLmN0eC1lZGl0YWJsZS1hZGRyZXNzLXN0cmluZ2ApLmZpbmQoJ3NwYW4nKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICQoYFtkYXRhLWlkPSR7dGhpcy5pZH1dIC5jdHgtZWRpdGFibGUtYWRkcmVzcy1zdHJpbmdgKS5wcmVwZW5kKHRoaXMuZ2V0U3BsaXRHZW9Db2RlZEZvcm1hdHRlZEFkZHJlc3NGb3JFZGl0KCkpO1xuICAgICAgICB9XG4gICAgICAgICQoYFtkYXRhLWlkPSR7dGhpcy5pZH1dIHNlbGVjdGApLmF0dHIoJ2Rpc2FibGVkJywgJ2Rpc2FibGVkJyk7XG4gICAgICAgIC8vYWN0aW9uIGJ1dHRvbnNcbiAgICAgICAgJCgnW2RhdGEtYWN0aW9uPVwiYXBwcm92ZVwiXSwgW2RhdGEtYWN0aW9uPVwiY2FuY2VsXCJdJywgYFtkYXRhLWlkPSR7dGhpcy5pZH1dYCkuYWRkQ2xhc3MoJ2N0eC1oaWRkZW4tYWN0aW9uJyk7XG4gICAgICAgICQoJ1tkYXRhLWFjdGlvbj1cImVkaXRcIl0nLCBgW2RhdGEtaWQ9JHt0aGlzLmlkfV1gKS5yZW1vdmVDbGFzcygnY3R4LWhpZGRlbi1hY3Rpb24nKTtcbiAgICAgICAgdGhpcy5pc0JlaW5nRWRpdGVkID0gZmFsc2U7XG4gICAgfVxuICAgIFxuICAgIHB1YmxpYyBzZW5kVG9BcHByb3ZlRWRpdCgpOnZvaWR7XG4gICAgICAgIHRoaXMuY2FuY2VsRWRpdGFibGUoZmFsc2UpO1xuICAgICAgICBsZXQgbmV3QWRkcmVzc1N0cmluZzpzdHJpbmcgPSAkKGBbZGF0YS1pZD0ke3RoaXMuaWRCZWZvcmVFZGl0fV0gLmN0eC1lZGl0YWJsZS1hZGRyZXNzLXN0cmluZyBzcGFuYCkudGV4dCgpO1xuICAgICAgICBsZXQgcGF5bG9hZDphbnkgPSB7XG4gICAgICAgICAgICBpZCA6IHRoaXMuaWQsXG4gICAgICAgICAgICBpZEJlZm9yZUVkaXQgOiB0aGlzLmlkQmVmb3JlRWRpdCxcbiAgICAgICAgICAgIG5ld0FkZHJlc3NTdHJpbmcgOiBuZXdBZGRyZXNzU3RyaW5nLFxuICAgICAgICAgICAgYWRkcmVzcyA6IHRoaXMsXG4gICAgICAgICAgICBuZXdBZGRyZXNzVHlwZSA6ICQoYFtkYXRhLWlkPSR7dGhpcy5pZH1dIHNlbGVjdGApLnZhbCgpXG4gICAgICAgIH07XG4gICAgICAgIGxldCBhZGRyZXNzRWRpdEV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCdhZGRyZXNzOmVkaXQnLCB7ZGV0YWlsIDogcGF5bG9hZH0pO1xuICAgICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChhZGRyZXNzRWRpdEV2ZW50KTtcbiAgICB9XG4gICAgXG4gICAgcHJpdmF0ZSBoYW5kbGVFZGl0QXBwcm92ZWQgPSAoZXZlbnQ6Q3VzdG9tRXZlbnQpOnZvaWQgPT57XG4gICAgICAgIGlmKHRoaXMuaWRCZWZvcmVFZGl0ID09PSBldmVudC5kZXRhaWwuaWRCZWZvcmVFZGl0KXtcbiAgICAgICAgICAgICQoYFtkYXRhLWlkPSR7dGhpcy5pZEJlZm9yZUVkaXR9XSAuY3R4LWFkZHJlc3MtdHlwZS1sYWJlbGApLnRleHQodGhpcy5hZGRyZXNzVHlwZSk7XG4gICAgICAgICAgICAkKGBbZGF0YS1pZD1cIiR7dGhpcy5pZEJlZm9yZUVkaXR9XCJdYCkuYXR0cignZGF0YS1pZCcsdGhpcy5pZCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgZnJlZXplQWN0aW9ucygpOnZvaWR7XG4gICAgICAgIHRoaXMuaXNCZWluZ0VkaXRlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuaWRCZWZvcmVFZGl0ID0gdGhpcy5pZDtcbiAgICAgICAgJChgbGlbZGF0YS1pZD0ke3RoaXMuaWR9XSAuY3R4LWl0ZW0tYWN0aW9uc2ApLmFkZENsYXNzKCdjdHgtaXRlbS1hY3Rpb25zLWRpc2FibGVkJyk7XG4gICAgICAgICQoYGxpW2RhdGEtaWQ9JHt0aGlzLmlkfV0gLmN0eC1pdGVtLWFjdGlvbnMgYWApLmF0dHIoJ2Rpc2FibGVkJywnZGlzYWJsZWQnKTtcbiAgICAgICAgJChgbGlbZGF0YS1pZD0ke3RoaXMuaWR9XSBzZWxlY3RgKS5hdHRyKCdkaXNhYmxlZCcsJ2Rpc2FibGVkJyk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldEdlb0NvZGVkRm9ybWF0dGVkQWRkcmVzc1N0cmluZygpOnN0cmluZ3tcbiAgICAgICAgcmV0dXJuIHRoaXMubXlHZW9Db2RlLmZvcm1hdHRlZF9hZGRyZXNzO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0U3BsaXRHZW9Db2RlZEZvcm1hdHRlZEFkZHJlc3NGb3JFZGl0KCk6c3RyaW5ne1xuICAgICAgICBsZXQgYWRkcmVzc0ZyYWdtZW50czpzdHJpbmdbXSA9IHRoaXMubXlHZW9Db2RlLmZvcm1hdHRlZF9hZGRyZXNzLnNwbGl0KCcsJyk7XG4gICAgICAgIGxldCBlZGl0YWJsZUFkZHJlc3M6c3RyaW5nID0gJyc7XG4gICAgICAgIGZvciAobGV0IGk6bnVtYmVyID0gMDsgaSA8IGFkZHJlc3NGcmFnbWVudHMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgZWRpdGFibGVBZGRyZXNzICs9IGA8c3BhbiBjbGFzcz1cImN0eC1hZGRyZXNzLWZyYWdtZW50XCIgY29udGVudGVkaXRhYmxlPVwiZmFsc2VcIj4ke2FkZHJlc3NGcmFnbWVudHNbaV0udHJpbSgpfWA7XG4gICAgICAgICAgICBpZihpIDwgYWRkcmVzc0ZyYWdtZW50cy5sZW5ndGgtMSl7XG4gICAgICAgICAgICAgICAgZWRpdGFibGVBZGRyZXNzICs9ICcsICc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlZGl0YWJsZUFkZHJlc3MgKz0gYDwvc3Bhbj5gO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlZGl0YWJsZUFkZHJlc3M7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZW5lcmF0ZUFkZHJlc3NUeXBlU2VsZWN0KCk6c3RyaW5ne1xuICAgICAgICByZXR1cm4gYDxzZWxlY3QgbmFtZT1cIlwiIGRhdGEtaWQ9XCIke3RoaXMuaWR9XCIgZGlzYWJsZWQ9XCJkaXNhYmxlZFwiIGNsYXNzPVwiY3R4LXNlbGVjdFwiPmAgK1xuICAgICAgICAgICAgICAgYDxvcHRpb24gdmFsdWU9XCJidXNpbmVzc1wiICR7dGhpcy5hZGRyZXNzVHlwZSA9PSAnYnVzaW5lc3MnID8gJ3NlbGVjdGVkJyA6ICcnfT5CdXNpbmVzczwvb3B0aW9uPmAgK1xuXHRcdFx0ICAgYDxvcHRpb24gdmFsdWU9XCJtYWlsaW5nXCIgJHt0aGlzLmFkZHJlc3NUeXBlID09ICdtYWlsaW5nJyA/ICdzZWxlY3RlZCcgOiAnJ30+TWFpbGluZzwvb3B0aW9uPmAgK1xuICAgICAgICAgICAgICAgYDxvcHRpb24gdmFsdWU9XCJvdGhlclwiICR7dGhpcy5hZGRyZXNzVHlwZSA9PSAnb3RoZXInID8gJ3NlbGVjdGVkJyA6ICcnfT5PdGhlcjwvb3B0aW9uPmAgK1xuICAgICAgICAgICAgICAgYDwvc2VsZWN0PmA7XG4gICAgfVxuXG4gICAgLypcbiAgICAqIExlZ2FjeSBhZGRyZXNzIHN0cmluZ1xuICAgICogKi9cbiAgICBwdWJsaWMgZ2V0QWRkcmVzc1N0cmluZygpOnN0cmluZ3tcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkcmVzc0RhdGEuYWRkcmVzc18xICsgJywgJyArXG4gICAgICAgICAgICB0aGlzLmFkZHJlc3NEYXRhLmFkZHJlc3NfMiArICcsICcgK1xuICAgICAgICAgICAgdGhpcy5hZGRyZXNzRGF0YS5jaXR5ICsgJyAnICtcbiAgICAgICAgICAgIHRoaXMuYWRkcmVzc0RhdGEuemlwY29kZSArICcsICcgK1xuICAgICAgICAgICAgdGhpcy5hZGRyZXNzRGF0YS5zdGF0ZSArICcsICcgK1xuICAgICAgICAgICAgdGhpcy5hZGRyZXNzRGF0YS5jb3VudHJ5O1xuICAgIH1cbn0iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vLi4vdHlwaW5ncy90c2QuZC50c1wiIC8+XG5cbmltcG9ydCB7IERhdGFTZXJ2aWNlIH0gZnJvbSAnLi4vZGF0YS9EYXRhU2VydmljZSc7XG5pbXBvcnQgeyBBZGRyZXNzIH0gZnJvbSAnLi9BZGRyZXNzJztcblxuZXhwb3J0IGNsYXNzIEFkZHJlc3NMaXN0IHtcblxuICAgIHByaXZhdGUgbGVhZElkOnN0cmluZztcbiAgICBwcml2YXRlIGxpc3RFbGVtZW50Q2xhc3M6c3RyaW5nID0gJ2N0eC1hZGRyZXNzLWxpc3QnO1xuICAgIHByaXZhdGUgbW91c2VFbnRlckV2ZW50OkN1c3RvbUV2ZW50O1xuICAgIHByaXZhdGUgYW5pbWF0aW9uVGltZTpudW1iZXIgPSAxMjI7XG5cbiAgICBjb25zdHJ1Y3RvcihsZWFkSWQ6c3RyaW5nKSB7XG4gICAgICAgIHRoaXMubGVhZElkID0gbGVhZElkO1xuICAgIH1cblxuICAgIHB1YmxpYyBpbml0KCkge1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYWRkcmVzczphZGRlZFRvTW9kZWwnLCB0aGlzLmFkZEFkcmVzcyk7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdhZGRyZXNzOnJlbW92ZWRGcm9tTW9kZWwnLCB0aGlzLnJlbW92ZUFkZHJlc3MpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYWRkcmVzc2VzOmZldGNoZWQnLCB0aGlzLnJlbmRlckFkZHJlc3Nlcyk7XG4gICAgICAgICQoYC4ke3RoaXMubGlzdEVsZW1lbnRDbGFzc31gKS5vbignbW91c2VlbnRlcicsICdsaScsIHRoaXMuaGFuZGxlTW91c2VPdmVyKTtcbiAgICAgICAgJChgLiR7dGhpcy5saXN0RWxlbWVudENsYXNzfWApLm9uKCdtb3VzZWxlYXZlJywgJ2xpJywgdGhpcy5oYW5kbGVNb3VzZU92ZXIpO1xuICAgICAgICAkKGAuJHt0aGlzLmxpc3RFbGVtZW50Q2xhc3N9YCkub24oJ2NsaWNrJywgJ2EnLCB0aGlzLmhhbmRsZUNsaWNrcyk7XG4gICAgICAgICQoYC4ke3RoaXMubGlzdEVsZW1lbnRDbGFzc31gKS5vbignY2hhbmdlJywgJ2lucHV0W3R5cGU9XCJyYWRpb1wiXScsIHRoaXMuaGFuZGxlUHJpbWFyeUNoYW5nZSk7XG4gICAgfVxuXG4gICAgcHVibGljIGRlc3Ryb3koKTp2b2lkIHtcbiAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2FkZHJlc3M6YWRkZWRUb01vZGVsJywgdGhpcy5hZGRBZHJlc3MpO1xuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignYWRkcmVzczpyZW1vdmVkRnJvbU1vZGVsJywgdGhpcy5yZW1vdmVBZGRyZXNzKTtcbiAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2FkZHJlc3NlczpmZXRjaGVkJywgdGhpcy5yZW5kZXJBZGRyZXNzZXMpO1xuICAgICAgICAkKGAuJHt0aGlzLmxpc3RFbGVtZW50Q2xhc3N9YCkub2ZmKCdtb3VzZWVudGVyJywgJ2xpJywgdGhpcy5oYW5kbGVNb3VzZU92ZXIpO1xuICAgICAgICAkKGAuJHt0aGlzLmxpc3RFbGVtZW50Q2xhc3N9YCkub2ZmKCdtb3VzZWxlYXZlJywgJ2xpJywgdGhpcy5oYW5kbGVNb3VzZU92ZXIpO1xuICAgICAgICAkKGAuJHt0aGlzLmxpc3RFbGVtZW50Q2xhc3N9YCkub2ZmKCdjbGljaycsICdhJywgdGhpcy5oYW5kbGVDbGlja3MpO1xuICAgICAgICAkKGAuJHt0aGlzLmxpc3RFbGVtZW50Q2xhc3N9YCkub2ZmKCdjaGFuZ2UnLCAnaW5wdXRbdHlwZT1cInJhZGlvXCJdJywgdGhpcy5oYW5kbGVQcmltYXJ5Q2hhbmdlKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFkZEFkcmVzcyA9IChldmVudDpDdXN0b21FdmVudCk6dm9pZCA9PiB7XG4gICAgICAgIHRoaXMuaGFuZGxlWmVyb0VudHJpZXMoKTtcbiAgICAgICAgdmFyIGFkZHJlc3Nlc0h0bWw6c3RyaW5nID0gZXZlbnQuZGV0YWlsLmdldEh0bWwoKTtcbiAgICAgICAgJChgLiR7dGhpcy5saXN0RWxlbWVudENsYXNzfWApLmFwcGVuZChhZGRyZXNzZXNIdG1sKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlbW92ZUFkZHJlc3MgPSAoZXZlbnQ6Q3VzdG9tRXZlbnQpOnZvaWQgPT4ge1xuICAgICAgICB0aGlzLmhhbmRsZVplcm9FbnRyaWVzKCk7XG4gICAgICAgICQoYC4ke3RoaXMubGlzdEVsZW1lbnRDbGFzc30gbGlbZGF0YS1pZD0ke2V2ZW50LmRldGFpbC5pZH1dYCkucmVtb3ZlKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZW5kZXJBZGRyZXNzZXMgPSAoZXZlbnQ6Q3VzdG9tRXZlbnQpOnZvaWQgPT4ge1xuICAgICAgICB0aGlzLmhhbmRsZVplcm9FbnRyaWVzKCk7XG4gICAgICAgIGxldCBhZGRyZXNzZXM6QWRkcmVzc1tdID0gZXZlbnQuZGV0YWlsO1xuICAgICAgICBsZXQgYWRkcmVzc2VzSHRtbDpzdHJpbmcgPSAnJztcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhZGRyZXNzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFkZHJlc3Nlc0h0bWwgKz0gYWRkcmVzc2VzW2ldLmdldEh0bWwoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYWRkcmVzc2VzSHRtbCAhPT0gJycpIHtcbiAgICAgICAgICAgICQoYC4ke3RoaXMubGlzdEVsZW1lbnRDbGFzc31gKS5hcHBlbmQoYWRkcmVzc2VzSHRtbCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGhhbmRsZVplcm9FbnRyaWVzKCk6dm9pZCB7XG4gICAgICAgICQoYC5jdHgtbG9jYXRpb24taW5kaWNhdG9yYCkuYWRkQ2xhc3MoJ2hpZGUtaW5kaWNhdG9yJyk7XG4gICAgICAgIGlmIChEYXRhU2VydmljZS5nZXRJbnN0YW5jZSgpLmFkZHJlc3Nlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAkKGAuJHt0aGlzLmxpc3RFbGVtZW50Q2xhc3N9IC5jdHgtbW9kYWwtMC1lbnRyaWVzYCkuc2xpZGVVcCh0aGlzLmFuaW1hdGlvblRpbWUpO1xuICAgICAgICAgICAgJChgLiR7dGhpcy5saXN0RWxlbWVudENsYXNzfSAuY3R4LW1vZGFsLTAtZW50cmllcy1tZXNzYWdlYCkuaGlkZSh0aGlzLmFuaW1hdGlvblRpbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJChgLiR7dGhpcy5saXN0RWxlbWVudENsYXNzfSAuY3R4LWxvY2F0aW9uLWluZGljYXRvcmApLmFkZENsYXNzKCdoaWRlLWluZGljYXRvcicpO1xuICAgICAgICAgICAgJChgLiR7dGhpcy5saXN0RWxlbWVudENsYXNzfSAuY3R4LW1vZGFsLTAtZW50cmllc2ApLnNsaWRlRG93bih0aGlzLmFuaW1hdGlvblRpbWUpO1xuICAgICAgICAgICAgJChgLiR7dGhpcy5saXN0RWxlbWVudENsYXNzfSAuY3R4LW1vZGFsLTAtZW50cmllcy1tZXNzYWdlYCkuc2hvdyh0aGlzLmFuaW1hdGlvblRpbWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBoYW5kbGVDbGlja3MgPSAoZXZlbnQ6YW55KTp2b2lkID0+IHtcbiAgICAgICAgbGV0IGFjdGlvbmFibGVBZGRyZXNzOkFkZHJlc3MgPSB0aGlzLmdldEFjdGlvbmFibGVBZGRyZXNzKGV2ZW50LmN1cnJlbnRUYXJnZXQuZGF0YXNldC5pZCk7XG4gICAgICAgIHN3aXRjaCAoZXZlbnQuY3VycmVudFRhcmdldC5kYXRhc2V0LmFjdGlvbikge1xuICAgICAgICAgICAgY2FzZSAnZWRpdCc6XG4gICAgICAgICAgICAgICAgYWN0aW9uYWJsZUFkZHJlc3Muc2V0RWRpdGFibGUoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2NhbmNlbCc6XG4gICAgICAgICAgICAgICAgYWN0aW9uYWJsZUFkZHJlc3MuY2FuY2VsRWRpdGFibGUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdhcHByb3ZlJzpcbiAgICAgICAgICAgICAgICBhY3Rpb25hYmxlQWRkcmVzcy5zZW5kVG9BcHByb3ZlRWRpdCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnZGVsZXRlJzpcbiAgICAgICAgICAgICAgICBsZXQgZGVsZXRlQ29uZmlybWF0aW9uID0gY29uZmlybSgnVGhpcyBpcyBkZXN0cnVjdGl2ZSwgYXJlIHlvdSBzdXJlIHdhbnQgdG8gZGVsZXRlPycpO1xuICAgICAgICAgICAgICAgIGlmKGRlbGV0ZUNvbmZpcm1hdGlvbiA9PT0gdHJ1ZSl7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbmFibGVBZGRyZXNzLmZyZWV6ZUFjdGlvbnMoKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHBheWxvYWQ6YW55ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IGV2ZW50LmN1cnJlbnRUYXJnZXQuZGF0YXNldC5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogZXZlbnQuY3VycmVudFRhcmdldC5kYXRhc2V0LmFjdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlOiBhY3Rpb25hYmxlQWRkcmVzcy5teUdlb0NvZGVcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGFkZHJlc3NEZWxldGVFdmVudCA9IG5ldyBDdXN0b21FdmVudCgnYWRkcmVzczpkZWxldGUnLCB7ZGV0YWlsOiBwYXlsb2FkfSk7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KGFkZHJlc3NEZWxldGVFdmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAvL25vLW9wXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGhhbmRsZVByaW1hcnlDaGFuZ2UgPSAoZXZlbnQ6YW55KTp2b2lkID0+IHtcbiAgICAgICAgbGV0IGFjdGlvbmFibGVBZGRyZXNzOkFkZHJlc3MgPSB0aGlzLmdldEFjdGlvbmFibGVBZGRyZXNzKGV2ZW50LmN1cnJlbnRUYXJnZXQuZGF0YXNldC5pZCk7XG4gICAgICAgIGxldCBwYXlsb2FkOmFueSA9IHtcbiAgICAgICAgICAgIGlkOiBldmVudC5jdXJyZW50VGFyZ2V0LmRhdGFzZXQuaWRcbiAgICAgICAgfTtcbiAgICAgICAgbGV0IHNldFByaW1hcnlBZGRyZXNzRXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoJ2FkZHJlc3M6c2V0UHJpbWFyeScsIHtkZXRhaWwgOiBwYXlsb2FkfSk7XG4gICAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KHNldFByaW1hcnlBZGRyZXNzRXZlbnQpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0QWN0aW9uYWJsZUFkZHJlc3MoaWQ6c3RyaW5nKTpBZGRyZXNze1xuICAgICAgICBmb3IgKGxldCBpOm51bWJlciA9IDA7IGkgPCBEYXRhU2VydmljZS5nZXRJbnN0YW5jZSgpLmFkZHJlc3Nlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKERhdGFTZXJ2aWNlLmdldEluc3RhbmNlKCkuYWRkcmVzc2VzW2ldLmlkID09PSBpZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiA8QWRkcmVzcz5EYXRhU2VydmljZS5nZXRJbnN0YW5jZSgpLmFkZHJlc3Nlc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgaGFuZGxlTW91c2VPdmVyID0gKGV2ZW50OkV2ZW50KTp2b2lkID0+IHtcbiAgICAgICAgdGhpcy5tb3VzZUVudGVyRXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoJ2FkZHJlc3M6bW91c2Vtb3ZlJyxcbiAgICAgICAgICAgIHtkZXRhaWw6IHtpZDogJChldmVudC5jdXJyZW50VGFyZ2V0KS5hdHRyKCdkYXRhLWlkJyksIHR5cGU6IGV2ZW50LnR5cGV9fSk7XG4gICAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KHRoaXMubW91c2VFbnRlckV2ZW50KTtcbiAgICB9XG59IiwiaW1wb3J0IHtBZGRyZXNzfSBmcm9tIFwiLi4vYWRkcmVzcy9BZGRyZXNzXCI7XG5cbmRlY2xhcmUgdmFyIGdvb2dsZTogYW55O1xuXG5leHBvcnQgY2xhc3MgRGF0YVNlcnZpY2V7XG5cbiAgICBwcml2YXRlIHN0YXRpYyBfaW5zdGFuY2U6RGF0YVNlcnZpY2UgPSBuZXcgRGF0YVNlcnZpY2UoKTtcbiAgICBwcml2YXRlIGxlYWRJZDpzdHJpbmc7XG4gICAgcHJpdmF0ZSBfYWRkcmVzc2VzOkFkZHJlc3NbXSA9IFtdO1xuICAgIHB1YmxpYyBnZW9Db2Rlcjphbnk7XG4gICAgcHJpdmF0ZSBhcGlFbmRQb2ludDpzdHJpbmcgPSAnaHR0cHM6Ly9hcHAuaW8vYXBpL3YxL2xlYWQnO1xuXG4gICAgY29uc3RydWN0b3IoKXtcbiAgICAgICAgaWYoRGF0YVNlcnZpY2UuX2luc3RhbmNlKXtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yOiBJbnN0YW50aWF0aW9uIGZhaWxlZDogVXNlIERhdGFTZXJ2aWNlLmdldEluc3RhbmNlKCkgaW5zdGVhZCBvZiBuZXcuXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgRGF0YVNlcnZpY2UuX2luc3RhbmNlID0gdGhpcztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBzdGF0aWMgZ2V0SW5zdGFuY2UoKTpEYXRhU2VydmljZSB7XG4gICAgICAgIHJldHVybiBEYXRhU2VydmljZS5faW5zdGFuY2U7XG4gICAgfVxuXG4gICAgcHVibGljIGluaXQoKTp2b2lke1xuICAgICAgICB0aGlzLmdlb0NvZGVyID0gbmV3IGdvb2dsZS5tYXBzLkdlb2NvZGVyKCk7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdhZGRyZXNzOmFkZGVkJywgdGhpcy5hZGRBZGRyZXNzVG9Nb2RlbCk7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdhZGRyZXNzOmRlbGV0ZScsIHRoaXMucmVtb3ZlQWRkcmVzc0Zyb21Nb2RlbCk7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdhZGRyZXNzOmVkaXQnLCB0aGlzLmVkaXRBZGRyZXNzKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2FkZHJlc3M6c2V0UHJpbWFyeScsIHRoaXMuc2V0UHJpbWFyeUFkZHJlc3MpO1xuICAgICAgICBjb25zb2xlLmxvZygnJWMnLCAnYmFja2dyb3VuZDojZmZmOyBjb2xvcjojZmZmOyBwYWRkaW5nOjNweCcpO1xuICAgICAgICBjb25zb2xlLmxvZygnJWPKmOKAv8qYIFRoYW5rcyBmb3IgdmlzaXRpbmcgJiBjb25zaWRlcmluZyEg4oCUIEFtaXQgQXNoY2tlbmF6aScsICdiYWNrZ3JvdW5kOiMxRTkwRkY7IGNvbG9yOiNmZmY7IHBhZGRpbmc6M3B4Jyk7XG4gICAgICAgIGNvbnNvbGUubG9nKCclYycsICdiYWNrZ3JvdW5kOiNmZmY7IGNvbG9yOiNmZmY7IHBhZGRpbmc6M3B4Jyk7XG4gICAgfVxuXG4gICAgcHVibGljIGRlc3Ryb3koKTp2b2lke1xuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignYWRkcmVzczphZGRlZCcsIHRoaXMuYWRkQWRkcmVzc1RvTW9kZWwpO1xuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignYWRkcmVzczpkZWxldGUnLCB0aGlzLnJlbW92ZUFkZHJlc3NGcm9tTW9kZWwpO1xuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignYWRkcmVzczplZGl0JywgdGhpcy5lZGl0QWRkcmVzcyk7XG4gICAgICAgIGZvcihsZXQgaTpudW1iZXIgPSAwOyBpIDwgdGhpcy5hZGRyZXNzZXMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgdGhpcy5hZGRyZXNzZXNbaV0uZGVzdHJveSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHNldExlYWRJZChsZWFkSWQ6c3RyaW5nKXtcbiAgICAgICAgdGhpcy5sZWFkSWQgPSBsZWFkSWQ7XG4gICAgfVxuXG4gICAgcHVibGljIGdldEFkZHJlc3Nlc0ZvcklkKCk6dm9pZHtcbiAgICAgICAgLypcbiAgICAgICAgQE1FU1NBR0U6IEEgR0VUIHJlcXVlc3QgaXMgbWFkZSB0byB0aGUgQVBJLCBzaW11bGF0ZSBpdCB3aXRoIGRpc3BhdGNoaW5nIHRoaXMgZXZlbnQgd2l0aCB0aGUgcmVzdWx0XG4gICAgICAgICQuYWpheCh7dXJsIDogYCR7dGhpcy5hcGlFbmRQb2ludH0vJHt0aGlzLmxlYWRJZH1gIH0pXG4gICAgICAgICAgICAuZG9uZShmdW5jdGlvbihyZXN1bHQpeyBjb25zb2xlLmxvZyhyZXN1bHQpOyB9KVxuICAgICAgICAgICAgLmZhaWwoZnVuY3Rpb24oZXJyKXsgY29uc29sZS5sb2coZXJyKTsgfSk7XG4gICAgICAgICovXG4gICAgICAgIHZhciBkZW1vQWRkcmVzc2VzID0gWyB7XG4gICAgICAgICAgICBpZDogMSxcbiAgICAgICAgICAgIGFkZHJlc3NfMTogXCIxMjMgNXRoIEF2ZVwiLFxuICAgICAgICAgICAgYWRkcmVzc18yOiBcIlwiLFxuICAgICAgICAgICAgY2l0eTogXCJOZXcgWW9ya1wiLFxuICAgICAgICAgICAgY291bnRyeTogXCJVU0FcIixcbiAgICAgICAgICAgIHN0YXRlOiBcIk5ZXCIsXG4gICAgICAgICAgICB6aXBjb2RlOiAxMDAwMyxcbiAgICAgICAgICAgIGxhYmVsOiBcImJ1c2luZXNzXCIsXG4gICAgICAgICAgICBpc19wcmltYXJ5IDogdHJ1ZVxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBpZDogMixcbiAgICAgICAgICAgIGFkZHJlc3NfMTogXCI2MiA4dGggQXZlXCIsXG4gICAgICAgICAgICBhZGRyZXNzXzI6IFwiXCIsXG4gICAgICAgICAgICBjaXR5OiBcIk5ldyBZb3JrXCIsXG4gICAgICAgICAgICBjb3VudHJ5OiBcIlVTQVwiLFxuICAgICAgICAgICAgc3RhdGU6IFwiTllcIixcbiAgICAgICAgICAgIHppcGNvZGU6IDEwMDE0LFxuICAgICAgICAgICAgbGFiZWw6IFwiYnVzaW5lc3NcIixcbiAgICAgICAgICAgIGlzX3ByaW1hcnkgOiBmYWxzZVxuICAgICAgICB9XTtcblxuICAgICAgICAvL0BNRVNTQUdFOiB1bmNvbW1lbnQgdG8gc2VlIGhvdyB0aGUgY29tcG9uZW50IGxvYWQgd2l0aCAwIGFkZHJlc3Nlc1xuICAgICAgICAvL2RlbW9BZGRyZXNzZXMgPSBbXTtcblxuICAgICAgICBpZihkZW1vQWRkcmVzc2VzLmxlbmd0aCA+IDApe1xuICAgICAgICAgICAgbGV0IHByb21pc2VzOmFueSA9IFtdO1xuICAgICAgICAgICAgZm9yKGxldCBpOm51bWJlciA9IDA7IGkgPCBkZW1vQWRkcmVzc2VzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICBsZXQgYWRkcmVzczpBZGRyZXNzID0gbmV3IEFkZHJlc3MoZGVtb0FkZHJlc3Nlc1tpXSk7XG4gICAgICAgICAgICAgICAgYWRkcmVzcy5hZGRyZXNzVHlwZSA9IGRlbW9BZGRyZXNzZXNbaV0ubGFiZWw7XG4gICAgICAgICAgICAgICAgYWRkcmVzcy5pc1ByaW1hcnkgPSBkZW1vQWRkcmVzc2VzW2ldLmlzX3ByaW1hcnkgfHwgZmFsc2U7XG4gICAgICAgICAgICAgICAgYWRkcmVzcy5sZWFkSWQgPSB0aGlzLmxlYWRJZDtcblxuICAgICAgICAgICAgICAgIGxldCBhZGRyZXNzR2VvQ29kZVByb21pc2UgPVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdlb0NvZGVBZGRyZXNzKGFkZHJlc3MuZ2V0QWRkcmVzc1N0cmluZygpKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oKHJlc3VsdDphbnkpPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZHJlc3MuaWQgPSByZXN1bHRbMF0ucGxhY2VfaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkcmVzcy5teUdlb0NvZGUgPSByZXN1bHRbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRyZXNzZXMucHVzaChhZGRyZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2goKGVycjpFcnJvcik9PiB0aGlzLmxvZ0Vycm9yKGAke2Vycn0gLSBwcm9ibGVtIGdlb2NvZGluZyAke2FkZHJlc3MuZ2V0QWRkcmVzc1N0cmluZygpfWApKTtcblxuICAgICAgICAgICAgICAgIHByb21pc2VzLnB1c2goYWRkcmVzc0dlb0NvZGVQcm9taXNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKCB0aGlzLmRpc3BhdGNoQWRkcmVzc2VzRmV0Y2hlZEV2ZW50ICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmRpc3BhdGNoQWRkcmVzc2VzRmV0Y2hlZEV2ZW50KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGRpc3BhdGNoQWRkcmVzc2VzRmV0Y2hlZEV2ZW50ID0gKCkgPT4ge1xuICAgICAgICBsZXQgYWRkcmVzc2VzRmV0Y2hlZEV2ZW50OkN1c3RvbUV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCdhZGRyZXNzZXM6ZmV0Y2hlZCcsIHtkZXRhaWwgOiB0aGlzLmFkZHJlc3Nlc30pO1xuICAgICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChhZGRyZXNzZXNGZXRjaGVkRXZlbnQpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2VvQ29kZUFkZHJlc3MoYWRkcmVzczpzdHJpbmcpIHtcbiAgICAgICAgLy8gcmV0dXJuIGEgUHJvbWlzZVxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoXG4gICAgICAgICAgICAocmVzb2x2ZSxyZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmdlb0NvZGVyLmdlb2NvZGUoeydhZGRyZXNzJzogYWRkcmVzc30sXG4gICAgICAgICAgICAgICAgICAgIChyZXN1bHRzOmFueSwgc3RhdHVzOmFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXR1cyA9PSBnb29nbGUubWFwcy5HZW9jb2RlclN0YXR1cy5PSykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChzdGF0dXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBnZXQgYWRkcmVzc2VzKCk6QWRkcmVzc1tde1xuICAgICAgICByZXR1cm4gdGhpcy5fYWRkcmVzc2VzO1xuICAgIH1cblxuICAgIHNldCBhZGRyZXNzZXMoX2FkZHJlc3Nlcyl7XG4gICAgICAgIHRoaXMuX2FkZHJlc3NlcyA9IF9hZGRyZXNzZXM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhZGRBZGRyZXNzVG9Nb2RlbCA9IChldmVudDpDdXN0b21FdmVudCk6dm9pZCA9PiB7XG4gICAgICAgIGlmKGV2ZW50LmRldGFpbCAhPT0gbnVsbCAmJiBldmVudC5kZXRhaWwuaGFzT3duUHJvcGVydHkoJ3BsYWNlX2lkJykpe1xuICAgICAgICAgICAgbGV0IHBsYWNlOmFueSA9IGV2ZW50LmRldGFpbDtcbiAgICAgICAgICAgIGxldCBuZXdBZGRyZXNzRXhpc3RzOkJvb2xlYW4gPSBmYWxzZTtcbiAgICAgICAgICAgIGZvcihsZXQgaTpudW1iZXIgPSAwOyBpIDwgdGhpcy5hZGRyZXNzZXMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIGlmKHRoaXMuYWRkcmVzc2VzW2ldLmlkID09PSBwbGFjZS5wbGFjZV9pZCl7XG4gICAgICAgICAgICAgICAgICAgIG5ld0FkZHJlc3NFeGlzdHMgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKG5ld0FkZHJlc3NFeGlzdHMgPT09IGZhbHNlKXtcbiAgICAgICAgICAgICAgICBsZXQgYWRkcmVzczpBZGRyZXNzID0gbmV3IEFkZHJlc3MocGxhY2UpO1xuICAgICAgICAgICAgICAgIGFkZHJlc3MubXlHZW9Db2RlID0gcGxhY2U7XG4gICAgICAgICAgICAgICAgYWRkcmVzcy5pZCA9IHBsYWNlLnBsYWNlX2lkO1xuICAgICAgICAgICAgICAgIGFkZHJlc3MuYWRkcmVzc1R5cGUgPSBwbGFjZS5hZGRyZXNzVHlwZTtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZHJlc3Nlcy5wdXNoKGFkZHJlc3MpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU2VydmVyKCk7XG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICBsZXQgYWRkcmVzc0FkZGVkVG9Nb2RlbEV2ZW50OkN1c3RvbUV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCdhZGRyZXNzOmFkZGVkVG9Nb2RlbCcsIHtkZXRhaWw6IGFkZHJlc3N9KTtcbiAgICAgICAgICAgICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChhZGRyZXNzQWRkZWRUb01vZGVsRXZlbnQpO1xuXG4gICAgICAgICAgICAgICAgLy9ATUVTU0FHRTogVGhpcyBzaG91bGQgcmVhbGx5IGJlIGEgUHJvbWlzZSB3aGljaCBvbiBTdWNjZXNzIGRpc3BhdGNoZXMgdGhlIEV2ZW50LFxuICAgICAgICAgICAgICAgIC8vIGJ1dCBmb3IgdGhlIHNha2Ugb2YgdGhlIGRlbW8gYW5kIHNob3dpbmcgdGhlIGZsb3cgdGhlIGV2ZW50IGlzIGRpc3BhdGNoZWQgd2l0aG91dCB0aGUgc2VydmVyIHJlc3BvbnNlXG4gICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVNlcnZlclByb21pc2UoKVxuICAgICAgICAgICAgICAgICAgICAudGhlbigocmVzdWx0OmFueSk9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZHJlc3Nlcy5wdXNoKGFkZHJlc3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTZXJ2ZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBhZGRyZXNzQWRkZWRUb01vZGVsRXZlbnQ6Q3VzdG9tRXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoJ2FkZHJlc3M6YWRkZWRUb01vZGVsJywge2RldGFpbDogYWRkcmVzc30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQoYWRkcmVzc0FkZGVkVG9Nb2RlbEV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLmNhdGNoKChlcnI6RXJyb3IpPT4gdGhpcy5sb2dFcnJvcihgJHtlcnJ9IC0gcHJvYmxlbSBhZGRpbmcgYWRkcmVzcyAke2FkZHJlc3MuaWR9YCkpOyovXG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgcmVtb3ZlQWRkcmVzc0Zyb21Nb2RlbCA9IChldmVudDpDdXN0b21FdmVudCk6dm9pZCA9PiB7XG4gICAgICAgIGZvcihsZXQgaTpudW1iZXIgPSAwOyBpIDwgdGhpcy5hZGRyZXNzZXMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgaWYodGhpcy5hZGRyZXNzZXNbaV0uaWQgPT09IGV2ZW50LmRldGFpbC5pZCl7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRyZXNzZXNbaV0uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgIGxldCBhZGRyZXNzSWRUb1JlbW92ZTphbnkgPSB7IGlkOiB0aGlzLmFkZHJlc3Nlc1tpXS5pZCB9O1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkcmVzc2VzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICBsZXQgYWRkcmVzc1JlbW92ZWRGcm9tTW9kZWxFdmVudDpDdXN0b21FdmVudCA9IG5ldyBDdXN0b21FdmVudCgnYWRkcmVzczpyZW1vdmVkRnJvbU1vZGVsJywge2RldGFpbDogYWRkcmVzc0lkVG9SZW1vdmV9KTtcbiAgICAgICAgICAgICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChhZGRyZXNzUmVtb3ZlZEZyb21Nb2RlbEV2ZW50KTtcbiAgICAgICAgICAgICAgICAvL0BNRVNTQUdFOiBUaGlzIHNob3VsZCByZWFsbHkgYmUgYSBQcm9taXNlIHdoaWNoIG9uIFN1Y2Nlc3MgZGlzcGF0Y2hlcyB0aGUgRXZlbnQsXG4gICAgICAgICAgICAgICAgLy8gYnV0IGZvciB0aGUgc2FrZSBvZiB0aGUgZGVtbyBhbmQgc2hvd2luZyB0aGUgZmxvdyB0aGUgZXZlbnQgaXMgZGlzcGF0Y2hlZCB3aXRob3V0IHRoZSBzZXJ2ZXIgcmVzcG9uc2VcbiAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU2VydmVyUHJvbWlzZSgpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKChyZXN1bHQ6YW55KT0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkcmVzc2VzW2ldLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBhZGRyZXNzSWRUb1JlbW92ZTphbnkgPSB7IGlkOiB0aGlzLmFkZHJlc3Nlc1tpXS5pZCB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRyZXNzZXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGFkZHJlc3NSZW1vdmVkRnJvbU1vZGVsRXZlbnQ6Q3VzdG9tRXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoJ2FkZHJlc3M6cmVtb3ZlZEZyb21Nb2RlbCcsIHtkZXRhaWw6IGFkZHJlc3NJZFRvUmVtb3ZlfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChhZGRyZXNzUmVtb3ZlZEZyb21Nb2RlbEV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLmNhdGNoKChlcnI6RXJyb3IpPT4gdGhpcy5sb2dFcnJvcihgJHtlcnJ9IC0gcHJvYmxlbSByZW1vdmluZyBhZGRyZXNzICR7dGhpcy5hZGRyZXNzZXNbaV19YCkpOyovXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVTZXJ2ZXIoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNldFByaW1hcnlBZGRyZXNzID0gKGV2ZW50OkN1c3RvbUV2ZW50KTp2b2lkID0+IHtcbiAgICAgICAgZm9yKGxldCBpOm51bWJlciA9IDA7IGkgPCB0aGlzLmFkZHJlc3Nlcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICBpZih0aGlzLmFkZHJlc3Nlc1tpXS5pZCA9PT0gZXZlbnQuZGV0YWlsLmlkKXtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZHJlc3Nlc1tpXS5pc1ByaW1hcnkgPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZHJlc3Nlc1tpXS5pc1ByaW1hcnkgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnVwZGF0ZVNlcnZlcigpO1xuICAgIH1cbiAgICBcbiAgICBwcml2YXRlIGVkaXRBZGRyZXNzID0gKGV2ZW50OkN1c3RvbUV2ZW50KTp2b2lkID0+IHtcbiAgICAgICAgbGV0IGFkZHJlc3NHZW9Db2RlUHJvbWlzZTphbnkgPSB0aGlzLmdlb0NvZGVBZGRyZXNzKGV2ZW50LmRldGFpbC5uZXdBZGRyZXNzU3RyaW5nKVxuICAgICAgICAgICAgLnRoZW4oKHJlc3VsdDphbnkpPT4ge1xuICAgICAgICAgICAgICAgIGV2ZW50LmRldGFpbC5hZGRyZXNzLmlkID0gcmVzdWx0WzBdLnBsYWNlX2lkO1xuICAgICAgICAgICAgICAgIGV2ZW50LmRldGFpbC5hZGRyZXNzLmFkZHJlc3NEYXRhID0gcmVzdWx0WzBdO1xuICAgICAgICAgICAgICAgIGV2ZW50LmRldGFpbC5hZGRyZXNzLm15R2VvQ29kZSA9IHJlc3VsdFswXTtcbiAgICAgICAgICAgICAgICBldmVudC5kZXRhaWwuYWRkcmVzcy5hZGRyZXNzVHlwZSA9IGV2ZW50LmRldGFpbC5uZXdBZGRyZXNzVHlwZTtcbiAgICAgICAgICAgICAgICBsZXQgYWRkcmVzc0VkaXRBcHByb3ZlZEV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCdhZGRyZXNzOmVkaXRBcHByb3ZlZCcsXG4gICAgICAgICAgICAgICAgICAgIHsgZGV0YWlsIDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWRCZWZvcmVFZGl0IDogZXZlbnQuZGV0YWlsLmFkZHJlc3MuaWRCZWZvcmVFZGl0LFxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkcmVzcyA6IGV2ZW50LmRldGFpbC5hZGRyZXNzXG4gICAgICAgICAgICAgICAgICAgIH19KTtcbiAgICAgICAgICAgICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChhZGRyZXNzRWRpdEFwcHJvdmVkRXZlbnQpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU2VydmVyKCk7XG5cbiAgICAgICAgICAgICAgICAvL0BNRVNTQUdFOiBUaGlzIHNob3VsZCByZWFsbHkgYmUgYSBQcm9taXNlIHdoaWNoIG9uIFN1Y2Nlc3MgZGlzcGF0Y2hlcyB0aGUgRXZlbnQsXG4gICAgICAgICAgICAgICAgLy8gYnV0IGZvciB0aGUgc2FrZSBvZiB0aGUgZGVtbyBhbmQgc2hvd2luZyB0aGUgZmxvdyB0aGUgZXZlbnQgaXMgZGlzcGF0Y2hlZCB3aXRob3V0IHRoZSBzZXJ2ZXIgcmVzcG9uc2VcbiAgICAgICAgICAgICAgICAgLyp0aGlzLnVwZGF0ZVNlcnZlclByb21pc2UoKVxuICAgICAgICAgICAgICAgICAudGhlbigocmVzdWx0OmFueSk9PiB7XG4gICAgICAgICAgICAgICAgICAgICBsZXQgYWRkcmVzc0VkaXRBcHByb3ZlZEV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCdhZGRyZXNzOmVkaXRBcHByb3ZlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgeyBkZXRhaWwgOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkQmVmb3JlRWRpdCA6IGV2ZW50LmRldGFpbC5hZGRyZXNzLmlkQmVmb3JlRWRpdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkcmVzcyA6IGV2ZW50LmRldGFpbC5hZGRyZXNzXG4gICAgICAgICAgICAgICAgICAgICAgICAgfX0pO1xuICAgICAgICAgICAgICAgICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQoYWRkcmVzc0VkaXRBcHByb3ZlZEV2ZW50KTtcbiAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgLmNhdGNoKChlcnI6RXJyb3IpPT4gdGhpcy5sb2dFcnJvcihgJHtlcnJ9IC0gcHJvYmxlbSBhZGRpbmcgYWRkcmVzcyAke2FkZHJlc3MuaWR9YCkpOyovXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKChlcnI6RXJyb3IpID0+IGNvbnNvbGUubG9nKGVycikpO1xuICAgIH1cbiAgICBcbiAgICBwcml2YXRlIHVwZGF0ZVNlcnZlclByb21pc2UoKTphbnl7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShcbiAgICAgICAgICAgIChyZXNvbHZlOmFueSwgcmVqZWN0OmFueSkgPT4ge1xuICAgICAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgICAgICAgICAgICAgICAgIHVybDogYCR7dGhpcy5hcGlFbmRQb2ludH0vJHt0aGlzLmxlYWRJZH1gLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogdGhpcy5sZWFkSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRyZXNzZXM6IHRoaXMuYWRkcmVzc2VzXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5kb25lKChyZXN1bHQ6YW55KSA9PiB7IHJlc29sdmUocmVzdWx0KSB9KVxuICAgICAgICAgICAgICAgIC5mYWlsKChqcVhIUjphbnksIGVycjpzdHJpbmcpID0+IHsgcmVqZWN0KGpxWEhSKSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHVwZGF0ZVNlcnZlcigpOnZvaWR7XG4gICAgICAgIGNvbnNvbGUubG9nKGAlY3VwZGF0aW5nIGFkZHJlc3NlcyBvbiBzZXJ2ZXJgLCAnYmFja2dyb3VuZDojMDBGQTlBOyBjb2xvcjojZmZmOyBwYWRkaW5nOjJweCcpO1xuICAgICAgICBsZXQgYWpheFdpbGxTZW5kRXZlbnQ6Q3VzdG9tRXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoJ2FqYXg6d2lsbFNlbmQnKTtcbiAgICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQoYWpheFdpbGxTZW5kRXZlbnQpO1xuXG4gICAgICAgIGxldCBhamF4Q29uc2VxdWVuY2VzOnN0cmluZyA9ICdkb25lJyB8fCAnZmFpbCc7XG5cbiAgICAgICAgc2V0VGltZW91dCgoKT0+e1xuICAgICAgICAgICAgc3dpdGNoIChhamF4Q29uc2VxdWVuY2VzKXtcbiAgICAgICAgICAgICAgICBjYXNlICdkb25lJzpcbiAgICAgICAgICAgICAgICAgICAgbGV0IGFqYXhTdWNjZXNzRXZlbnQ6Q3VzdG9tRXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoJ2FqYXg6c3VjY2VzcycpO1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChhamF4U3VjY2Vzc0V2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnZmFpbCc6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nRXJyb3IoJ0FqYXggRmFpbGVkLi4uLiBlbmRwb2ludDogJHt0aGlzLmFwaUVuZFBvaW50fS8ke3RoaXMubGVhZElkfSwgbGVhZCBpZDogJHt0aGlzLmxlYWRJZH0nKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGFqYXhFcnJvckV2ZW50OkN1c3RvbUV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCdhamF4OmZhaWwnKTtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQoYWpheEVycm9yRXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMjAwMCk7XG5cbiAgICAgICAgLyokLmFqYXgoe1xuICAgICAgICAgICAgbWV0aG9kOiAnUFVUJyxcbiAgICAgICAgICAgIHVybDogYCR7dGhpcy5hcGlFbmRQb2ludH0vJHt0aGlzLmxlYWRJZH1gLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIGlkIDogdGhpcy5sZWFkSWQsXG4gICAgICAgICAgICAgICAgYWRkcmVzc2VzIDogdGhpcy5hZGRyZXNzZXNcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgLmRvbmUoKHJlc3VsdDphbnkpPT57XG4gICAgICAgICAgICAgICAgbGV0IGFqYXhTdWNjZXNzRXZlbnQ6Q3VzdG9tRXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoJ2FqYXg6c3VjY2VzcycpO1xuICAgICAgICAgICAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KGFqYXhTdWNjZXNzRXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICApXG4gICAgICAgIC5mYWlsKCgganFYSFI6YW55LCBlcnI6c3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2dFcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIGxldCBhamF4RXJyb3JFdmVudDpDdXN0b21FdmVudCA9IG5ldyBDdXN0b21FdmVudCgnYWpheDpmYWlsJyk7XG4gICAgICAgICAgICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQoYWpheEVycm9yRXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICApOyovXG4gICAgfTtcblxuICAgIHByaXZhdGUgbG9nRXJyb3IoZXJyOnN0cmluZyl7XG4gICAgICAgIGNvbnNvbGUubG9nKGAlYyR7ZXJyfWAsICdiYWNrZ3JvdW5kOiNCMjIyMjI7IGNvbG9yOiNmZmY7IHBhZGRpbmc6MnB4Jyk7XG4gICAgfVxufSIsImltcG9ydCB7QWRkcmVzc30gZnJvbSBcIi4uL2FkZHJlc3MvQWRkcmVzc1wiO1xuXG5kZWNsYXJlIHZhciBnb29nbGU6IGFueTtcblxuZXhwb3J0IGNsYXNzIE1hcENvbXBvbmVudCB7XG5cbiAgICBwcml2YXRlIG1hcDphbnk7XG4gICAgcHJpdmF0ZSBtYXBEaXY6SFRNTEVsZW1lbnQ7XG4gICAgcHJpdmF0ZSBtYXBFbGVtZW50SWQ6c3RyaW5nID0gJ2N0eC1tYXAnO1xuICAgIHByaXZhdGUgZ2VvbG9jYXRpb246YW55ID0ge2xhdDogMzcuNzc0OSwgbG5nOiAtMTIyLjQxOTR9O1xuICAgIHByaXZhdGUgbWF4Wm9vbTpudW1iZXIgPSAxMjsgLy9nb29nbGUgbWFwcyBhcGkgc2F5cyBpdCBsb29rcyBiZXR0ZXIgOylcbiAgICBwcml2YXRlIGF1dG9jb21wbGV0ZTphbnk7XG4gICAgcHJpdmF0ZSBhdXRvY29tcGxldGVFbGVtZW50SWQ6c3RyaW5nID0gJ2F1dG9jb21wbGV0ZSc7XG4gICAgcHJpdmF0ZSBsZWFkSWQ6c3RyaW5nO1xuICAgIHByaXZhdGUgYm91bmRzOmFueTtcbiAgICBwcml2YXRlIG1hcmtlcnM6YW55W10gPSBbXTtcbiAgICBwcml2YXRlIGluZm9XaW5kb3c6YW55O1xuICAgIHByaXZhdGUgaXNSZW1vdmluZ01hcmtlcjpib29sZWFuID0gZmFsc2U7XG5cbiAgICBjb25zdHJ1Y3RvcihsZWFkSWQ6c3RyaW5nKSB7XG4gICAgICAgIHRoaXMubGVhZElkID0gbGVhZElkO1xuICAgICAgICB0aGlzLmJvdW5kcyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmdCb3VuZHMoKTtcbiAgICAgICAgdGhpcy5pbmZvV2luZG93ID0gbmV3IGdvb2dsZS5tYXBzLkluZm9XaW5kb3coKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgaW5pdCgpOnZvaWQge1xuICAgICAgICB0aGlzLnNldHVwTWFwKCk7XG4gICAgICAgIHRoaXMuc2V0dXBBdXRvY29tcGxldGUoKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2FkZHJlc3NlczpmZXRjaGVkJywgdGhpcy5hZGRNYXJrZXJzKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2FkZHJlc3M6ZGVsZXRlJywgdGhpcy5yZW1vdmVNYXJrZXIpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYWRkcmVzczphZGRlZFRvTW9kZWwnLCB0aGlzLmFkZFNpbmdsZU1hcmtlcik7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdhZGRyZXNzOmVkaXRBcHByb3ZlZCcsIHRoaXMudXBkYXRlTWFya2VyKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMuZml0TWFwVG9NYXJrZXJzKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2FkZHJlc3M6bW91c2Vtb3ZlJywgdGhpcy5hbmltYXRlTWFya2VyICk7XG4gICAgfVxuXG4gICAgcHVibGljIGRlc3Ryb3koKTp2b2lke1xuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignYWRkcmVzc2VzOmZldGNoZWQnLCB0aGlzLmFkZE1hcmtlcnMpO1xuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignYWRkcmVzczpkZWxldGUnLCB0aGlzLnJlbW92ZU1hcmtlcik7XG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdhZGRyZXNzOmFkZGVkVG9Nb2RlbCcsIHRoaXMuYWRkU2luZ2xlTWFya2VyKTtcbiAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2FkZHJlc3M6ZWRpdEFwcHJvdmVkJywgdGhpcy51cGRhdGVNYXJrZXIpO1xuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5maXRNYXBUb01hcmtlcnMpO1xuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignYWRkcmVzczptb3VzZW1vdmUnLCB0aGlzLmFuaW1hdGVNYXJrZXIgKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNldHVwTWFwKCk6dm9pZCB7XG4gICAgICAgIHRoaXMubWFwRGl2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5tYXBFbGVtZW50SWQpO1xuICAgICAgICB0aGlzLm1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAodGhpcy5tYXBEaXYsIHtcbiAgICAgICAgICAgIGNlbnRlcjogdGhpcy5nZW9sb2NhdGlvbixcbiAgICAgICAgICAgIHpvb206IHRoaXMubWF4Wm9vbSxcbiAgICAgICAgICAgIG1hcFR5cGVDb250cm9sOiBmYWxzZSxcbiAgICAgICAgICAgIG1hcFR5cGVJZDogZ29vZ2xlLm1hcHMuTWFwVHlwZUlkLlJPQURNQVBcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXR1cEF1dG9jb21wbGV0ZSgpOnZvaWQge1xuICAgICAgICB0aGlzLmF1dG9jb21wbGV0ZSA9IG5ldyBnb29nbGUubWFwcy5wbGFjZXMuQXV0b2NvbXBsZXRlKFxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5hdXRvY29tcGxldGVFbGVtZW50SWQpLFxuICAgICAgICAgICAge3R5cGVzOiBbJ2dlb2NvZGUnXX1cbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5hdXRvY29tcGxldGUuYWRkTGlzdGVuZXIoJ3BsYWNlX2NoYW5nZWQnLCB0aGlzLmZpbGxJbkFkZHJlc3MpO1xuXG4gICAgICAgIGlmIChuYXZpZ2F0b3IuZ2VvbG9jYXRpb24pIHtcbiAgICAgICAgICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5nZXRDdXJyZW50UG9zaXRpb24oXG4gICAgICAgICAgICAgICAgKHBvc2l0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaXJjbGUgPSBuZXcgZ29vZ2xlLm1hcHMuQ2lyY2xlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNlbnRlcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhdDogcG9zaXRpb24uY29vcmRzLmxhdGl0dWRlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxuZzogcG9zaXRpb24uY29vcmRzLmxvbmdpdHVkZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhZGl1czogcG9zaXRpb24uY29vcmRzLmFjY3VyYWN5XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmF1dG9jb21wbGV0ZS5zZXRCb3VuZHMoY2lyY2xlLmdldEJvdW5kcygpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBmaWxsSW5BZGRyZXNzID0gKGV2ZW50OkN1c3RvbUV2ZW50KTp2b2lkID0+IHtcbiAgICAgICAgbGV0IGRhdGE6YW55ID0gdGhpcy5hdXRvY29tcGxldGUuZ2V0UGxhY2UoKTtcbiAgICAgICAgZGF0YS5hZGRyZXNzVHlwZSA9ICQoJyNjaW8tYWRkcmVzcy10eXBlJykudmFsKCk7XG4gICAgICAgIGlmKGRhdGEgIT09ICd1bmRlZmluZWQnKXtcbiAgICAgICAgICAgIHZhciBuZXdQbGFjZUV2ZW50OkN1c3RvbUV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCdhZGRyZXNzOmFkZGVkJywge2RldGFpbDogZGF0YX0pO1xuICAgICAgICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQobmV3UGxhY2VFdmVudCk7XG4gICAgICAgICAgICAoPEhUTUxJbnB1dEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5hdXRvY29tcGxldGVFbGVtZW50SWQpKS52YWx1ZSA9ICcnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy9uby1vcFxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdza2lwcGluZycpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhZGRNYXJrZXJzID0gKGV2ZW50OkN1c3RvbUV2ZW50KTp2b2lkID0+IHtcbiAgICAgICAgbGV0IGFkZHJlc3NlczpBZGRyZXNzW10gPSBldmVudC5kZXRhaWw7XG4gICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgYWRkcmVzc2VzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICBsZXQgcG9zOmFueSA9IGFkZHJlc3Nlc1tpXS5teUdlb0NvZGUuZ2VvbWV0cnkubG9jYXRpb247XG4gICAgICAgICAgICAgbGV0IG1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xuICAgICAgICAgICAgICAgICBwb3NpdGlvbjogcG9zLFxuICAgICAgICAgICAgICAgICBtYXA6IHRoaXMubWFwLFxuICAgICAgICAgICAgICAgICBtYXJrZXJJZCA6IGFkZHJlc3Nlc1tpXS5teUdlb0NvZGUucGxhY2VfaWQsXG4gICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogZ29vZ2xlLm1hcHMuQW5pbWF0aW9uLkRST1AsXG4gICAgICAgICAgICAgICAgIHRpdGxlOiBhZGRyZXNzZXNbaV0uYWRkcmVzc1R5cGVcbiAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICBtYXJrZXIuYWRkTGlzdGVuZXIoJ2NsaWNrJywgKGV2ZW50OkV2ZW50KTp2b2lkID0+IHtcbiAgICAgICAgICAgICAgICAgdGhpcy5pbmZvV2luZG93LnNldENvbnRlbnQoXG4gICAgICAgICAgICAgICAgICAgICB0aGlzLmdlbmVyYXRlTWFya2VySW5mb1dpbmRvd0h0bWwoXG4gICAgICAgICAgICAgICAgICAgICAgICAgYWRkcmVzc2VzW2ldLmFkZHJlc3NUeXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGFkZHJlc3Nlc1tpXS5nZXRHZW9Db2RlZEZvcm1hdHRlZEFkZHJlc3NTdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICBhZGRyZXNzZXNbaV0ubXlHZW9Db2RlLnBsYWNlX2lkXG4gICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgIHRoaXMuaW5mb1dpbmRvdy5vcGVuKHRoaXMubWFwLCBtYXJrZXIpO1xuICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgIHRoaXMubWFya2Vycy5wdXNoKG1hcmtlcik7XG4gICAgICAgICAgICAgdGhpcy5ib3VuZHMuZXh0ZW5kKHBvcyk7XG4gICAgICAgICB9XG4gICAgICAgICB0aGlzLmZpdE1hcFRvTWFya2VycygpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYWRkU2luZ2xlTWFya2VyID0gKGV2ZW50OkN1c3RvbUV2ZW50KTp2b2lkID0+IHtcbiAgICAgICAgbGV0IGFkZHJlc3M6QWRkcmVzcyA9IDxBZGRyZXNzPmV2ZW50LmRldGFpbDtcbiAgICAgICAgbGV0IHBvczphbnkgPSBhZGRyZXNzLm15R2VvQ29kZS5nZW9tZXRyeS5sb2NhdGlvbjtcbiAgICAgICAgbGV0IG1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xuICAgICAgICAgICAgcG9zaXRpb246IHBvcyxcbiAgICAgICAgICAgIG1hcDogdGhpcy5tYXAsXG4gICAgICAgICAgICBtYXJrZXJJZCA6IGFkZHJlc3MubXlHZW9Db2RlLnBsYWNlX2lkLFxuICAgICAgICAgICAgYW5pbWF0aW9uOiBnb29nbGUubWFwcy5BbmltYXRpb24uRFJPUCxcbiAgICAgICAgICAgIHRpdGxlOiBhZGRyZXNzLmFkZHJlc3NUeXBlXG4gICAgICAgIH0pO1xuICAgICAgICBtYXJrZXIuYWRkTGlzdGVuZXIoJ2NsaWNrJywgKGV2ZW50OkV2ZW50KTp2b2lkID0+IHtcbiAgICAgICAgICAgIHRoaXMuaW5mb1dpbmRvdy5zZXRDb250ZW50KFxuICAgICAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVNYXJrZXJJbmZvV2luZG93SHRtbChcbiAgICAgICAgICAgICAgICAgICAgYWRkcmVzcy5hZGRyZXNzVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgYWRkcmVzcy5nZXRHZW9Db2RlZEZvcm1hdHRlZEFkZHJlc3NTdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAgICAgYWRkcmVzcy5teUdlb0NvZGUucGxhY2VfaWRcbiAgICAgICAgICAgICAgICApKTtcbiAgICAgICAgICAgIHRoaXMuaW5mb1dpbmRvdy5vcGVuKHRoaXMubWFwLCBtYXJrZXIpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5tYXJrZXJzLnB1c2gobWFya2VyKTtcbiAgICAgICAgdGhpcy5ib3VuZHMuZXh0ZW5kKHBvcyk7XG4gICAgICAgIHRoaXMuZml0TWFwVG9NYXJrZXJzKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSAgZ2VuZXJhdGVNYXJrZXJJbmZvV2luZG93SHRtbChhZGRyZXNzVHlwZTpzdHJpbmcsIGFkZHJlc3NUZXh0OnN0cmluZywgaWQ6c3RyaW5nKTpzdHJpbmd7XG4gICAgICAgIGxldCBkYXRhSWQ6c3RyaW5nID0gYGRhdGEtaWQ9XCIke2lkfVwiYDtcbiAgICAgICAgbGV0IGRhdGFDb250ZXh0OnN0cmluZyA9IGBkYXRhLWNvbnRleHQ9XCIuY2lvLWluZm8td2luZG93XCJgO1xuICAgICAgICBsZXQgY29weUFjdGlvbjpzdHJpbmcgPSBgPGEgaHJlZj1cIiNcIiBjbGFzcz1cImNpby1hY3Rpb25cIiBkYXRhLWFjdGlvbj1cImNvcHlcIiAke2RhdGFDb250ZXh0fSBkYXRhLWNsaXBib2FyZC10ZXh0PVwiJHthZGRyZXNzVGV4dH1cIj5Db3B5PC9hPmA7XG4gICAgICAgIGxldCBhY3Rpb25CdXR0b25zOnN0cmluZyA9IGA8ZGl2ICR7ZGF0YUlkfSBjbGFzcz1cImNpby1pbmZvLXdpbmRvdy1hY3Rpb25zXCI+JHtjb3B5QWN0aW9ufTwvZGl2PmA7XG4gICAgICAgIHJldHVybiBgPGRpdiBjbGFzcz1cImNpby1pbmZvLXdpbmRvd1wiPjxzdHJvbmc+JHthZGRyZXNzVHlwZX08L3N0cm9uZz48ZGl2PiR7YWRkcmVzc1RleHR9PC9kaXY+JHthY3Rpb25CdXR0b25zfTxkaXY+YDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlbW92ZU1hcmtlciA9IChldmVudDpDdXN0b21FdmVudCk6dm9pZCA9PntcbiAgICAgICAgdGhpcy5ib3VuZHMgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nQm91bmRzKCk7XG4gICAgICAgIGZvcihsZXQgaTpudW1iZXIgPSAwOyBpIDwgdGhpcy5tYXJrZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5tYXJrZXJzW2ldLm1hcmtlcklkID09PSBldmVudC5kZXRhaWwucGxhY2UucGxhY2VfaWQpe1xuICAgICAgICAgICAgICAgIHRoaXMubWFya2Vyc1tpXS5zZXRNYXAobnVsbCk7XG4gICAgICAgICAgICAgICAgdGhpcy5tYXJrZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ib3VuZHMuZXh0ZW5kKHRoaXMubWFya2Vyc1tpXS5wb3NpdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5maXRNYXBUb01hcmtlcnMoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHVwZGF0ZU1hcmtlciA9IChldmVudDpDdXN0b21FdmVudCk6dm9pZCA9PiB7XG4gICAgICAgIGxldCBvbGRQbGFjZUlkOnN0cmluZyA9IGV2ZW50LmRldGFpbC5pZEJlZm9yZUVkaXQ7XG4gICAgICAgIHRoaXMuYm91bmRzID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZ0JvdW5kcygpO1xuICAgICAgICBmb3IobGV0IGk6bnVtYmVyID0gMDsgaSA8IHRoaXMubWFya2Vycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXMubWFya2Vyc1tpXS5tYXJrZXJJZCA9PT0gb2xkUGxhY2VJZCl7XG4gICAgICAgICAgICAgICAgLy9jcmVhdGUgYW5kIGFkZCBhIG5ldyBtYXJrZXIgZm9yIHRoZSBlZGl0ZWQgbG9jYXRpb25cbiAgICAgICAgICAgICAgICBsZXQgYWRkcmVzczpBZGRyZXNzID0gPEFkZHJlc3M+ZXZlbnQuZGV0YWlsLmFkZHJlc3M7XG4gICAgICAgICAgICAgICAgbGV0IHBvczphbnkgPSBhZGRyZXNzLm15R2VvQ29kZS5nZW9tZXRyeS5sb2NhdGlvbjtcbiAgICAgICAgICAgICAgICBsZXQgbWFya2VyID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcih7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBwb3MsXG4gICAgICAgICAgICAgICAgICAgIG1hcDogdGhpcy5tYXAsXG4gICAgICAgICAgICAgICAgICAgIG1hcmtlcklkIDogYWRkcmVzcy5teUdlb0NvZGUucGxhY2VfaWQsXG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogZ29vZ2xlLm1hcHMuQW5pbWF0aW9uLkRST1BcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAvL3JlbW92ZSB0aGUgb2xkIG1hcmtlclxuICAgICAgICAgICAgICAgIHRoaXMubWFya2Vyc1tpXS5zZXRNYXAobnVsbCk7XG4gICAgICAgICAgICAgICAgdGhpcy5tYXJrZXJzLnNwbGljZShpLCAxLCBtYXJrZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5ib3VuZHMuZXh0ZW5kKHRoaXMubWFya2Vyc1tpXS5wb3NpdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5maXRNYXBUb01hcmtlcnMoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFuaW1hdGVNYXJrZXIgPSAoZXZlbnQ6Q3VzdG9tRXZlbnQpID0+IHtcbiAgICAgICAgZm9yKGxldCBpOm51bWJlciA9IDA7IGkgPCB0aGlzLm1hcmtlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm1hcmtlcnNbaV0ubWFya2VySWQgPT09IGV2ZW50LmRldGFpbC5pZCkge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoZXZlbnQuZGV0YWlsLnR5cGUpe1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdtb3VzZWVudGVyJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWFya2Vyc1tpXS5zZXRBbmltYXRpb24oZ29vZ2xlLm1hcHMuQW5pbWF0aW9uLkJPVU5DRSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbW91c2VsZWF2ZSc6XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1hcmtlcnNbaV0uc2V0QW5pbWF0aW9uKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBmaXRNYXBUb01hcmtlcnMgPSAoZXZlbnQ6RXZlbnQgPSBudWxsKSA9PntcbiAgICAgICAgaWYodGhpcy5ib3VuZHMuaXNFbXB0eSgpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgdGhpcy5tYXAuZml0Qm91bmRzKHRoaXMuYm91bmRzKTtcbiAgICAgICAgICAgIGlmICh0aGlzLm1hcC5nZXRab29tKCkgPiB0aGlzLm1heFpvb20pIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1hcC5zZXRab29tKHRoaXMubWF4Wm9vbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59IiwiZXhwb3J0IGNsYXNzIEFqYXhJbmRpY2F0b3Ige1xuXG4gICAgcHJpdmF0ZSBlbGVtZW50OnN0cmluZyA9ICcuY3R4LWFqYXgtaW5kaWNhdG9yJztcblxuICAgIGNvbnN0cnVjdG9yKCl7fVxuICAgIFxuICAgIHB1YmxpYyBpbml0KCk6dm9pZHtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2FqYXg6d2lsbFNlbmQnLCB0aGlzLm9uV2lsbFNlbmQpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYWpheDpzdWNjZXNzJywgdGhpcy5vblN1Y2Nlc3MpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYWpheDpmYWlsJywgdGhpcy5vbkZhaWwpO1xuICAgIH1cblxuICAgIHB1YmxpYyBkZXN0cm95KCk6dm9pZHtcbiAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2FqYXg6d2lsbFNlbmQnLCB0aGlzLm9uV2lsbFNlbmQpO1xuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignYWpheDpzdWNjZXNzJywgdGhpcy5vblN1Y2Nlc3MpO1xuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignYWpheDpmYWlsJywgdGhpcy5vbkZhaWwpO1xuICAgIH1cblxuICAgIHByaXZhdGUgb25XaWxsU2VuZCA9IChldmVudDpDdXN0b21FdmVudCk6dm9pZCA9PiB7XG4gICAgICAgICQoYCR7dGhpcy5lbGVtZW50fWApLmF0dHIoJ2RhdGEtc3RhdHVzJywgJ3llbGxvdycpO1xuICAgICAgICAkKGAke3RoaXMuZWxlbWVudH1gKS50ZXh0KCdzZW5kaW5nJyk7XG4gICAgICAgIHRoaXMuZW1wdHlUZXh0TGFiZWwoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIG9uU3VjY2VzcyA9IChldmVudDpDdXN0b21FdmVudCk6dm9pZCA9PiB7XG4gICAgICAgICQoYCR7dGhpcy5lbGVtZW50fWApLmF0dHIoJ2RhdGEtc3RhdHVzJywgJ2dyZWVuJyk7XG4gICAgICAgICQoYCR7dGhpcy5lbGVtZW50fWApLnRleHQoJ3N1Y2Nlc3MhJyk7XG4gICAgICAgIHRoaXMuZW1wdHlUZXh0TGFiZWwoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIG9uRmFpbCA9IChldmVudDpDdXN0b21FdmVudCk6dm9pZCA9PiB7XG4gICAgICAgICQoYCR7dGhpcy5lbGVtZW50fWApLmF0dHIoJ2RhdGEtc3RhdHVzJywgJ3JlZCcpO1xuICAgICAgICAkKGAke3RoaXMuZWxlbWVudH1gKS50ZXh0KCdmYWlsZWQsIHRyeSBhZ2Fpbi4uJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBlbXB0eVRleHRMYWJlbCgpOnZvaWR7XG4gICAgICAgIHNldFRpbWVvdXQoKCk9PntcbiAgICAgICAgICAgICQoYCR7dGhpcy5lbGVtZW50fWApLmF0dHIoJ2RhdGEtc3RhdHVzJywgJycpO1xuICAgICAgICAgICAgJChgJHt0aGlzLmVsZW1lbnR9YCkudGV4dCgnJyk7XG4gICAgICAgIH0sIDE1MDApO1xuICAgIH1cbn0iLCJleHBvcnQgY2xhc3MgQ29waWVyIHtcblxuICAgIHByaXZhdGUgY2xpcGJvYXJkOkNsaXBib2FyZDtcblxuICAgIGNvbnN0cnVjdG9yKCl7fVxuICAgIFxuICAgIHB1YmxpYyBpbml0KCk6dm9pZHtcbiAgICAgICAgdGhpcy5jbGlwYm9hcmQgPSBuZXcgQ2xpcGJvYXJkKCdbZGF0YS1hY3Rpb249XCJjb3B5XCJdJyk7XG4gICAgICAgIHRoaXMuY2xpcGJvYXJkLm9uKCdzdWNjZXNzJywgdGhpcy5zaWduYWxDb3BpZWRJdGVtKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVzdHJveSgpOnZvaWR7XG4gICAgICAgIHRoaXMuY2xpcGJvYXJkLmRlc3Ryb3koKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNpZ25hbENvcGllZEl0ZW0oZXZlbnQ6YW55KXtcbiAgICAgICAgbGV0IHBhcmVudEVsZW1lbnQ6YW55O1xuICAgICAgICBsZXQgcGFyZW50Q2xhc3M6c3RyaW5nID0gJChldmVudC50cmlnZ2VyKS5kYXRhKCdjb250ZXh0Jyk7XG4gICAgICAgIHBhcmVudEVsZW1lbnQgPSAkKGV2ZW50LnRyaWdnZXIpLnBhcmVudHNVbnRpbChwYXJlbnRDbGFzcykucGFyZW50KCk7XG4gICAgICAgIHBhcmVudEVsZW1lbnQuYWRkQ2xhc3MoJ2N0eC1jb3BpZWQnKTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpeyAgcGFyZW50RWxlbWVudC5yZW1vdmVDbGFzcygnY3R4LWNvcGllZCcpIH0sIDE1MDApO1xuICAgICAgICBldmVudC5jbGVhclNlbGVjdGlvbigpO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBNYXBDb21wb25lbnQgfSBmcm9tICcuL2NvbnRleHRpdmUvbWFwL01hcENvbXBvbmVudCc7XG5pbXBvcnQgeyBBZGRyZXNzTGlzdCB9IGZyb20gJy4vY29udGV4dGl2ZS9hZGRyZXNzL0FkZHJlc3NMaXN0JztcbmltcG9ydCB7IERhdGFTZXJ2aWNlIH0gZnJvbSAnLi9jb250ZXh0aXZlL2RhdGEvRGF0YVNlcnZpY2UnO1xuaW1wb3J0IHsgQWpheEluZGljYXRvciB9IGZyb20gJy4vY29udGV4dGl2ZS91aS9BamF4SW5kaWNhdG9yJztcbmltcG9ydCB7IENvcGllciB9IGZyb20gJy4vY29udGV4dGl2ZS91aS9Db3BpZXInO1xuXG5jbGFzcyBNYWlue1xuXG4gICAgcHJpdmF0ZSBsZWFkSWQ6c3RyaW5nO1xuICAgIHByaXZhdGUgbWFwQ29tcG9uZW50Ok1hcENvbXBvbmVudDtcbiAgICBwcml2YXRlIGFkZHJlc3NMaXN0OkFkZHJlc3NMaXN0O1xuICAgIHByaXZhdGUgYWpheEluZGljYXRvcjpBamF4SW5kaWNhdG9yO1xuICAgIHByaXZhdGUgY29waWVyOkNvcGllcjtcbiAgICBwcml2YXRlIGRhdGFTZXJ2aWNlOkRhdGFTZXJ2aWNlO1xuXG4gICAgY29uc3RydWN0b3IobGVhZElkOnN0cmluZyl7XG4gICAgICAgIHRoaXMubGVhZElkID0gbGVhZElkO1xuICAgIH1cblxuICAgIHB1YmxpYyBpbml0KCk6dm9pZHtcbiAgICAgICAgdGhpcy5tYXBDb21wb25lbnQgPSBuZXcgTWFwQ29tcG9uZW50KHRoaXMubGVhZElkKTtcbiAgICAgICAgdGhpcy5tYXBDb21wb25lbnQuaW5pdCgpO1xuXG4gICAgICAgIHRoaXMuYWRkcmVzc0xpc3QgPSBuZXcgQWRkcmVzc0xpc3QodGhpcy5sZWFkSWQpO1xuICAgICAgICB0aGlzLmFkZHJlc3NMaXN0LmluaXQoKTtcblxuICAgICAgICB0aGlzLmFqYXhJbmRpY2F0b3IgPSBuZXcgQWpheEluZGljYXRvcigpO1xuICAgICAgICB0aGlzLmFqYXhJbmRpY2F0b3IuaW5pdCgpO1xuXG4gICAgICAgIHRoaXMuY29waWVyID0gbmV3IENvcGllcigpO1xuICAgICAgICB0aGlzLmNvcGllci5pbml0KCk7XG5cbiAgICAgICAgdGhpcy5kYXRhU2VydmljZSA9IERhdGFTZXJ2aWNlLmdldEluc3RhbmNlKCk7XG4gICAgICAgIHRoaXMuZGF0YVNlcnZpY2UuaW5pdCgpO1xuICAgICAgICB0aGlzLmRhdGFTZXJ2aWNlLnNldExlYWRJZCh0aGlzLmxlYWRJZCk7XG4gICAgICAgIHRoaXMuZGF0YVNlcnZpY2UuZ2V0QWRkcmVzc2VzRm9ySWQoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVzdHJveSgpOnZvaWR7XG4gICAgICAgIHRoaXMubWFwQ29tcG9uZW50LmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5hZGRyZXNzTGlzdC5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMuYWpheEluZGljYXRvci5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMuY29waWVyLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5kYXRhU2VydmljZS5kZXN0cm95KCk7XG4gICAgfVxufVxuXG4oPGFueT53aW5kb3cpLmdhcGlDYWxsYmFjayA9IGZ1bmN0aW9uKCl7XG4gICAgY29uc3QgbGVhZElkOnN0cmluZyA9ICdhYmMxMjM0NTY3ODkweHl6JztcbiAgICBsZXQgbWFpbjpNYWluID0gbmV3IE1haW4obGVhZElkKTtcbiAgICBtYWluLmluaXQoKTtcblxuICAgIC8vQE1FU1NBR0U6IHdoZW4gcmVtb3ZlZCwgdGhlIGRlc3Ryb3koKSBtZXRob2Qgc2hvdWxkIGJlIGludm9rZWQgLSB0aGlzIHJlbW92ZXMgZXZlbnRzXG4gICAgLy9tYWluLmRlc3Ryb3koKTtcbiAgICAvL1lvdSBjYW4gdXNlIHRoaXMgZGVsYXkgdG8gdGVzdCBpdCBvdXRcbiAgICAvL3NldFRpbWVvdXQoKCk9PnsgIG1haW4uZGVzdHJveSgpOyBjb25zb2xlLmxvZygnZGVzdHJveWVkIScpOyB9LCA1MDAwKTtcbn07Il19
