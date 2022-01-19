// placeholder
import {createElement, Fragment, computed, reactive, propTypes, createComponent} from 'axii'
import {render} from 'yrden'

export default function Layout() {
  return render(Layout.schema, {})
}

Layout.getSchema = () => ({
  component: 'container',
  children: ['Here you can build your own layout.']
})

