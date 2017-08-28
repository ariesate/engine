import connect from '@cicada/render/lib/connect'
import { mapValues } from '@cicada/render/lib/util'

import * as Input from './Input'
import * as Button from './Button'

export default mapValues({ Input, Button }, connect)
