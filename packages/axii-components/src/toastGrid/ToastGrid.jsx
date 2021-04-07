/**@jsx createElement */
import { propTypes, createElement, ref, createComponent, useRef, useViewEffect, useImperativeHandle } from 'axii'
import Grid from 'tui-grid'
import {uuid} from "../util";
import 'tui-grid/dist/tui-grid.css'

export default function ToastGrid({ ref:parentRef, ...options }) {
  const id = uuid()
  const containerRef = useRef()
  let grid

  if (parentRef) {
    useImperativeHandle(parentRef, () => new Proxy({}, {
      get(target, method) {
        return grid[method]
      }
    }))
  }

  useViewEffect(() => {
    grid = new Grid({ el: containerRef.current, ...options} )
    Grid.applyTheme('striped')
  })

  return (
    <div id={id} ref={containerRef} block/>
  )
}

ToastGrid.forwardRef = true
