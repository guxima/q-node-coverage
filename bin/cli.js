#!/usr/bin/env node
/**
 * @author todd.ma
 * @date 2019/7/9
 */

const program = require('commander')
const path = require('path')
const debug = require('debug')('qnc:cli')

const { qncServerStart } = require('../src/index')
const { instrument } = require('../src/lib/instrument')

// 默认命令，插桩、启动服务一体化
program
  .version('0.0.1')
  .usage('[options] <file>', '启动服务的文件')
  .option('-d, --root-dir <dir>', '项目根目录') // 如果赋空值，会导致命令行参数错乱
  .option('-p, --port <port>', '指定覆盖率服务的端口号，默认8987')
  .arguments('<file>')
  .action(function (file, opts) { // <file>有值时才会执行这个action
    debug('default command <file>:%s <root-dir>:%s <port>:%s', file, opts.rootDir || path.dirname(file), opts.port)
    const rootDir = path.resolve(process.env.PWD, opts.rootDir || path.dirname(file))
    const startFile = path.resolve(process.env.PWD, file)

    opts.port && (process.env.CoverageServerPort = opts.port) // coverage server 启动服务时使用
    qncServerStart({
      rootDir,
      startFile
    })
  })

// 启动pm2覆盖率收集服务
program
  .command('pm2-coverage-server')
  .description('通过pm2 api启动覆盖率服务')
  .action(function (opts) {
    const port = opts.parent.port
    debug('command pm2-coverage-server <port>:%d', port)
    port && (process.env.CoverageServerPort = port) // coverage server 启动服务时使用
    require('../src/pm2-messenger')
  })

// 对代码进行instrument化服务
program
  .command('instrument <root-dir>')
  .description('针对<root-dir>进行instrument化')
  .action(function (rootDir) {
    debug('command instrument <root-dir>:%s', rootDir)
    instrument(path.resolve(process.env.PWD, rootDir))
  })

program.parse(process.argv)
