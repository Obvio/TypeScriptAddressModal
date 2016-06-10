/// <reference path="../../../typings/tsd.d.ts" />
import { DataService } from '../data/DataService';
export class AddressList {
    constructor(leadId) {
        this.listElementClass = 'ctx-address-list';
        this.animationTime = 122;
        this.addAdress = (event) => {
            this.handleZeroEntries();
            var addressesHtml = event.detail.getHtml();
            $(`.${this.listElementClass}`).append(addressesHtml);
        };
        this.removeAddress = (event) => {
            this.handleZeroEntries();
            $(`.${this.listElementClass} li[data-id=${event.detail.id}]`).remove();
        };
        this.renderAddresses = (event) => {
            this.handleZeroEntries();
            let addresses = event.detail;
            let addressesHtml = '';
            for (let i = 0; i < addresses.length; i++) {
                addressesHtml += addresses[i].getHtml();
            }
            if (addressesHtml !== '') {
                $(`.${this.listElementClass}`).append(addressesHtml);
            }
        };
        this.handleClicks = (event) => {
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
        this.handlePrimaryChange = (event) => {
            let actionableAddress = this.getActionableAddress(event.currentTarget.dataset.id);
            let payload = {
                id: event.currentTarget.dataset.id
            };
            let setPrimaryAddressEvent = new CustomEvent('address:setPrimary', { detail: payload });
            window.dispatchEvent(setPrimaryAddressEvent);
        };
        this.handleMouseOver = (event) => {
            this.mouseEnterEvent = new CustomEvent('address:mousemove', { detail: { id: $(event.currentTarget).attr('data-id'), type: event.type } });
            window.dispatchEvent(this.mouseEnterEvent);
        };
        this.leadId = leadId;
    }
    init() {
        window.addEventListener('address:addedToModel', this.addAdress);
        window.addEventListener('address:removedFromModel', this.removeAddress);
        window.addEventListener('addresses:fetched', this.renderAddresses);
        $(`.${this.listElementClass}`).on('mouseenter', 'li', this.handleMouseOver);
        $(`.${this.listElementClass}`).on('mouseleave', 'li', this.handleMouseOver);
        $(`.${this.listElementClass}`).on('click', 'a', this.handleClicks);
        $(`.${this.listElementClass}`).on('change', 'input[type="radio"]', this.handlePrimaryChange);
    }
    destroy() {
        window.removeEventListener('address:addedToModel', this.addAdress);
        window.removeEventListener('address:removedFromModel', this.removeAddress);
        window.removeEventListener('addresses:fetched', this.renderAddresses);
        $(`.${this.listElementClass}`).off('mouseenter', 'li', this.handleMouseOver);
        $(`.${this.listElementClass}`).off('mouseleave', 'li', this.handleMouseOver);
        $(`.${this.listElementClass}`).off('click', 'a', this.handleClicks);
        $(`.${this.listElementClass}`).off('change', 'input[type="radio"]', this.handlePrimaryChange);
    }
    handleZeroEntries() {
        $(`.ctx-location-indicator`).addClass('hide-indicator');
        if (DataService.getInstance().addresses.length > 0) {
            $(`.${this.listElementClass} .ctx-modal-0-entries`).slideUp(this.animationTime);
            $(`.${this.listElementClass} .ctx-modal-0-entries-message`).hide(this.animationTime);
        }
        else {
            $(`.${this.listElementClass} .ctx-location-indicator`).addClass('hide-indicator');
            $(`.${this.listElementClass} .ctx-modal-0-entries`).slideDown(this.animationTime);
            $(`.${this.listElementClass} .ctx-modal-0-entries-message`).show(this.animationTime);
        }
    }
    getActionableAddress(id) {
        for (let i = 0; i < DataService.getInstance().addresses.length; i++) {
            if (DataService.getInstance().addresses[i].id === id) {
                return DataService.getInstance().addresses[i];
            }
        }
    }
}
