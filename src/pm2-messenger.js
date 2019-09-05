/**
 * @author todd.ma
 * @email todd.ma@qunar.com
 * @create date 2019-08-21 14:14:52
 * @modify date 2019-08-22 23:36:11
 * @desc pm2启动的服务需要通过pm2的api方式监听
 */

const { fork } = require('child_process')
const path = require('path')
const pm2 = require('pm2')
const debug = require('debug')('qnc:pm2-messenger')

const { ProcessMessageType } = require('./lib/constant')

// pm2启动前后都可以调用
pm2.connect(function () {
  debug('pm2 connected %o', arguments)
  pm2.launchBus((err, bus) => {
    if (err) {
      debug('pm2 launchBus error -> %o', err)
    } else {
      // 启动覆盖率分析服务
      const reportProcess = fork(path.join(__dirname, './lib/report.js'))

      debug('reportProcess started %O', reportProcess)

      // 子进程异常退出后该进程也退出
      reportProcess.on('exit', function (code, signal) {
        console.log(`reportProcess exit! code:${code} signal:${signal}`)
        process.exit(1)
      })

      // 收集错误信息
      reportProcess.on('error', function (error) {
        console.error(`reportProcess got error: ${error}`)
      })

      reportProcess.on('message', function (message) {
        debug(`receive message ${message}`)
        if (message === 'ok') {
          debug('pm2 bus addlistener')
          bus.on(ProcessMessageType, packet => {
            debug('pm2 got bus message')
            reportProcess.connected && reportProcess.send(Object.assign(packet, { type: ProcessMessageType })) // must connected
          })
        }
      })
    }
  })
})
