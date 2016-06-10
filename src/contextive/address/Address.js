export class Address {
    constructor(addressData) {
        this.myGeoCode = {};
        this.isPrimary = false;
        this.isBeingEdited = false;
        this.handleEditApproved = (event) => {
            if (this.idBeforeEdit === event.detail.idBeforeEdit) {
                $(`[data-id=${this.idBeforeEdit}] .ctx-address-type-label`).text(this.addressType);
                $(`[data-id="${this.idBeforeEdit}"]`).attr('data-id', this.id);
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
        let addressTypeLabel = `<strong class="ctx-address-type-label">${this.addressType}</strong>`;
        let editableAddress = this.getSplitGeoCodedFormattedAddressForEdit();
        let dataId = `data-id="${this.id}"`;
        let dataContext = `data-context=".ctx-address-item"`;
        let editAction = `<a href="#" class="ctx-action" data-action="edit" ${dataId} ${dataContext}>Edit</a>`;
        let cancelEditAction = `<a href="#" class="ctx-action ctx-hidden-action" data-action="cancel" ${dataId} ${dataContext}>Cancel</a>`;
        let approveEditAction = `<a href="#" class="ctx-action ctx-hidden-action" data-action="approve" ${dataId} ${dataContext}>OK</a>`;
        let copyAction = `<a href="#" class="ctx-action" data-action="copy" data-clipboard-text="${addressString}" ${dataContext}>Copy</a>`;
        let deleteAction = `<a href="#" class="ctx-action" data-action="delete" ${dataId} ${dataContext}>Delete</a>`;
        let isChecked = this.isPrimary ? 'checked' : '';
        let primaryRadio = `<label for="radio-${this.id}">` +
            `<input type="radio" name="${this.leadId}" value="${this.isPrimary}" id="radio-${this.id}" ${dataId} ${isChecked}>Primary</label>`;
        return `<li class="ctx-address-item" ${dataId}>` +
            `<div class="ctx-address-title-and-primary">${addressTypeLabel} ${primaryRadio}</div>` +
            `<div class="ctx-address-type-selector">${this.generateAddressTypeSelect()}</div>` +
            `<div class="ctx-editable-address-string">${editableAddress}</div>` +
            `<div class="ctx-item-actions">${approveEditAction}${cancelEditAction}${editAction}${copyAction}${deleteAction}</div></li>`;
    }
    setEditable() {
        this.isBeingEdited = true;
        this.idBeforeEdit = this.id;
        $(`li[data-id=${this.id}]`).addClass('ctx-address-is-being-edited');
        $(`[data-id=${this.id}] .ctx-editable-address-string span`).attr('contenteditable', 'true');
        $(`[data-id=${this.id}] .ctx-editable-address-string span`).on('focus', function (event) {
            let range = document.createRange();
            range.selectNodeContents(event.currentTarget);
            let sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        });
        $(`[data-id=${this.id}] .ctx-editable-address-string span:first-child`).focus();
        $(`[data-id=${this.id}] select`).removeAttr('disabled');
        //action buttons
        $('[data-action="approve"], [data-action="cancel"]', `[data-id=${this.id}]`).removeClass('ctx-hidden-action');
        $('[data-action="edit"]', `[data-id=${this.id}]`).addClass('ctx-hidden-action');
    }
    cancelEditable(resetAddressString = true) {
        $(`li[data-id=${this.id}]`).removeClass('ctx-address-is-being-edited');
        $(`[data-id=${this.id}] .ctx-editable-address-string span`).attr('contenteditable', 'false');
        if (resetAddressString) {
            $(`[data-id=${this.id}] .ctx-editable-address-string`).find('span').remove();
            $(`[data-id=${this.id}] .ctx-editable-address-string`).prepend(this.getSplitGeoCodedFormattedAddressForEdit());
        }
        $(`[data-id=${this.id}] select`).attr('disabled', 'disabled');
        //action buttons
        $('[data-action="approve"], [data-action="cancel"]', `[data-id=${this.id}]`).addClass('ctx-hidden-action');
        $('[data-action="edit"]', `[data-id=${this.id}]`).removeClass('ctx-hidden-action');
        this.isBeingEdited = false;
    }
    sendToApproveEdit() {
        this.cancelEditable(false);
        let newAddressString = $(`[data-id=${this.idBeforeEdit}] .ctx-editable-address-string span`).text();
        let payload = {
            id: this.id,
            idBeforeEdit: this.idBeforeEdit,
            newAddressString: newAddressString,
            address: this,
            newAddressType: $(`[data-id=${this.id}] select`).val()
        };
        let addressEditEvent = new CustomEvent('address:edit', { detail: payload });
        window.dispatchEvent(addressEditEvent);
    }
    freezeActions() {
        this.isBeingEdited = true;
        this.idBeforeEdit = this.id;
        $(`li[data-id=${this.id}] .ctx-item-actions`).addClass('ctx-item-actions-disabled');
        $(`li[data-id=${this.id}] .ctx-item-actions a`).attr('disabled', 'disabled');
        $(`li[data-id=${this.id}] select`).attr('disabled', 'disabled');
    }
    getGeoCodedFormattedAddressString() {
        return this.myGeoCode.formatted_address;
    }
    getSplitGeoCodedFormattedAddressForEdit() {
        let addressFragments = this.myGeoCode.formatted_address.split(',');
        let editableAddress = '';
        for (let i = 0; i < addressFragments.length; i++) {
            editableAddress += `<span class="ctx-address-fragment" contenteditable="false">${addressFragments[i].trim()}`;
            if (i < addressFragments.length - 1) {
                editableAddress += ', ';
            }
            editableAddress += `</span>`;
        }
        return editableAddress;
    }
    generateAddressTypeSelect() {
        return `<select name="" data-id="${this.id}" disabled="disabled" class="ctx-select">` +
            `<option value="business" ${this.addressType == 'business' ? 'selected' : ''}>Business</option>` +
            `<option value="mailing" ${this.addressType == 'mailing' ? 'selected' : ''}>Mailing</option>` +
            `<option value="other" ${this.addressType == 'other' ? 'selected' : ''}>Other</option>` +
            `</select>`;
    }
    /*
    * Legacy address string
    * */
    getAddressString() {
        return this.addressData.address_1 + ', ' +
            this.addressData.address_2 + ', ' +
            this.addressData.city + ' ' +
            this.addressData.zipcode + ', ' +
            this.addressData.state + ', ' +
            this.addressData.country;
    }
}
