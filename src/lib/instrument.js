const { execSync } = require('child_process')
const istanbul = require('istanbul-api')
const fs = require('fs')
/**
 * 完成代码插桩
 */
exports.instrument = async (rootDir) => {
  return new Promise((resolve, reject) => {
    const originalDir = `${rootDir}_original`
    // 原始目录备份到original，已备份就跳过
    try {
      fs.accessSync(originalDir, fs.constants.F_OK)
    } catch (error) {
      execSync(`mv ${rootDir} ${originalDir}`)
    }

    const config = istanbul.config.loadObject({
      verbose: true,
      instrumentation: {
        root: originalDir,
        // 'save-baseline': true,
        excludes: ['**/__mocks__/*']
      },
      reporting: {
        dir: rootDir
      }
    })
    // console.log(config)
    console.time('instrument')
    // 代码instrument之后再还原目录结构
    istanbul.instrument.run(
      config,
      {
        input: originalDir,
        output: rootDir
      },
      err => {
        console.timeEnd('instrument')
        // 成功返回rootDir
        !err ? resolve(rootDir) : reject(err)
      }
    )
  })
}
