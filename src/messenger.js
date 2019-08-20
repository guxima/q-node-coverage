/**
 * @author todd.ma
 * @email todd.ma@qunar.com
 * @create date 2019-08-20 16:19:42
 * @modify date 2019-08-20 16:19:42
 * @desc 将fork进程中的 __coverage__ 信息发送给主进程
 */

setInterval(() => {
  process.send({
    type: 'process:msg',
    data: {
      coverage: __coverage__
    }
  })
}, 1000)
