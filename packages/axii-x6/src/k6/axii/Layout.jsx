/*
    引入antv布局方式
    TODO:对布局方式进行进一步修改
*/
import { GridLayout, CircularLayout, DagreLayout } from '@antv/layout'

export function generateLayout (config={},data) {
    const type = config.type || ''
    let curLayout;
    switch(type){
        case 'grid':{
            curLayout = new GridLayout(config)
            break
        }
        case 'circular':{
            curLayout = new CircularLayout(config)
            break
        }
        case 'dagre':{
            curLayout = new DagreLayout(config)
            break
        }
        default:{
            return
        }
    }
    curLayout.layout(data)
}