/**
 * @author todd.ma
 * @email todd.ma@qunar.com
 * @create date 2019-08-21 14:14:52
 * @modify date 2019-08-21 14:14:52
 * @desc pm2启动的服务需要通过pm2的api方式监听
 */

 const {fork} = require('child_process')
 const path = require('path')
 const pm2 = require('pm2')
 const {ProcessMessageType} = require('./lib/constant')

 // pm2启动前后都可以调用
 pm2.connect(() => {
    pm2.launchBus( (err, bus) => {
        if(err){
            console.error('pm2 launchBus error -> ', err)
        }else{
            //启动覆盖率分析服务
            const reportProcess = fork(path.join(__dirname, './lib/report.js') );

            bus.on(ProcessMessageType, packet => {
                reportProcess.send(Object.assign(packet, {type: ProcessMessageType}))
            })
        }
    })
 })