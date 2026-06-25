import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import LinguisticNotation from "./plugins/linguistic-notation/index.js"

const config = await loadQuartzConfig()
config.plugins.transformers.unshift(LinguisticNotation())

export default config
export const layout = await loadQuartzLayout()
