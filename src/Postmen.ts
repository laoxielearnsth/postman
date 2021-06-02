import EventCenter from "./EventCenter";

export enum Role {
    Son,
    Parent
}

enum Status {
    Wait,
    Connected
}

interface baseBody {
    msg: string,
    args?: any[]
}

interface QueryBody extends baseBody {
    authKey: string,
    sessionID?: string
}

interface ResponseBody extends baseBody {
    authKey: string,
    sessionID?: string
}

interface Config {
    authKey: string,
    debug?: boolean,
    timeout?: number,
    role: Role;
    origin?: string
}


export default class Postmen {
    private status: number = Status.Wait;
    private readonly authKey: string;
    private eventCenter: EventCenter;
    private origin: string = '*';
    private timeout: number;
    private debug: boolean;
    private source?: Window;
    private targetWindow?: Window;
    private readonly role: Role;

    constructor(config: Config) {
        const {authKey, timeout, debug, role, origin} = config
        this.authKey = authKey;
        this.role = role;
        this.timeout = timeout || 5000;
        this.debug = debug || false;
        this.eventCenter = new EventCenter();
        origin && (this.origin = origin);
        let self = this;

        // 开始挂载监听message的事件
        window.addEventListener('message', (e) => {
            const {data, source, origin} = e;

            // 需要reply的 会有sessionID，这个取名感觉不太恰当
            const {msg, authKey, args, sessionID} = data;
            if (!this.auth(authKey)) return; // 过滤无关的message

            if (this.status === Status.Wait && msg === 'startConnect') { // 当未连接的时候
                args.unshift(source);
            }

            // 如果有sessionID这个参数则为要返回值的
            sessionID ?
                this.eventCenter.on(msg, args) :
                this.eventCenter.on(msg, args, sessionID, this.source, this.authKey)
        });

        if (this.role === Role.Parent) {
            // do nothing

        } else if (this.role === Role.Son) {
            // 注册，等待连接的事件
            this.eventCenter.addEventListener('startConnect', function f(args) {
                self.source = args[0];
                self.status = Status.Connected;
                // self.reply();
                self.source.postMessage({msg: 'waitForResponse', authKey: self.authKey}, '*')
                // self.eventCenter.removeEventListener('startConnect', f)
            }, true);
            // 禁止主动发起连接
        }
    }

    // 申请建立链接
    startConnect(son: HTMLIFrameElement) {
        if (this.role === Role.Son || this.status === Status.Connected) return;
        let self = this;
        let targetWindow = son.contentWindow;
        // add 等待响应的事件
        this.eventCenter.addEventListener('waitForResponse', function f() {
            self.status = Status.Connected;
            // 储存子的信息
            self.targetWindow = targetWindow;
            // self.eventCenter.removeEventListener('waitForResponse', f);
        }, true);
        targetWindow.postMessage({msg: 'startConnect', authKey: this.authKey}, '*');
    }

    // 收到建立链接的请求并返回,被event中心调用
    // reply() {
    // if (this.role === Role.Parent || this.status === Status.Connected) return;
    // const {source, data, origin} = e;
    // this.source = source;
    // this.source.postMessage({msg: 'waitForResponse', authKey: this.authKey}, '*');
    // }

    // 移除connect
    disconnect() {
        let targetWindow = this.targetWindow || this.source;
        targetWindow.postMessage({msg: 'disconnect'}, '*');
        this.disconnect2();
    }

    // 被动disconnect
    disconnect2() {
        this.status = Status.Wait;
        this.targetWindow = undefined;
        this.source = undefined;
    }

    // auth,可以还有origin等的认证
    auth(authKey): boolean {
        if (this.status === Status.Wait) {
            return false;
        }
        return authKey === this.authKey;
    }

    genSessionID(): string {
        return Math.random().toString(36).slice(-8)
    }

    simplePost(data: QueryBody) {
        this.targetWindow && this.targetWindow.postMessage(data, '*');
    }

    queryMessage(data: baseBody,): Promise<any> {
        let sessionID = this.genSessionID();
        let dddd: QueryBody = {...data, sessionID, authKey: this.authKey}

        // @ts-ignore
        return new Promise((resolve, reject) => {
            this.eventCenter.addEventListener(sessionID, (data: ResponseBody) => {
                resolve(data);
            }, true);
            this.targetWindow && this.targetWindow.postMessage(dddd, '*');
        });
    }

    responseMessage(data: ResponseBody) {
        this.source && this.source.postMessage(data, '*')
    }

    addEventListener(event: string, callback: Function, once: boolean = false, response: boolean = false) {
        this.eventCenter.addEventListener(event, callback, once, response);
    }


    removeEventListener(event: string, fn: Function) {
        this.eventCenter.removeEventListener(event, fn);
    }
}

// 返回函数
function helper(source: Window, sessionID: string, f: Function) {
    let r = f();
    source.postMessage({msg: sessionID, args: [r]}, '*');
    return r;
}

