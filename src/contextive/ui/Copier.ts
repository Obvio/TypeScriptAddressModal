export class Copier {

    private clipboard:Clipboard;

    constructor(){}
    
    public init():void{
        this.clipboard = new Clipboard('[data-action="copy"]');
        this.clipboard.on('success', this.signalCopiedItem);
    }

    public destroy():void{
        this.clipboard.destroy();
    }

    private signalCopiedItem(event:any){
        let parentElement:any;
        let parentClass:string = $(event.trigger).data('context');
        parentElement = $(event.trigger).parentsUntil(parentClass).parent();
        parentElement.addClass('ctx-copied');
        setTimeout(function(){  parentElement.removeClass('ctx-copied') }, 1500);
        event.clearSelection();
    }
}