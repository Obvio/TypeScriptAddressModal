export class AjaxIndicator {

    private element:string = '.ctx-ajax-indicator';

    constructor(){}
    
    public init():void{
        window.addEventListener('ajax:willSend', this.onWillSend);
        window.addEventListener('ajax:success', this.onSuccess);
        window.addEventListener('ajax:fail', this.onFail);
    }

    public destroy():void{
        window.removeEventListener('ajax:willSend', this.onWillSend);
        window.removeEventListener('ajax:success', this.onSuccess);
        window.removeEventListener('ajax:fail', this.onFail);
    }

    private onWillSend = (event:CustomEvent):void => {
        $(`${this.element}`).attr('data-status', 'yellow');
        $(`${this.element}`).text('sending');
        this.emptyTextLabel();
    }

    private onSuccess = (event:CustomEvent):void => {
        $(`${this.element}`).attr('data-status', 'green');
        $(`${this.element}`).text('success!');
        this.emptyTextLabel();
    }

    private onFail = (event:CustomEvent):void => {
        $(`${this.element}`).attr('data-status', 'red');
        $(`${this.element}`).text('failed, try again..');
    }

    private emptyTextLabel():void{
        setTimeout(()=>{
            $(`${this.element}`).attr('data-status', '');
            $(`${this.element}`).text('');
        }, 1500);
    }
}