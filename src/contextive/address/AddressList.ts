/// <reference path="../../../typings/tsd.d.ts" />

import { DataService } from '../data/DataService';
import { Address } from './Address';

export class AddressList {

    private leadId:string;
    private listElementClass:string = 'ctx-address-list';
    private mouseEnterEvent:CustomEvent;
    private animationTime:number = 122;

    constructor(leadId:string) {
        this.leadId = leadId;
    }

    public init() {
        window.addEventListener('address:addedToModel', this.addAdress);
        window.addEventListener('address:removedFromModel', this.removeAddress);
        window.addEventListener('addresses:fetched', this.renderAddresses);
        $(`.${this.listElementClass}`).on('mouseenter', 'li', this.handleMouseOver);
        $(`.${this.listElementClass}`).on('mouseleave', 'li', this.handleMouseOver);
        $(`.${this.listElementClass}`).on('click', 'a', this.handleClicks);
        $(`.${this.listElementClass}`).on('change', 'input[type="radio"]', this.handlePrimaryChange);
    }

    public destroy():void {
        window.removeEventListener('address:addedToModel', this.addAdress);
        window.removeEventListener('address:removedFromModel', this.removeAddress);
        window.removeEventListener('addresses:fetched', this.renderAddresses);
        $(`.${this.listElementClass}`).off('mouseenter', 'li', this.handleMouseOver);
        $(`.${this.listElementClass}`).off('mouseleave', 'li', this.handleMouseOver);
        $(`.${this.listElementClass}`).off('click', 'a', this.handleClicks);
        $(`.${this.listElementClass}`).off('change', 'input[type="radio"]', this.handlePrimaryChange);
    }

    private addAdress = (event:CustomEvent):void => {
        this.handleZeroEntries();
        var addressesHtml:string = event.detail.getHtml();
        $(`.${this.listElementClass}`).append(addressesHtml);
    }

    private removeAddress = (event:CustomEvent):void => {
        this.handleZeroEntries();
        $(`.${this.listElementClass} li[data-id=${event.detail.id}]`).remove();
    }

    private renderAddresses = (event:CustomEvent):void => {
        this.handleZeroEntries();
        let addresses:Address[] = event.detail;
        let addressesHtml:string = '';
        for (let i = 0; i < addresses.length; i++) {
            addressesHtml += addresses[i].getHtml();
        }
        if (addressesHtml !== '') {
            $(`.${this.listElementClass}`).append(addressesHtml);
        }
    }

    private handleZeroEntries():void {
        $(`.ctx-location-indicator`).addClass('hide-indicator');
        if (DataService.getInstance().addresses.length > 0) {
            $(`.${this.listElementClass} .ctx-modal-0-entries`).slideUp(this.animationTime);
            $(`.${this.listElementClass} .ctx-modal-0-entries-message`).hide(this.animationTime);
        } else {
            $(`.${this.listElementClass} .ctx-location-indicator`).addClass('hide-indicator');
            $(`.${this.listElementClass} .ctx-modal-0-entries`).slideDown(this.animationTime);
            $(`.${this.listElementClass} .ctx-modal-0-entries-message`).show(this.animationTime);
        }
    }

    private handleClicks = (event:any):void => {
        let actionableAddress:Address = this.getActionableAddress(event.currentTarget.dataset.id);
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
                if(deleteConfirmation === true){
                    actionableAddress.freezeActions();
                    let payload:any = {
                        id: event.currentTarget.dataset.id,
                        action: event.currentTarget.dataset.action,
                        place: actionableAddress.myGeoCode
                    };
                    let addressDeleteEvent = new CustomEvent('address:delete', {detail: payload});
                    window.dispatchEvent(addressDeleteEvent);
                }
                break;
            default:
                //no-op
                break;
        }
        event.preventDefault();
    }

    private handlePrimaryChange = (event:any):void => {
        let actionableAddress:Address = this.getActionableAddress(event.currentTarget.dataset.id);
        let payload:any = {
            id: event.currentTarget.dataset.id
        };
        let setPrimaryAddressEvent = new CustomEvent('address:setPrimary', {detail : payload});
        window.dispatchEvent(setPrimaryAddressEvent);
    }

    private getActionableAddress(id:string):Address{
        for (let i:number = 0; i < DataService.getInstance().addresses.length; i++) {
            if (DataService.getInstance().addresses[i].id === id) {
                return <Address>DataService.getInstance().addresses[i];
            }
        }
    }

    private handleMouseOver = (event:Event):void => {
        this.mouseEnterEvent = new CustomEvent('address:mousemove',
            {detail: {id: $(event.currentTarget).attr('data-id'), type: event.type}});
        window.dispatchEvent(this.mouseEnterEvent);
    }
}