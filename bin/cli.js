#!/usr/bin/env node
/**
 * @author todd.ma
 * @date 2019/7/9
 */

const cmd = require('commander');
const path = require('path');
const {qncServerStart } = require('../src/index');

cmd
    .version('0.0.1')
    .usage('[options] <file>', '启动服务的文件')
    .option('--root-dir [dir]', '项目根目录')
    .arguments('<file>')
    .action( function(file, opts){
        const rootDir = path.resolve(process.env.PWD, opts.rootDir);
        const startFile = path.resolve(process.env.PWD, file);

        qncServerStart({
            rootDir,
            startFile
        })
    });

cmd.parse(process.argv);