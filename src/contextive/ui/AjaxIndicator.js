export class AjaxIndicator {
    constructor() {
        this.element = '.ctx-ajax-indicator';
        this.onWillSend = (event) => {
            $(`${this.element}`).attr('data-status', 'yellow');
            $(`${this.element}`).text('sending');
            this.emptyTextLabel();
        };
        this.onSuccess = (event) => {
            $(`${this.element}`).attr('data-status', 'green');
            $(`${this.element}`).text('success!');
            this.emptyTextLabel();
        };
        this.onFail = (event) => {
            $(`${this.element}`).attr('data-status', 'red');
            $(`${this.element}`).text('failed, try again..');
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
            $(`${this.element}`).attr('data-status', '');
            $(`${this.element}`).text('');
        }, 1500);
    }
}
