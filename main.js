/**表示组件是否初次渲染 */
let isMount = true;
/**保存当前执行的hook */
let workInProgressHook = null;

/**每个组件都有一个对应的fiber */
const fiber = {
  /**fiber对应的组件 */
  stateNode: App,
  /**保存每个组件中hook调用顺序的链表 */
  memoizedState: null,
};

function useState(initState) {
  /**因为同一个hook在组件中可能多次调用，所以用一个变量保存当前调用的是哪个hook */
  let hook;
  if (isMount) {
    hook = {
      /**保存state */
      memoizedState: initState,
      /**指向下一个useState的调用 */
      next: null,
      /** 保存要更新的action */
      queue: {
        pending: null,
      },
    };
    /**该hook作为组件中第一个调用的hook时 */
    if (!fiber.memoizedState) {
      fiber.memoizedState = hook;
    } else {
      workInProgressHook.next = hook;
    }
    workInProgressHook = hook;
  } else {
    hook = workInProgressHook;
    workInProgressHook = workInProgressHook.next;
  }

  let baseState = hook.memoizedState;

  /**更新state */
  if (hook.queue.pending) {
    let firstUpdate = hook.queue.pending.next;

    do {
      const action = firstUpdate.action;
      baseState = action(baseState);
      firstUpdate = firstUpdate.next;
    } while (firstUpdate !== hook.queue.pending.next);

    hook.queue.pending = null;
  }

  hook.memoizedState = baseState;
  return [baseState, dispatchAction.bind(null, hook.queue)];
}

function dispatchAction(queue, action) {
  const update = {
    action,
    next: null,
  };
  /**环形链表 */
  if (queue.pending === null) {
    update.next = update;
  } else {
    update.next = queue.pending.next;
    queue.pending.next = update;
  }
  queue.pending = update;
  schedule();
}

/**每次组件渲染/更新都有一个对应的schedule */
function schedule() {
  workInProgressHook = fiber.memoizedState;
  const app = fiber.stateNode();
  /**isMount改为false, 之后的每次schedule调用都视为组件的更新 */
  isMount = false;
  return app;
}

function App() {
  const [num, updateNum] = useState(0);
  const [num2, updateNum2] = useState(0);
  console.log("isMount?", isMount);
  console.log("num", num);
  console.log("num2", num2);
  return {
    onClick() {
      updateNum((num) => num + 1);
    },
    onFocus() {
      updateNum2((num) => num + 1);
    },
  };
}

// 调用schedule模拟组件渲染, 挂载到window上方便调试
window.app = schedule();
