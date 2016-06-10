export class Address{

    public addressData:any;
    public id:string;
    public myGeoCode:any = {};
    public addressType:string;
    public isPrimary:boolean = false;
    public leadId:string;
    private isBeingEdited:boolean = false;
    private idBeforeEdit:string;

    constructor(addressData:any){
        this.addressData = addressData;
        this.init();
    }

    public init():void{
        window.addEventListener('address:editApproved', this.handleEditApproved);
    }

    public destroy():void{
        window.removeEventListener('address:editApproved', this.handleEditApproved);
    }

    public getHtml():string{
        let addressString:string = this.getGeoCodedFormattedAddressString();
        let addressTypeLabel:string = `<strong class="ctx-address-type-label">${this.addressType}</strong>`;
        let editableAddress:string = this.getSplitGeoCodedFormattedAddressForEdit();
        let dataId:string = `data-id="${this.id}"`;
        let dataContext:string = `data-context=".ctx-address-item"`;
        let editAction:string = `<a href="#" class="ctx-action" data-action="edit" ${dataId} ${dataContext}>Edit</a>`;
        let cancelEditAction:string = `<a href="#" class="ctx-action ctx-hidden-action" data-action="cancel" ${dataId} ${dataContext}>Cancel</a>`;
        let approveEditAction:string = `<a href="#" class="ctx-action ctx-hidden-action" data-action="approve" ${dataId} ${dataContext}>OK</a>`;
        let copyAction:string = `<a href="#" class="ctx-action" data-action="copy" data-clipboard-text="${addressString}" ${dataContext}>Copy</a>`;
        let deleteAction:string = `<a href="#" class="ctx-action" data-action="delete" ${dataId} ${dataContext}>Delete</a>`;
        let isChecked:string = this.isPrimary ? 'checked' : '';
        let primaryRadio:string = `<label for="radio-${this.id}">`+
            `<input type="radio" name="${this.leadId}" value="${this.isPrimary}" id="radio-${this.id}" ${dataId} ${isChecked}>Primary</label>`;

        return `<li class="ctx-address-item" ${dataId}>` +
               `<div class="ctx-address-title-and-primary">${addressTypeLabel} ${primaryRadio}</div>` +
               `<div class="ctx-address-type-selector">${this.generateAddressTypeSelect()}</div>` +
               `<div class="ctx-editable-address-string">${editableAddress}</div>` +
               `<div class="ctx-item-actions">${approveEditAction}${cancelEditAction}${editAction}${copyAction}${deleteAction}</div></li>`;
    }

    public setEditable():void{
        this.isBeingEdited = true;
        this.idBeforeEdit = this.id;
        $(`li[data-id=${this.id}]`).addClass('ctx-address-is-being-edited');
        $(`[data-id=${this.id}] .ctx-editable-address-string span`).attr('contenteditable', 'true');
        $(`[data-id=${this.id}] .ctx-editable-address-string span`).on('focus', function (event:any) {
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

    public cancelEditable(resetAddressString:boolean = true):void{
        $(`li[data-id=${this.id}]`).removeClass('ctx-address-is-being-edited');
        $(`[data-id=${this.id}] .ctx-editable-address-string span`).attr('contenteditable','false');
        if(resetAddressString){
            $(`[data-id=${this.id}] .ctx-editable-address-string`).find('span').remove();
            $(`[data-id=${this.id}] .ctx-editable-address-string`).prepend(this.getSplitGeoCodedFormattedAddressForEdit());
        }
        $(`[data-id=${this.id}] select`).attr('disabled', 'disabled');
        //action buttons
        $('[data-action="approve"], [data-action="cancel"]', `[data-id=${this.id}]`).addClass('ctx-hidden-action');
        $('[data-action="edit"]', `[data-id=${this.id}]`).removeClass('ctx-hidden-action');
        this.isBeingEdited = false;
    }
    
    public sendToApproveEdit():void{
        this.cancelEditable(false);
        let newAddressString:string = $(`[data-id=${this.idBeforeEdit}] .ctx-editable-address-string span`).text();
        let payload:any = {
            id : this.id,
            idBeforeEdit : this.idBeforeEdit,
            newAddressString : newAddressString,
            address : this,
            newAddressType : $(`[data-id=${this.id}] select`).val()
        };
        let addressEditEvent = new CustomEvent('address:edit', {detail : payload});
        window.dispatchEvent(addressEditEvent);
    }
    
    private handleEditApproved = (event:CustomEvent):void =>{
        if(this.idBeforeEdit === event.detail.idBeforeEdit){
            $(`[data-id=${this.idBeforeEdit}] .ctx-address-type-label`).text(this.addressType);
            $(`[data-id="${this.idBeforeEdit}"]`).attr('data-id',this.id);
        }
    }

    public freezeActions():void{
        this.isBeingEdited = true;
        this.idBeforeEdit = this.id;
        $(`li[data-id=${this.id}] .ctx-item-actions`).addClass('ctx-item-actions-disabled');
        $(`li[data-id=${this.id}] .ctx-item-actions a`).attr('disabled','disabled');
        $(`li[data-id=${this.id}] select`).attr('disabled','disabled');
    }

    public getGeoCodedFormattedAddressString():string{
        return this.myGeoCode.formatted_address;
    }

    private getSplitGeoCodedFormattedAddressForEdit():string{
        let addressFragments:string[] = this.myGeoCode.formatted_address.split(',');
        let editableAddress:string = '';
        for (let i:number = 0; i < addressFragments.length; i++){
            editableAddress += `<span class="ctx-address-fragment" contenteditable="false">${addressFragments[i].trim()}`;
            if(i < addressFragments.length-1){
                editableAddress += ', ';
            }
            editableAddress += `</span>`;
        }
        return editableAddress;
    }

    private generateAddressTypeSelect():string{
        return `<select name="" data-id="${this.id}" disabled="disabled" class="ctx-select">` +
               `<option value="business" ${this.addressType == 'business' ? 'selected' : ''}>Business</option>` +
			   `<option value="mailing" ${this.addressType == 'mailing' ? 'selected' : ''}>Mailing</option>` +
               `<option value="other" ${this.addressType == 'other' ? 'selected' : ''}>Other</option>` +
               `</select>`;
    }

    /*
    * Legacy address string
    * */
    public getAddressString():string{
        return this.addressData.address_1 + ', ' +
            this.addressData.address_2 + ', ' +
            this.addressData.city + ' ' +
            this.addressData.zipcode + ', ' +
            this.addressData.state + ', ' +
            this.addressData.country;
    }
}