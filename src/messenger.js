/**
 * 将子进程中的消息汇报给master
 */

setInterval(() => {
  process.send(__coverage__)
}, 1000)
