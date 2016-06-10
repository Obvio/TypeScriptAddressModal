export class Copier {
    constructor() {
    }
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
        setTimeout(function () { parentElement.removeClass('ctx-copied'); }, 1500);
        event.clearSelection();
    }
}
