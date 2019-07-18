const {fork} = require('child_process');
const assert = require('assert');
const {instrument} = require('./lib/instrument');
const path = require('path')

/**
 * 启动覆盖率统计server
 * @param opt {rootDir, startFile} rootDir:服务根目录, startFile:启动文件
 */
exports.qncServerStart = async (opt) => {
    const {rootDir, startFile} = opt;
    assert(rootDir && startFile, 'rootDir or startFile nonempty');

    let err;

    try {
        err = await instrument(opt.rootDir);

        //启动用户指定的服务并携带信使
        const userProcess = fork(opt.startFile, {
            execArgv: ['--require', `${path.resolve(__dirname, './messenger.js')}`]
        });

        //启动覆盖率分析服务
        const reportProcess = fork(path.join(__dirname, './lib/report.js') );

        //获取用户服务进程内的覆盖率数据，发送给覆盖率服务进程
        userProcess.on('message', (m) => {
            reportProcess.send(m);
        });

    } catch (error) {
        console.log(error);
    }
}