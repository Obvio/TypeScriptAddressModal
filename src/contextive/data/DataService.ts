import {Address} from "../address/Address";

declare var google: any;

export class DataService{

    private static _instance:DataService = new DataService();
    private leadId:string;
    private _addresses:Address[] = [];
    public geoCoder:any;
    private apiEndPoint:string = 'https://app.io/api/v1/lead';

    constructor(){
        if(DataService._instance){
            throw new Error("Error: Instantiation failed: Use DataService.getInstance() instead of new.");
        } else {
            DataService._instance = this;
        }
    }

    public static getInstance():DataService {
        return DataService._instance;
    }

    public init():void{
        this.geoCoder = new google.maps.Geocoder();
        window.addEventListener('address:added', this.addAddressToModel);
        window.addEventListener('address:delete', this.removeAddressFromModel);
        window.addEventListener('address:edit', this.editAddress);
        window.addEventListener('address:setPrimary', this.setPrimaryAddress);
        console.log('%c', 'background:#fff; color:#fff; padding:3px');
        console.log('%cʘ‿ʘ Thanks for visiting & considering! — Amit Ashckenazi', 'background:#1E90FF; color:#fff; padding:3px');
        console.log('%c', 'background:#fff; color:#fff; padding:3px');
    }

    public destroy():void{
        window.removeEventListener('address:added', this.addAddressToModel);
        window.removeEventListener('address:delete', this.removeAddressFromModel);
        window.removeEventListener('address:edit', this.editAddress);
        for(let i:number = 0; i < this.addresses.length; i++){
            this.addresses[i].destroy();
        }
    }

    public setLeadId(leadId:string){
        this.leadId = leadId;
    }

    public getAddressesForId():void{
        /*
        @MESSAGE: A GET request is made to the API, simulate it with dispatching this event with the result
        $.ajax({url : `${this.apiEndPoint}/${this.leadId}` })
            .done(function(result){ console.log(result); })
            .fail(function(err){ console.log(err); });
        */
        var demoAddresses = [ {
            id: 1,
            address_1: "123 5th Ave",
            address_2: "",
            city: "New York",
            country: "USA",
            state: "NY",
            zipcode: 10003,
            label: "business",
            is_primary : true
        }, {
            id: 2,
            address_1: "62 8th Ave",
            address_2: "",
            city: "New York",
            country: "USA",
            state: "NY",
            zipcode: 10014,
            label: "business",
            is_primary : false
        }];

        //@MESSAGE: uncomment to see how the component load with 0 addresses
        //demoAddresses = [];

        if(demoAddresses.length > 0){
            let promises:any = [];
            for(let i:number = 0; i < demoAddresses.length; i++){
                let address:Address = new Address(demoAddresses[i]);
                address.addressType = demoAddresses[i].label;
                address.isPrimary = demoAddresses[i].is_primary || false;
                address.leadId = this.leadId;

                let addressGeoCodePromise =
                    this.geoCodeAddress(address.getAddressString())
                        .then((result:any)=> {
                            address.id = result[0].place_id;
                            address.myGeoCode = result[0];
                            this.addresses.push(address);
                        })
                        .catch((err:Error)=> this.logError(`${err} - problem geocoding ${address.getAddressString()}`));

                promises.push(addressGeoCodePromise);
            }
            Promise.all(promises).then( this.dispatchAddressesFetchedEvent );
        } else {
            this.dispatchAddressesFetchedEvent();
        }
    }

    private dispatchAddressesFetchedEvent = () => {
        let addressesFetchedEvent:CustomEvent = new CustomEvent('addresses:fetched', {detail : this.addresses});
        window.dispatchEvent(addressesFetchedEvent);
    }

    private geoCodeAddress(address:string) {
        // return a Promise
        return new Promise(
            (resolve,reject) => {
                this.geoCoder.geocode({'address': address},
                    (results:any, status:any) => {
                        if (status == google.maps.GeocoderStatus.OK) {
                            resolve(results);
                        } else {
                            reject(status);
                        }
                    }
                );
            }
        );
    }

    get addresses():Address[]{
        return this._addresses;
    }

    set addresses(_addresses){
        this._addresses = _addresses;
    }

    private addAddressToModel = (event:CustomEvent):void => {
        if(event.detail !== null && event.detail.hasOwnProperty('place_id')){
            let place:any = event.detail;
            let newAddressExists:Boolean = false;
            for(let i:number = 0; i < this.addresses.length; i++){
                if(this.addresses[i].id === place.place_id){
                    newAddressExists = true;
                }
            }
            if(newAddressExists === false){
                let address:Address = new Address(place);
                address.myGeoCode = place;
                address.id = place.place_id;
                address.addressType = place.addressType;
                this.addresses.push(address);
                this.updateServer();
                //
                let addressAddedToModelEvent:CustomEvent = new CustomEvent('address:addedToModel', {detail: address});
                window.dispatchEvent(addressAddedToModelEvent);

                //@MESSAGE: This should really be a Promise which on Success dispatches the Event,
                // but for the sake of the demo and showing the flow the event is dispatched without the server response
                /*
                this.updateServerPromise()
                    .then((result:any)=> {
                        this.addresses.push(address);
                        this.updateServer();
                        let addressAddedToModelEvent:CustomEvent = new CustomEvent('address:addedToModel', {detail: address});
                        window.dispatchEvent(addressAddedToModelEvent);
                    })
                    .catch((err:Error)=> this.logError(`${err} - problem adding address ${address.id}`));*/

            }
        }
    }

    private removeAddressFromModel = (event:CustomEvent):void => {
        for(let i:number = 0; i < this.addresses.length; i++){
            if(this.addresses[i].id === event.detail.id){
                this.addresses[i].destroy();
                let addressIdToRemove:any = { id: this.addresses[i].id };
                this.addresses.splice(i, 1);
                let addressRemovedFromModelEvent:CustomEvent = new CustomEvent('address:removedFromModel', {detail: addressIdToRemove});
                window.dispatchEvent(addressRemovedFromModelEvent);
                //@MESSAGE: This should really be a Promise which on Success dispatches the Event,
                // but for the sake of the demo and showing the flow the event is dispatched without the server response
                /*
                this.updateServerPromise()
                    .then((result:any)=> {
                        this.addresses[i].destroy();
                        let addressIdToRemove:any = { id: this.addresses[i].id };
                        this.addresses.splice(i, 1);
                        let addressRemovedFromModelEvent:CustomEvent = new CustomEvent('address:removedFromModel', {detail: addressIdToRemove});
                        window.dispatchEvent(addressRemovedFromModelEvent);
                    })
                    .catch((err:Error)=> this.logError(`${err} - problem removing address ${this.addresses[i]}`));*/
            }
        }
        this.updateServer();
    }

    private setPrimaryAddress = (event:CustomEvent):void => {
        for(let i:number = 0; i < this.addresses.length; i++){
            if(this.addresses[i].id === event.detail.id){
                this.addresses[i].isPrimary = true;
            } else {
                this.addresses[i].isPrimary = false;
            }
        }
        this.updateServer();
    }
    
    private editAddress = (event:CustomEvent):void => {
        let addressGeoCodePromise:any = this.geoCodeAddress(event.detail.newAddressString)
            .then((result:any)=> {
                event.detail.address.id = result[0].place_id;
                event.detail.address.addressData = result[0];
                event.detail.address.myGeoCode = result[0];
                event.detail.address.addressType = event.detail.newAddressType;
                let addressEditApprovedEvent = new CustomEvent('address:editApproved',
                    { detail : {
                        idBeforeEdit : event.detail.address.idBeforeEdit,
                        address : event.detail.address
                    }});
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
            })
            .catch((err:Error) => console.log(err));
    }
    
    private updateServerPromise():any{
        return new Promise(
            (resolve:any, reject:any) => {
                $.ajax({
                    method: 'PUT',
                    url: `${this.apiEndPoint}/${this.leadId}`,
                    data: {
                        id: this.leadId,
                        addresses: this.addresses
                    }
                })
                .done((result:any) => { resolve(result) })
                .fail((jqXHR:any, err:string) => { reject(jqXHR) });
            }
        );
    }

    private updateServer():void{
        console.log(`%cupdating addresses on server`, 'background:#00FA9A; color:#fff; padding:2px');
        let ajaxWillSendEvent:CustomEvent = new CustomEvent('ajax:willSend');
        window.dispatchEvent(ajaxWillSendEvent);

        let ajaxConsequences:string = 'done' || 'fail';

        setTimeout(()=>{
            switch (ajaxConsequences){
                case 'done':
                    let ajaxSuccessEvent:CustomEvent = new CustomEvent('ajax:success');
                    window.dispatchEvent(ajaxSuccessEvent);
                    break;
                case 'fail':
                    this.logError('Ajax Failed.... endpoint: ${this.apiEndPoint}/${this.leadId}, lead id: ${this.leadId}');
                    let ajaxErrorEvent:CustomEvent = new CustomEvent('ajax:fail');
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
    };

    private logError(err:string){
        console.log(`%c${err}`, 'background:#B22222; color:#fff; padding:2px');
    }
}