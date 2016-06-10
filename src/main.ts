import { MapComponent } from './contextive/map/MapComponent';
import { AddressList } from './contextive/address/AddressList';
import { DataService } from './contextive/data/DataService';
import { AjaxIndicator } from './contextive/ui/AjaxIndicator';
import { Copier } from './contextive/ui/Copier';

class Main{

    private leadId:string;
    private mapComponent:MapComponent;
    private addressList:AddressList;
    private ajaxIndicator:AjaxIndicator;
    private copier:Copier;
    private dataService:DataService;

    constructor(leadId:string){
        this.leadId = leadId;
    }

    public init():void{
        this.mapComponent = new MapComponent(this.leadId);
        this.mapComponent.init();

        this.addressList = new AddressList(this.leadId);
        this.addressList.init();

        this.ajaxIndicator = new AjaxIndicator();
        this.ajaxIndicator.init();

        this.copier = new Copier();
        this.copier.init();

        this.dataService = DataService.getInstance();
        this.dataService.init();
        this.dataService.setLeadId(this.leadId);
        this.dataService.getAddressesForId();
    }

    public destroy():void{
        this.mapComponent.destroy();
        this.addressList.destroy();
        this.ajaxIndicator.destroy();
        this.copier.destroy();
        this.dataService.destroy();
    }
}

(<any>window).gapiCallback = function(){
    const leadId:string = 'abc1234567890xyz';
    let main:Main = new Main(leadId);
    main.init();

    //@MESSAGE: when removed, the destroy() method should be invoked - this removes events
    //main.destroy();
    //You can use this delay to test it out
    //setTimeout(()=>{  main.destroy(); console.log('destroyed!'); }, 5000);
};