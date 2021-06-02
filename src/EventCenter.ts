export default class EventCenter {
    private listeners: Object = {};

    addEventListener(event: string, callback: Function, once: Boolean = false, response: boolean = false) {
        let self = this;
        let cb: Function = callback;
        // if (response) {
        //     cb = function fn(args?: any[]) {
        //         let r = callback.apply(null, args);
        //         this.source.postMessage({msg: event, args: [r]}, '*');
        //         return r;
        //     };
        // }
        if (once) {
            cb = function fn(args?: any[]) {
                callback.apply(null, args);
                self.removeEventListener(event, fn);
            };
        }
        this.listeners[event] ?
            this.listeners[event].push(cb) :
            this.listeners[event] = [cb];
    }

    removeEventListener(event: string, callback: Function) {
        let listeners: [] = this.listeners[event] || [];
        // @ts-ignore
        let i: number = listeners.indexOf(callback);
        if (i >= 0) {
            listeners.splice(i, 1)
        }
    }


    on(event: string, args?: any[], sessionID?: string, source?: Window, authKey?: string) {
        let listeners: Function[] | [] = this.listeners[event] || [];
        for (const listener of listeners) {
            console.log(`i'm called`)
            let r = listener.apply(null, args || []);
            if (sessionID) {
                source.postMessage({msg: sessionID, args: [r], authKey: authKey}, '*');
            }
        }
    }
}

