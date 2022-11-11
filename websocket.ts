// import { wsurl } from '../api/url.js';

const wsurl = 'ws://127.0.0.1:6080';

interface dataType {
  name: string;
  message: string;
  result: string;
  value?: object;
  action: string;
}

interface requestType {
  name: string;
  action?: string;
  value?: object;
}

export class WsOpen extends WebSocket {
  event: any = {};
  backCommon: string[] = []; // 在连接未成功的时候缓存，等待连接成功后在执行指令

  constructor(wsurl: string) {
    // 创建连接
    super(wsurl, ['json']);

    this.onclose = (event) => {
      console.log('service is closed');
    };

    this.onerror = () => {
      console.log('service connect failed');
    };
  }

  // 初始化请求
  /**
   * 与组件渲染时配合请求数据
   * @param page 网页标识
   * @param fn 回调函数
   * @returns 
   */
  init(page: string, fn?: Function) {
    // console.log(this.readyState, page, fn);
    const _fn = () => {
      this.send(JSON.stringify({ page }));
      fn && fn();
    };

    if (this.readyState === 1) {
      _fn();
      return;
    }

    this.addEventListener('open', () => {
      if(this.backCommon.length) {
        this.backCommon.forEach(common => this.send(common));
      }
      _fn();
    });

    return this;
  }

  // 执行监听websocket消息
  run() {
    // console.log(this.event);
    this.onmessage = (e) => {
      let res = {};
      try {
        res = JSON.parse(e.data);
      } catch (error) {}

      this.listen(res);
    };
  }

  // 添加事件订阅
  /**
   * 
   * @param type 订阅名
   * @param fn 对应的回调
   */
  add(type: string, fn: Function) {
    this.event[type] = fn;
  }

  // 添加多个事件订阅
  addMore(typeObj: any) {
    Object.keys(typeObj).forEach((e) => this.add(e, typeObj[e]));
    // if (typeof typeObj !== 'object') return;
    // Object.keys(typeObj).forEach(type => {
    //   this.add(type, typeObj[type])
    // })
  }

  // 监听触发回调(监听者：name_action)
  // { name: 'test', action: 'get' } => test_get
  listen<T extends dataType>(data: T | {}) {
    let { name, action } = data as T;
    let type = `${name}`
    if(action) {
      type = `${name}_${action}`
    }
    if (!this.event[type]) return;

    this.event[type] ? this.event[type](data) : null;
  }

  // 发送请求
  request(params: requestType) {
    // 发送请求
    if(this.readyState === 1) {
      this.send(JSON.stringify(params));
    } else {
      this.backCommon.push(JSON.stringify(params));
    }
  }

  // 移除订阅
  remove(type: string, fn?: Function) {
    const fns = this.event[type];
    if (!fns) return;
    // 如果不传入取消订阅的函数，则移除所有相关的事件
    if (!fn) {
      delete this.event[type];
      return;
    }

    fns.some((_fn: any, key: number) => {
      if ((_fn = fn)) {
        fns.splice(key, 1);
        return true;
      }
    });
  }

  // 清空订阅
  clear() {
    Object.keys(this.event).length && (this.event = {});
  }
}

export default new WsOpen(wsurl);
